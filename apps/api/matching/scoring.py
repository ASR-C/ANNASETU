"""
ANNASETU Rescue Priority Scoring Engine
Calculates deterministic 0-100 priority score using versioned weights.
Strict fairness guarantee: Sponsored or partner status NEVER influences matching priority.
"""

from typing import Dict, Any, Tuple
from datetime import datetime, timezone
from apps.api.matching.normalization import (
    normalize_distance,
    normalize_eta,
    normalize_expiry_buffer,
    normalize_need_fulfillment,
    normalize_deadline_urgency,
    normalize_route_efficiency,
)

DEFAULT_WEIGHTS = {
    "distance": 0.20,
    "eta": 0.20,
    "expiry_buffer": 0.15,
    "need_fulfillment": 0.15,
    "route_efficiency": 0.10,
    "driver_availability": 0.10,
    "deadline_urgency": 0.10,
}

def calculate_priority_score(
    distance_km: float,
    eta_minutes: float,
    donation_deadline: datetime,
    need_required_by: datetime,
    donation_available_kg: float,
    need_remaining_kg: float,
    nearby_driver_available: bool = True,
    current_time: datetime = None,
    weights: Dict[str, float] = None
) -> Tuple[float, Dict[str, float]]:
    """
    Computes total score (0-100) and factor breakdown.
    Returns: (total_score, factor_breakdown)
    """
    now = current_time or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    if donation_deadline and donation_deadline.tzinfo is None:
        donation_deadline = donation_deadline.replace(tzinfo=timezone.utc)
    if need_required_by and need_required_by.tzinfo is None:
        need_required_by = need_required_by.replace(tzinfo=timezone.utc)
    active_weights = weights or DEFAULT_WEIGHTS
    
    # 1. Distance factor
    distance_score = normalize_distance(distance_km)
    
    # 2. ETA factor
    eta_score = normalize_eta(eta_minutes)
    
    # 3. Expiry buffer factor
    hours_until_food_expiry = max(0.0, (donation_deadline - now).total_seconds() / 3600.0)
    expiry_score = normalize_expiry_buffer(hours_until_food_expiry)
    
    # 4. Need fulfillment factor
    allocatable_kg = min(donation_available_kg, need_remaining_kg)
    fulfillment_score = normalize_need_fulfillment(allocatable_kg, need_remaining_kg)
    
    # 5. Route efficiency factor
    # For single stop, straight line equals route distance
    route_efficiency_score = normalize_route_efficiency(distance_km, distance_km * 0.85)
    
    # 6. Driver availability factor
    driver_score = 95.0 if nearby_driver_available else 30.0
    
    # 7. Deadline urgency factor
    hours_until_need_deadline = max(0.1, (need_required_by - now).total_seconds() / 3600.0)
    urgency_score = normalize_deadline_urgency(hours_until_need_deadline)
    
    factors = {
        "distance": round(distance_score, 1),
        "eta": round(eta_score, 1),
        "expiry_buffer": round(expiry_score, 1),
        "need_fulfillment": round(fulfillment_score, 1),
        "route_efficiency": round(route_efficiency_score, 1),
        "driver_availability": round(driver_score, 1),
        "deadline_urgency": round(urgency_score, 1),
    }
    
    # Weighted sum
    total_score = (
        factors["distance"] * active_weights.get("distance", 0.20) +
        factors["eta"] * active_weights.get("eta", 0.20) +
        factors["expiry_buffer"] * active_weights.get("expiry_buffer", 0.15) +
        factors["need_fulfillment"] * active_weights.get("need_fulfillment", 0.15) +
        factors["route_efficiency"] * active_weights.get("route_efficiency", 0.10) +
        factors["driver_availability"] * active_weights.get("driver_availability", 0.10) +
        factors["deadline_urgency"] * active_weights.get("deadline_urgency", 0.10)
    )
    
    final_score = round(max(0.0, min(100.0, total_score)), 1)
    return final_score, factors
