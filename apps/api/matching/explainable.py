"""
ANNASETU Explainable Matching
Transforms numeric factor breakdowns into clear, human-readable insights.
Powering the "Why this match?" UI modal.
"""

from typing import Dict, List

def generate_match_explanation(score: float, factors: Dict[str, float]) -> List[str]:
    """
    Generates bullet points explaining the score highlights and bottlenecks.
    """
    explanations: List[str] = []
    
    # Distance / Proximity
    dist = factors.get("distance", 0)
    if dist >= 85:
        explanations.append("Immediate proximity: Very short transit distance minimizes food quality degradation.")
    elif dist >= 60:
        explanations.append("Moderate transit distance: Feasible delivery within standard operational zone.")
    else:
        explanations.append("Longer distance: Incurs higher transport overhead but remains within service limits.")

    # Need Fulfillment
    ful = factors.get("need_fulfillment", 0)
    if ful >= 90:
        explanations.append("High volume alignment: Rescued surplus substantially satisfies the NGO's requested quantity.")
    elif ful >= 50:
        explanations.append("Partial fulfillment: Provides a valuable meal contribution meeting minimum batch thresholds.")

    # Expiry Buffer
    exp = factors.get("expiry_buffer", 0)
    if exp >= 85:
        explanations.append("Safe consumption window: Generous shelf-life buffer allows orderly distribution to beneficiaries.")
    elif exp < 50:
        explanations.append("Time critical: Food must be consumed promptly upon delivery.")

    # Deadline Urgency
    urg = factors.get("deadline_urgency", 0)
    if urg >= 80:
        explanations.append("Urgent meal schedule: Scheduled distribution window approaches shortly.")

    # Driver Logistics
    drv = factors.get("driver_availability", 0)
    if drv >= 80:
        explanations.append("Logistics ready: Active verified drivers with appropriate vehicle capacity are nearby.")
    else:
        explanations.append("Logistics dispatch: Widening driver search radius to secure pickup.")

    return explanations
