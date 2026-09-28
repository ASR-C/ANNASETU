"""
ANNASETU Concurrency-Safe Reservation & Allocation Engine
Guarantees atomicity and zero over-allocation.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from apps.api.models.db_models import Donation, Need, Reservation, Allocation
from apps.api.models.enums import DonationStatus, NeedStatus, ReservationStatus

def create_atomic_reservation(
    db: Session,
    donation_id: str,
    need_id: str,
    requested_kg: float,
    hold_minutes: int = 15
) -> Tuple[bool, Optional[Reservation], str]:
    """
    Atomically places a hold on a donation for an NGO need.
    Guarantees that total (reserved + allocated) never exceeds total quantity.
    """
    now = datetime.now(timezone.utc)
    
    # 1. Fetch donation with row-level locking when supported
    donation = db.query(Donation).filter(Donation.id == donation_id).with_for_update().first()
    if not donation:
        return False, None, "Donation not found"
        
    if donation.status not in (DonationStatus.AVAILABLE, DonationStatus.RESERVED):
        return False, None, f"Donation is no longer available (status: {donation.status.value})"

    # 2. Check need
    need = db.query(Need).filter(Need.id == need_id).with_for_update().first()
    if not need:
        return False, None, "Need not found"
        
    if need.status != NeedStatus.ACTIVE:
        return False, None, f"Need is not active (status: {need.status.value})"

    # 3. Clean up any existing stale holds for this donation first
    stale_holds = db.query(Reservation).filter(
        Reservation.donation_id == donation_id,
        Reservation.status == ReservationStatus.HELD
    ).all()
    for stale in stale_holds:
        stale_exp = stale.expires_at.replace(tzinfo=timezone.utc) if stale.expires_at.tzinfo is None else stale.expires_at
        if stale_exp < now:
            stale.status = ReservationStatus.EXPIRED
            donation.reserved_quantity_kg = max(0.0, donation.reserved_quantity_kg - stale.reserved_quantity_kg)

    # 4. Concurrency check: Remaining unreserved and unallocated quantity
    available_unreserved_kg = donation.quantity_kg - (donation.reserved_quantity_kg + donation.allocated_quantity_kg)
    need_remaining_kg = need.required_quantity_kg - need.fulfilled_quantity_kg

    if requested_kg > available_unreserved_kg:
        return False, None, f"Insufficient unreserved food. Available: {available_unreserved_kg} kg, Requested: {requested_kg} kg"

    actual_reserved_kg = min(requested_kg, need_remaining_kg, available_unreserved_kg)
    if actual_reserved_kg < need.minimum_acceptable_quantity_kg and available_unreserved_kg < need.minimum_acceptable_quantity_kg:
        return False, None, f"Available batch ({actual_reserved_kg} kg) is below minimum acceptable quantity ({need.minimum_acceptable_quantity_kg} kg)"

    # 5. Create reservation record
    reservation = Reservation(
        donation_id=donation_id,
        need_id=need_id,
        reserved_quantity_kg=actual_reserved_kg,
        status=ReservationStatus.HELD,
        expires_at=now + timedelta(minutes=hold_minutes)
    )
    db.add(reservation)
    
    # 6. Update donation hold
    donation.reserved_quantity_kg += actual_reserved_kg
    if donation.reserved_quantity_kg + donation.allocated_quantity_kg >= donation.quantity_kg:
        donation.status = DonationStatus.RESERVED

    db.commit()
    db.refresh(reservation)
    return True, reservation, "Hold acquired successfully"

def confirm_allocation_transactional(
    db: Session,
    reservation_id: str
) -> Tuple[bool, Optional[Allocation], str]:
    """
    Finalizes a reservation hold into an authoritative allocation.
    Atomically moves reserved_quantity_kg -> allocated_quantity_kg,
    updates need fulfillment, and generates Allocation.
    """
    now = datetime.now(timezone.utc)
    
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).with_for_update().first()
    if not reservation:
        return False, None, "Reservation not found"
        
    if reservation.status != ReservationStatus.HELD:
        return False, None, f"Reservation cannot be confirmed (current status: {reservation.status.value})"

    res_exp = reservation.expires_at.replace(tzinfo=timezone.utc) if reservation.expires_at.tzinfo is None else reservation.expires_at
    if res_exp < now:
        reservation.status = ReservationStatus.EXPIRED
        # Release hold
        donation = db.query(Donation).filter(Donation.id == reservation.donation_id).first()
        if donation:
            donation.reserved_quantity_kg = max(0.0, donation.reserved_quantity_kg - reservation.reserved_quantity_kg)
        db.commit()
        return False, None, "Reservation expired before confirmation"

    donation = db.query(Donation).filter(Donation.id == reservation.donation_id).with_for_update().first()
    need = db.query(Need).filter(Need.id == reservation.need_id).with_for_update().first()

    # Move from reserved to allocated
    donation.reserved_quantity_kg = max(0.0, donation.reserved_quantity_kg - reservation.reserved_quantity_kg)
    donation.allocated_quantity_kg += reservation.reserved_quantity_kg

    if donation.allocated_quantity_kg >= donation.quantity_kg:
        donation.status = DonationStatus.ALLOCATED

    # Update need
    need.fulfilled_quantity_kg += reservation.reserved_quantity_kg
    if need.fulfilled_quantity_kg >= need.required_quantity_kg:
        need.status = NeedStatus.FULFILLED

    # Update reservation status
    reservation.status = ReservationStatus.CONFIRMED
    reservation.confirmed_at = now

    # Create Allocation
    allocation = Allocation(
        reservation_id=reservation.id,
        donation_id=donation.id,
        need_id=need.id,
        allocated_quantity_kg=reservation.reserved_quantity_kg,
        allocated_at=now
    )
    db.add(allocation)

    db.commit()
    db.refresh(allocation)
    return True, allocation, "Allocation confirmed successfully"

def release_stale_holds(db: Session) -> int:
    """
    Background job to release any expired holds.
    """
    now = datetime.now(timezone.utc)
    stale_reservations = db.query(Reservation).filter(
        Reservation.status == ReservationStatus.HELD
    ).all()
    
    count = 0
    for res in stale_reservations:
        res_exp = res.expires_at.replace(tzinfo=timezone.utc) if res.expires_at.tzinfo is None else res.expires_at
        if res_exp < now:
            res.status = ReservationStatus.EXPIRED
            donation = db.query(Donation).filter(Donation.id == res.donation_id).first()
            if donation:
                donation.reserved_quantity_kg = max(0.0, donation.reserved_quantity_kg - res.reserved_quantity_kg)
                if donation.status == DonationStatus.RESERVED and (donation.reserved_quantity_kg + donation.allocated_quantity_kg < donation.quantity_kg):
                    donation.status = DonationStatus.AVAILABLE
            count += 1

    if count > 0:
        db.commit()
    return count
