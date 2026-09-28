"""
ANNASETU Reservations & Allocation Router
Processes reservation holds, allocation commits, delivery job generation, and wallet fare holds.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.database import SyncSessionLocal
from apps.api.models.schemas import ReservationCreate, ReservationResponse
from apps.api.models.db_models import Donation, Need, DeliveryJob, Organization
from apps.api.models.enums import DeliveryJobStatus
from apps.api.allocation.engine import create_atomic_reservation, confirm_allocation_transactional
from apps.api.delivery.pricing import calculate_delivery_fare, recommend_vehicle_class
from apps.api.matching.eligibility import haversine_distance_km, estimate_travel_minutes
from apps.api.trust_chain.verification import generate_secure_otp
from apps.api.finance.wallet_service import reserve_fare_for_job

router = APIRouter(prefix="/reservations", tags=["Reservations & Allocations"])

@router.post("", response_model=ReservationResponse)
def make_reservation_and_allocate(req: ReservationCreate):
    with SyncSessionLocal() as db:
        # 1. Atomic reservation hold
        success, reservation, msg = create_atomic_reservation(
            db=db,
            donation_id=req.donation_id,
            need_id=req.need_id,
            requested_kg=req.requested_quantity_kg
        )
        if not success:
            raise HTTPException(status_code=400, detail=msg)

        # 2. Confirm allocation atomically
        alloc_success, allocation, alloc_msg = confirm_allocation_transactional(
            db=db,
            reservation_id=reservation.id
        )
        if not alloc_success:
            raise HTTPException(status_code=400, detail=alloc_msg)

        # 3. Fetch details for delivery job
        donation = db.query(Donation).filter(Donation.id == req.donation_id).first()
        need = db.query(Need).filter(Need.id == req.need_id).first()

        dist_km = haversine_distance_km(donation.latitude, donation.longitude, need.latitude, need.longitude)
        duration_min = estimate_travel_minutes(dist_km)
        v_class = recommend_vehicle_class(allocation.allocated_quantity_kg)

        fare_quote = calculate_delivery_fare(
            weight_kg=allocation.allocated_quantity_kg,
            distance_km=dist_km,
            duration_min=duration_min,
            num_stops=1,
            vehicle_class=v_class
        )

        # 4. Generate secure OTPs for trust chain handoffs
        pickup_plain_otp, pickup_otp_hash = generate_secure_otp(6)
        delivery_plain_otp, delivery_otp_hash = generate_secure_otp(6)

        # 5. Create Delivery Job
        job = DeliveryJob(
            allocation_id=allocation.id,
            donation_id=donation.id,
            need_id=need.id,
            donor_id=donation.donor_id,
            ngo_id=need.ngo_id,
            vehicle_class=v_class.value,
            total_quantity_kg=allocation.allocated_quantity_kg,
            pickup_address=donation.pickup_address,
            pickup_latitude=donation.latitude,
            pickup_longitude=donation.longitude,
            drop_address=need.receiving_address,
            drop_latitude=need.latitude,
            drop_longitude=need.longitude,
            estimated_distance_km=dist_km,
            estimated_duration_min=duration_min,
            delivery_fare_inr=fare_quote["delivery_fare"],
            service_fee_inr=fare_quote["service_fee"],
            total_ngo_charge_inr=fare_quote["total_ngo_charge"],
            driver_earnings_inr=fare_quote["driver_earnings"],
            status=DeliveryJobStatus.AVAILABLE,
            pickup_otp_hash=pickup_otp_hash,
            delivery_otp_hash=delivery_otp_hash
        )
        db.add(job)
        db.flush()

        # 6. Reserve estimated fare in NGO wallet
        reserve_fare_for_job(db, need.ngo_id, job.id, fare_quote["total_ngo_charge"])

        db.commit()
        db.refresh(reservation)

        return {
            "id": reservation.id,
            "donation_id": reservation.donation_id,
            "need_id": reservation.need_id,
            "reserved_quantity_kg": reservation.reserved_quantity_kg,
            "status": reservation.status,
            "expires_at": reservation.expires_at,
            "confirmed_at": reservation.confirmed_at
        }
