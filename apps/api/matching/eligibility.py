"""
ANNASETU Eligibility Filtering Engine
Evaluates 9 deterministic criteria to determine if a donation can be paired with an NGO need.
Stores precise rejection reasons for auditability and transparent feedback.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import Tuple, List, Optional
from apps.api.models.enums import NeedStatus

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def estimate_travel_minutes(distance_km: float, avg_speed_kmh: float = 25.0) -> float:
    """Estimates urban travel duration with traffic buffer."""
    if distance_km <= 0:
        return 10.0 # base loading & handoff
    travel_time_hours = distance_km / avg_speed_kmh
    # 10 minutes fixed prep & handoff + travel time
    return round(10.0 + (travel_time_hours * 60.0), 1)

def check_eligibility(
    donation_category: str,
    donation_is_veg: bool,
    donation_available_kg: float,
    donation_deadline: datetime,
    donation_lat: float,
    donation_lon: float,
    need_status: NeedStatus,
    need_category: str,
    need_is_veg: bool,
    need_remaining_kg: float,
    need_min_acceptable_kg: float,
    need_required_by: datetime,
    need_lat: float,
    need_lon: float,
    ngo_receiving_start: str = "08:00:00",
    ngo_receiving_end: str = "22:00:00",
    ngo_daily_capacity_kg: float = 500.0,
    current_time: Optional[datetime] = None,
    max_radius_km: float = 35.0,
) -> Tuple[bool, List[str], float, float]:
    """
    Evaluates 9 deterministic eligibility criteria.
    Returns: (is_eligible, rejection_reasons, distance_km, estimated_duration_min)
    """
    reasons: List[str] = []
    now = current_time or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    if donation_deadline and donation_deadline.tzinfo is None:
        donation_deadline = donation_deadline.replace(tzinfo=timezone.utc)
    if need_required_by and need_required_by.tzinfo is None:
        need_required_by = need_required_by.replace(tzinfo=timezone.utc)
    
    # 1. Need active status
    if need_status != NeedStatus.ACTIVE:
        reasons.append(f"Need is not active (current status: {need_status.value})")

    # 2. Category compatibility
    if donation_category != need_category and need_category != "ANY":
        reasons.append(f"Food category mismatch: donation is '{donation_category}', need requests '{need_category}'")

    # 3. Vegetarian compatibility
    if need_is_veg and not donation_is_veg:
        reasons.append("Vegetarian compatibility violation: need requires pure vegetarian food")

    # 4. NGO capacity
    if donation_available_kg > ngo_daily_capacity_kg:
        reasons.append(f"NGO capacity exceeded: donation ({donation_available_kg} kg) exceeds NGO daily capacity ({ngo_daily_capacity_kg} kg)")

    # 5. Minimum quantity check
    if donation_available_kg < need_min_acceptable_kg:
        reasons.append(f"Insufficient quantity: available {donation_available_kg} kg is below NGO minimum threshold {need_min_acceptable_kg} kg")

    # 6. Distance & delivery feasibility
    distance_km = haversine_distance_km(donation_lat, donation_lon, need_lat, need_lon)
    if distance_km > max_radius_km:
        reasons.append(f"Delivery distance ({distance_km} km) exceeds maximum feasible radius ({max_radius_km} km)")

    eta_minutes = estimate_travel_minutes(distance_km)
    estimated_arrival = now + timedelta(minutes=eta_minutes)

    # 7. Food expiry check
    # Ensure arrival is at least 20 minutes before food shelf-life deadline
    buffer_before_food_expiry = (donation_deadline - estimated_arrival).total_seconds() / 60.0
    if buffer_before_food_expiry < 20.0:
        reasons.append(f"Food expiry risk: estimated arrival ({estimated_arrival.strftime('%H:%M')}) is too close to food deadline ({donation_deadline.strftime('%H:%M')})")

    # 8. Deadline compatibility (need required_by)
    if estimated_arrival > need_required_by:
        reasons.append(f"Deadline violation: estimated arrival ({estimated_arrival.strftime('%H:%M')}) exceeds required-by time ({need_required_by.strftime('%H:%M')})")

    # 9. Receiving hours
    # Parse receiving start and end
    try:
        start_hour, start_min = map(int, ngo_receiving_start.split(":")[:2])
        end_hour, end_min = map(int, ngo_receiving_end.split(":")[:2])
        arrival_hour = estimated_arrival.hour
        arrival_min = estimated_arrival.minute
        arrival_time_val = arrival_hour * 60 + arrival_min
        start_val = start_hour * 60 + start_min
        end_val = end_hour * 60 + end_min
        
        if not (start_val <= arrival_time_val <= end_val):
            reasons.append(f"Outside receiving hours: estimated arrival {estimated_arrival.strftime('%H:%M')} is outside NGO receiving hours ({ngo_receiving_start} - {ngo_receiving_end})")
    except Exception:
        pass # Fallback gracefully if time format is non-standard

    is_eligible = len(reasons) == 0
    return is_eligible, reasons, distance_km, eta_minutes
