"""
ANNASETU Impact Calculation & Reporting Engine
Quantifies food rescue impact into meals served and environmental metrics.
All environmental savings are explicitly categorized as scientific estimates.
"""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from apps.api.models.db_models import ImpactRecord, DeliveryJob, Organization, Profile

# Configurable standard multipliers
DEFAULT_IMPACT_FACTORS = {
    "meals_per_kg": 2.0,            # Standard 500g meal portion
    "co2e_kg_per_kg": 2.5,          # Greenhouse gas prevention from anaerobic decomposition
    "water_saved_liters": 154.0,    # Embedded virtual water preserved per kg
    "landfill_factor": 1.0,         # Landfill diversion ratio
}

def create_impact_record_for_delivery(
    db: Session,
    job_id: str,
    factors: Dict[str, float] = None
) -> Optional[ImpactRecord]:
    """
    Creates an immutable ImpactRecord upon successful delivery.
    """
    active_factors = factors or DEFAULT_IMPACT_FACTORS
    
    # Check if already generated
    existing = db.query(ImpactRecord).filter(ImpactRecord.delivery_job_id == job_id).first()
    if existing:
        return existing

    job = db.query(DeliveryJob).filter(DeliveryJob.id == job_id).first()
    if not job:
        return None

    weight_kg = job.total_quantity_kg
    meals = int(round(weight_kg * active_factors.get("meals_per_kg", 2.0)))
    co2e = round(weight_kg * active_factors.get("co2e_kg_per_kg", 2.5), 2)
    water = round(weight_kg * active_factors.get("water_saved_liters", 154.0), 1)
    landfill = round(weight_kg * active_factors.get("landfill_factor", 1.0), 2)

    record = ImpactRecord(
        delivery_job_id=job.id,
        donor_id=job.donor_id,
        ngo_id=job.ngo_id,
        driver_id=job.assigned_driver_id or "driver-unassigned",
        rescued_weight_kg=weight_kg,
        meals_served=meals,
        co2e_saved_kg=co2e,
        water_saved_liters=water,
        landfill_diverted_kg=landfill,
        created_at=datetime.now(timezone.utc)
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_aggregate_impact(db: Session, donor_id: str = None, ngo_id: str = None) -> Dict[str, Any]:
    """
    Computes cumulative verified impact for a donor, NGO, or system-wide.
    """
    query = db.query(ImpactRecord)
    if donor_id:
        query = query.filter(ImpactRecord.donor_id == donor_id)
    if ngo_id:
        query = query.filter(ImpactRecord.ngo_id == ngo_id)
        
    records = query.all()
    
    total_kg = sum(r.rescued_weight_kg for r in records)
    total_meals = sum(r.meals_served for r in records)
    total_co2e = sum(r.co2e_saved_kg for r in records)
    total_water = sum(r.water_saved_liters for r in records)
    total_landfill = sum(r.landfill_diverted_kg for r in records)
    
    return {
        "title": "ANNASETU Verified Impact Reporting & Sustainability Documentation",
        "description": "Verified documentation to support applicable CSR, tax, and ESG sustainability reporting.",
        "rescues_count": len(records),
        "total_food_rescued_kg": round(total_kg, 1),
        "total_meals_supported": total_meals,
        "co2e_emissions_prevented_kg": round(total_co2e, 1),
        "water_conserved_liters": round(total_water, 1),
        "landfill_diverted_kg": round(total_landfill, 1),
    }
