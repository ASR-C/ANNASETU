"""
ANNASETU Matching Normalization
Transforms continuous real-world metrics into normalized scores (0-100).
Deterministic, pure mathematical functions with no side effects.
"""

def normalize_distance(distance_km: float, max_range_km: float = 30.0) -> float:
    """
    Closer is better.
    0 km -> 100
    max_range_km or greater -> 0
    """
    if distance_km <= 0:
        return 100.0
    if distance_km >= max_range_km:
        return 0.0
    return round(100.0 * (1.0 - (distance_km / max_range_km)), 2)

def normalize_eta(eta_minutes: float, max_eta_minutes: float = 90.0) -> float:
    """
    Faster delivery ETA is better.
    <= 10 mins -> 100
    >= max_eta_minutes -> 0
    """
    if eta_minutes <= 10.0:
        return 100.0
    if eta_minutes >= max_eta_minutes:
        return 0.0
    return round(100.0 * (1.0 - ((eta_minutes - 10.0) / (max_eta_minutes - 10.0))), 2)

def normalize_expiry_buffer(hours_until_expiry: float, max_buffer_hours: float = 24.0) -> float:
    """
    Higher buffer means safer food usability window.
    """
    if hours_until_expiry <= 0.5: # less than 30 mins left is critical
        return 10.0
    if hours_until_expiry >= max_buffer_hours:
        return 100.0
    return round(100.0 * (hours_until_expiry / max_buffer_hours), 2)

def normalize_need_fulfillment(allocated_kg: float, required_kg: float) -> float:
    """
    How well the donation fulfills the need.
    Exact 100% fulfillment -> 100.
    Over 100% or partial -> scaled appropriately.
    """
    if required_kg <= 0:
        return 0.0
    ratio = allocated_kg / required_kg
    if ratio >= 1.0:
        # Fulfills 100% or more of need
        return 100.0
    # Partial fulfillment: 50% fulfillment gives 65 score (still highly useful)
    return round(ratio * 100.0, 2)

def normalize_deadline_urgency(hours_until_need_deadline: float, window_hours: float = 12.0) -> float:
    """
    High urgency (closer to meal deadline) receives priority boost to prevent missing meal windows.
    <= 1 hour -> 95
    >= 12 hours -> 40
    """
    if hours_until_need_deadline <= 1.0:
        return 95.0
    if hours_until_need_deadline >= window_hours:
        return 40.0
    # Linear interpolation between 95 and 40
    t = (hours_until_need_deadline - 1.0) / (window_hours - 1.0)
    return round(95.0 - (t * 55.0), 2)

def normalize_route_efficiency(distance_km: float, straight_line_km: float) -> float:
    """
    Ratio of direct route vs actual travel distance.
    """
    if distance_km <= 0:
        return 100.0
    ratio = min(1.0, straight_line_km / max(straight_line_km, distance_km))
    return round(ratio * 100.0, 2)
