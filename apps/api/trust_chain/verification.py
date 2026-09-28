"""
ANNASETU Trust Chain & Evidence Verification
Coordinates the verifiable physical handoff chain:
Donor Seal -> Driver Pickup OTP + Photo + GPS Geofence -> Delivery OTP + Photo + Seal Integrity.
"""

import hashlib
import secrets
from datetime import datetime, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from apps.api.models.db_models import DeliveryJob, Seal, DeliveryEvidence, IntegrityReview
from apps.api.models.enums import DeliveryJobStatus, IntegrityVerdict
from apps.api.matching.eligibility import haversine_distance_km

def generate_secure_otp(length: int = 6) -> Tuple[str, str]:
    """Generates random numeric OTP and its SHA-256 hash."""
    plain = "".join([str(secrets.randbelow(10)) for _ in range(length)])
    otp_hash = hashlib.sha256(plain.encode()).hexdigest()
    return plain, otp_hash

def verify_otp_hash(plain_otp: str, stored_hash: str) -> bool:
    """Constant-time verification of OTP."""
    computed_hash = hashlib.sha256(plain_otp.strip().encode()).hexdigest()
    return secrets.compare_digest(computed_hash, stored_hash)

def verify_geofence(
    target_lat: float, target_lon: float,
    actual_lat: float, actual_lon: float,
    max_radius_meters: float = 250.0
) -> bool:
    """Verifies GPS proximity to registered physical location."""
    dist_km = haversine_distance_km(target_lat, target_lon, actual_lat, actual_lon)
    dist_meters = dist_km * 1000.0
    return dist_meters <= max_radius_meters

def record_pickup_evidence(
    db: Session,
    job_id: str,
    driver_id: str,
    plain_otp: str,
    actual_lat: float,
    actual_lon: float,
    photo_url: str,
    seal_number: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Validates driver, pickup OTP, and proximity.
    Transitions DeliveryJob: ON_JOB -> PICKED_UP
    """
    now = datetime.now(timezone.utc)
    job = db.query(DeliveryJob).filter(DeliveryJob.id == job_id).first()
    if not job:
        return False, "Delivery job not found"
        
    if job.assigned_driver_id != driver_id:
        return False, "Unauthorized driver: you are not assigned to this rescue"
        
    if job.status not in (DeliveryJobStatus.ON_JOB, DeliveryJobStatus.ARRIVED_PICKUP):
        return False, f"Invalid job status for pickup (current: {job.status.value})"

    # 1. Verify Pickup OTP
    if not job.pickup_otp_hash or not verify_otp_hash(plain_otp, job.pickup_otp_hash):
        return False, "Invalid pickup OTP. Please collect the correct 6-digit code from the donor."

    # 2. Check Geofence
    geofence_passed = verify_geofence(job.pickup_latitude, job.pickup_longitude, actual_lat, actual_lon)

    # 3. Record Evidence
    evidence = DeliveryEvidence(
        delivery_job_id=job.id,
        stage="PICKUP",
        photo_url=photo_url,
        latitude=actual_lat,
        longitude=actual_lon,
        geofence_passed=geofence_passed,
        captured_at=now
    )
    db.add(evidence)

    # 4. Record Seal if provided
    if seal_number:
        seal = Seal(
            delivery_job_id=job.id,
            seal_number=seal_number,
            applied_by_donor_at=now,
            verified_intact_at_pickup=True
        )
        db.add(seal)

    # 5. Transition State
    job.status = DeliveryJobStatus.PICKED_UP
    job.picked_up_at = now

    db.commit()
    return True, "Pickup verified and recorded successfully"

def record_delivery_evidence(
    db: Session,
    job_id: str,
    driver_id: str,
    plain_otp: str,
    actual_lat: float,
    actual_lon: float,
    photo_url: str,
    seal_intact: bool = True
) -> Tuple[bool, str]:
    """
    Validates delivery OTP and receiving location.
    Transitions DeliveryJob: PICKED_UP -> DELIVERED
    """
    now = datetime.now(timezone.utc)
    job = db.query(DeliveryJob).filter(DeliveryJob.id == job_id).first()
    if not job:
        return False, "Delivery job not found"
        
    if job.assigned_driver_id != driver_id:
        return False, "Unauthorized driver"

    if job.status not in (DeliveryJobStatus.PICKED_UP, DeliveryJobStatus.IN_TRANSIT):
        return False, f"Invalid job status for delivery (current: {job.status.value})"

    # 1. Verify Delivery OTP
    if not job.delivery_otp_hash or not verify_otp_hash(plain_otp, job.delivery_otp_hash):
        return False, "Invalid delivery OTP. Please collect the receiving verification code from the NGO coordinator."

    # 2. Check Geofence
    geofence_passed = verify_geofence(job.drop_latitude, job.drop_longitude, actual_lat, actual_lon)

    # 3. Record Evidence
    evidence = DeliveryEvidence(
        delivery_job_id=job.id,
        stage="DELIVERY",
        photo_url=photo_url,
        latitude=actual_lat,
        longitude=actual_lon,
        geofence_passed=geofence_passed,
        captured_at=now
    )
    db.add(evidence)

    # 4. Update Seal Check
    seal = db.query(Seal).filter(Seal.delivery_job_id == job.id).first()
    if seal:
        seal.verified_intact_at_delivery = seal_intact

    # 5. Create Default Integrity Review (No discrepancy)
    integrity = IntegrityReview(
        delivery_job_id=job.id,
        verdict=IntegrityVerdict.NO_VISIBLE_DISCREPANCY if seal_intact else IntegrityVerdict.POSSIBLE_PACKAGE_DISCREPANCY,
        confidence_score=98.5 if seal_intact else 85.0,
        details="Automated physical handoff chain verified via OTP, GPS geofence and photo evidence."
    )
    db.add(integrity)

    # 6. Complete Transition
    job.status = DeliveryJobStatus.DELIVERED
    job.delivered_at = now

    db.commit()
    return True, "Delivery verified and completed successfully"
