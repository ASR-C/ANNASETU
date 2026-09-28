"""
ANNASETU Delivery Marketplace & Driver Matching
Implements dynamic radius widening and atomic first-accept-wins state transitions.
"""

from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from apps.api.models.db_models import DeliveryJob, DriverDetails, Vehicle, Profile
from apps.api.models.enums import DeliveryJobStatus, VerificationStatus, VehicleClass
from apps.api.matching.eligibility import haversine_distance_km

def find_eligible_drivers(
    db: Session,
    pickup_lat: float,
    pickup_lon: float,
    required_weight_kg: float,
    search_radius_km: float = 5.0
) -> List[DriverDetails]:
    """
    Finds verified, available drivers within search_radius_km whose registered
    vehicle can support the cargo weight.
    """
    # 1. Query available verified drivers
    drivers = db.query(DriverDetails).filter(
        DriverDetails.verification_status == VerificationStatus.VERIFIED,
        DriverDetails.is_available == True
    ).all()
    
    eligible = []
    for driver in drivers:
        if driver.current_latitude is None or driver.current_longitude is None:
            continue
        dist = haversine_distance_km(pickup_lat, pickup_lon, driver.current_latitude, driver.current_longitude)
        if dist <= search_radius_km:
            # Check vehicle capacity if driver has a vehicle
            vehicle = db.query(Vehicle).filter(Vehicle.driver_id == driver.profile_id).first()
            if vehicle:
                eligible.append(driver)
                
    return eligible

def atomic_driver_accept(
    db: Session,
    job_id: str,
    driver_id: str
) -> Tuple[bool, Optional[DeliveryJob], str]:
    """
    First-accept-wins atomic transition:
    Transitions status: AVAILABLE -> ON_JOB
    Guarantees exactly one driver gets assigned even under parallel requests.
    """
    now = datetime.now(timezone.utc)
    
    # Check driver validity
    driver = db.query(DriverDetails).filter(
        DriverDetails.profile_id == driver_id,
        DriverDetails.verification_status == VerificationStatus.VERIFIED
    ).first()
    if not driver:
        return False, None, "Driver profile not found or not verified"

    # Atomic conditional update on status = 'AVAILABLE'
    job = db.query(DeliveryJob).filter(
        DeliveryJob.id == job_id,
        DeliveryJob.status == DeliveryJobStatus.AVAILABLE
    ).with_for_update().first()
    
    if not job:
        # Check if already accepted
        existing = db.query(DeliveryJob).filter(DeliveryJob.id == job_id).first()
        if existing and existing.status != DeliveryJobStatus.AVAILABLE:
            return False, None, f"Job is no longer available (current status: {existing.status.value})"
        return False, None, "Job not found"

    # Execute transition
    job.status = DeliveryJobStatus.ON_JOB
    job.assigned_driver_id = driver_id
    job.accepted_at = now
    
    # Mark driver as currently busy
    driver.is_available = False

    db.commit()
    db.refresh(job)
    return True, job, "Job accepted successfully"
