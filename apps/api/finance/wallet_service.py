"""
ANNASETU Financial Ledger & Settlement Engine
Append-only double-entry financial ledger for NGO wallets, reserves, and driver payouts.
"""

from datetime import datetime, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from apps.api.models.db_models import Wallet, WalletLedger, DeliveryJob, Settlement, DriverDetails
from apps.api.models.enums import LedgerEntryType, DeliveryJobStatus

def get_or_create_wallet(db: Session, organization_id: str) -> Wallet:
    """Retrieves or initializes an NGO organization wallet."""
    wallet = db.query(Wallet).filter(Wallet.organization_id == organization_id).first()
    if not wallet:
        wallet = Wallet(organization_id=organization_id, balance_inr=0.0, reserved_inr=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

def reserve_fare_for_job(
    db: Session,
    ngo_org_id: str,
    job_id: str,
    amount_inr: float
) -> Tuple[bool, str]:
    """
    Places a reserve on the NGO's wallet before driver dispatch.
    Verifies that unreserved balance >= amount_inr.
    """
    wallet = db.query(Wallet).filter(Wallet.organization_id == ngo_org_id).with_for_update().first()
    if not wallet:
        return False, "NGO wallet not found"

    available_balance = wallet.balance_inr - wallet.reserved_inr
    if available_balance < amount_inr:
        return False, f"Insufficient wallet balance. Required: ₹{amount_inr:.2f}, Available: ₹{available_balance:.2f}"

    balance_before = wallet.balance_inr
    wallet.reserved_inr += amount_inr

    # Append to ledger
    ledger_entry = WalletLedger(
        wallet_id=wallet.id,
        delivery_job_id=job_id,
        entry_type=LedgerEntryType.RESERVE,
        amount_inr=amount_inr,
        balance_before_inr=balance_before,
        balance_after_inr=wallet.balance_inr,
        description=f"Logistics reserve hold for delivery rescue #{job_id[:8]}",
        reference_id=f"RES-{job_id[:8]}"
    )
    db.add(ledger_entry)
    db.commit()
    return True, "Fare hold reserved successfully"

def settle_delivery_transaction(
    db: Session,
    job_id: str
) -> Tuple[bool, Optional[Settlement], str]:
    """
    Completes transactional settlement upon delivery:
    1. Releases reserve.
    2. Deducts final charge from NGO wallet.
    3. Writes driver payout & platform service fee.
    4. Generates immutable Settlement record.
    5. Updates driver total completed rescues and frees driver availability.
    """
    now = datetime.now(timezone.utc)
    
    # Check if already settled
    existing = db.query(Settlement).filter(Settlement.delivery_job_id == job_id).first()
    if existing:
        return True, existing, "Already settled"

    job = db.query(DeliveryJob).filter(DeliveryJob.id == job_id).with_for_update().first()
    if not job:
        return False, None, "Delivery job not found"
        
    if job.status != DeliveryJobStatus.DELIVERED:
        return False, None, f"Cannot settle job before delivery confirmation (current status: {job.status.value})"

    wallet = db.query(Wallet).filter(Wallet.organization_id == job.ngo_id).with_for_update().first()
    if not wallet:
        return False, None, "NGO wallet not found"

    total_charge = job.total_ngo_charge_inr
    driver_payout = job.driver_earnings_inr
    platform_fee = job.service_fee_inr

    # 1. Release reserve
    wallet.reserved_inr = max(0.0, wallet.reserved_inr - total_charge)
    release_entry = WalletLedger(
        wallet_id=wallet.id,
        delivery_job_id=job.id,
        entry_type=LedgerEntryType.RELEASE_RESERVE,
        amount_inr=total_charge,
        balance_before_inr=wallet.balance_inr,
        balance_after_inr=wallet.balance_inr,
        description=f"Released reserve hold upon rescue delivery #{job.id[:8]}",
        reference_id=f"REL-{job.id[:8]}"
    )
    db.add(release_entry)

    # 2. Charge wallet
    bal_before = wallet.balance_inr
    wallet.balance_inr = max(0.0, wallet.balance_inr - total_charge)
    charge_entry = WalletLedger(
        wallet_id=wallet.id,
        delivery_job_id=job.id,
        entry_type=LedgerEntryType.CHARGE,
        amount_inr=total_charge,
        balance_before_inr=bal_before,
        balance_after_inr=wallet.balance_inr,
        description=f"Settled logistics and 12% platform fee for rescue delivery #{job.id[:8]}",
        reference_id=f"CHG-{job.id[:8]}"
    )
    db.add(charge_entry)

    # 3. Create Settlement
    settlement = Settlement(
        delivery_job_id=job.id,
        total_charged_inr=total_charge,
        driver_payout_inr=driver_payout,
        platform_fee_inr=platform_fee,
        status="SETTLED",
        settled_at=now
    )
    db.add(settlement)

    # 4. Update Driver Stats & Availability
    if job.assigned_driver_id:
        driver = db.query(DriverDetails).filter(DriverDetails.profile_id == job.assigned_driver_id).first()
        if driver:
            driver.total_rescues_completed += 1
            driver.is_available = True

    db.commit()
    db.refresh(settlement)
    return True, settlement, "Delivery settled successfully"

def topup_ngo_wallet(
    db: Session,
    ngo_org_id: str,
    amount_inr: float,
    description: str = "CSR Top-up Deposit"
) -> Wallet:
    """Adds balance to an NGO wallet with an append-only DEPOSIT ledger entry."""
    wallet = get_or_create_wallet(db, ngo_org_id)
    bal_before = wallet.balance_inr
    wallet.balance_inr += amount_inr

    entry = WalletLedger(
        wallet_id=wallet.id,
        entry_type=LedgerEntryType.DEPOSIT,
        amount_inr=amount_inr,
        balance_before_inr=bal_before,
        balance_after_inr=wallet.balance_inr,
        description=description,
        reference_id=f"TOPUP-{int(datetime.now().timestamp())}"
    )
    db.add(entry)
    db.commit()
    db.refresh(wallet)
    return wallet
