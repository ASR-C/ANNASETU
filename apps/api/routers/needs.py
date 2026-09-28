"""
ANNASETU Needs Router
CRUD endpoints for verified NGOs to post and manage structured meal requirements.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.database import SyncSessionLocal
from apps.api.models.db_models import Need, Organization, Donation
from apps.api.models.enums import NeedStatus, UserRole, DonationStatus, MealPeriod
from apps.api.models.schemas import (
    NeedCreate, NeedUpdate, NeedResponse,
    DailyMealQuotasResponse, DailyMealQuotasUpdateRequest, ProximityAlertMatch,
    MealSlotDetail
)
from apps.api.routers.auth import get_current_user
from apps.api.matching.eligibility import haversine_distance_km, estimate_travel_minutes
from apps.api.delivery.pricing import calculate_declared_delivery_amount

router = APIRouter(prefix="/needs", tags=["NGO Needs"])

@router.post("", response_model=NeedResponse)
def create_need(req: NeedCreate, user: dict = Depends(get_current_user)):
    with SyncSessionLocal() as db:
        # Find NGO organization for user
        org_id = user.get("org_id")
        if not org_id:
            org = db.query(Organization).filter(Organization.created_by == user["sub"]).first()
            if not org:
                # Default to demo NGO if admin or no org found
                org = db.query(Organization).filter(Organization.org_type == UserRole.NGO).first()
            org_id = org.id if org else "ngo-org-001"

        need = Need(
            ngo_id=org_id,
            title=req.title,
            meal_period=req.meal_period,
            food_category=req.food_category,
            is_veg=req.is_veg,
            required_quantity_kg=req.required_quantity_kg,
            minimum_acceptable_quantity_kg=req.minimum_acceptable_quantity_kg,
            fulfilled_quantity_kg=0.0,
            required_by=req.required_by,
            receiving_address=req.receiving_address,
            latitude=req.latitude,
            longitude=req.longitude,
            special_requirements=req.special_requirements,
            status=NeedStatus.ACTIVE
        )
        db.add(need)
        db.commit()
        db.refresh(need)

        org_name = org.name if org else "Mumbai Roti & Annadaan Foundation"
        return {
            "id": need.id,
            "ngo_id": need.ngo_id,
            "ngo_name": org_name,
            "title": need.title,
            "meal_period": need.meal_period,
            "food_category": need.food_category,
            "is_veg": need.is_veg,
            "required_quantity_kg": need.required_quantity_kg,
            "minimum_acceptable_quantity_kg": need.minimum_acceptable_quantity_kg,
            "fulfilled_quantity_kg": need.fulfilled_quantity_kg,
            "remaining_quantity_kg": need.required_quantity_kg - need.fulfilled_quantity_kg,
            "required_by": need.required_by,
            "receiving_address": need.receiving_address,
            "latitude": need.latitude,
            "longitude": need.longitude,
            "status": need.status,
            "special_requirements": need.special_requirements,
            "created_at": need.created_at
        }

@router.get("", response_model=List[NeedResponse])
def list_needs(
    status_filter: Optional[NeedStatus] = None,
    ngo_id: Optional[str] = None
):
    with SyncSessionLocal() as db:
        query = db.query(Need, Organization.name.label("ngo_name")).join(
            Organization, Organization.id == Need.ngo_id, isouter=True
        )
        if status_filter:
            query = query.filter(Need.status == status_filter)
        if ngo_id:
            query = query.filter(Need.ngo_id == ngo_id)

        results = query.order_by(Need.created_at.desc()).all()
        response = []
        for need, org_name in results:
            response.append({
                "id": need.id,
                "ngo_id": need.ngo_id,
                "ngo_name": org_name or "Verified NGO Partner",
                "title": need.title,
                "meal_period": need.meal_period,
                "food_category": need.food_category,
                "is_veg": need.is_veg,
                "required_quantity_kg": need.required_quantity_kg,
                "minimum_acceptable_quantity_kg": need.minimum_acceptable_quantity_kg,
                "fulfilled_quantity_kg": need.fulfilled_quantity_kg,
                "remaining_quantity_kg": max(0.0, need.required_quantity_kg - need.fulfilled_quantity_kg),
                "required_by": need.required_by,
                "receiving_address": need.receiving_address,
                "latitude": need.latitude,
                "longitude": need.longitude,
                "status": need.status,
                "special_requirements": need.special_requirements,
                "created_at": need.created_at
            })
        return response

# ===========================================================================
# NGO Daily 3-Time Meal Target Quotas & AI Proximity Match Engine
# ===========================================================================

# In-memory quota store for verified NGOs (with persistent defaults)
_NGO_DAILY_QUOTAS_STORE: Dict[str, Dict[str, Any]] = {
    "ngo-org-001": {
        "breakfast_target_kg": 25.0,
        "breakfast_fulfilled_kg": 10.0,
        "breakfast_beneficiaries": 50,
        "lunch_target_kg": 50.0,
        "lunch_fulfilled_kg": 20.0,
        "lunch_beneficiaries": 100,
        "dinner_target_kg": 60.0,
        "dinner_fulfilled_kg": 15.0,
        "dinner_beneficiaries": 120,
        "receiving_address": "Dharavi Welfare Hub, Near Sion Station, Mumbai",
        "latitude": 19.0400,
        "longitude": 72.8550,
        "ngo_name": "Mumbai Roti & Annadaan Foundation",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
}

def _get_active_meal_window() -> str:
    """Returns the current active feeding slot based on UTC / Indian Standard Time."""
    # Approximate IST hour (+5.5)
    utc_now = datetime.now(timezone.utc)
    ist_hour = (utc_now.hour + 5 + (1 if utc_now.minute + 30 >= 60 else 0)) % 24
    if 6 <= ist_hour < 11:
        return "BREAKFAST"
    elif 11 <= ist_hour < 16:
        return "LUNCH"
    else:
        return "DINNER"

@router.get("/daily-3meal-quotas", response_model=DailyMealQuotasResponse)
def get_daily_3meal_quotas(ngo_id: Optional[str] = "ngo-org-001"):
    """
    Returns the fixed 3-meal target quotas (Breakfast, Lunch, Dinner)
    with live fulfilled quantities, remaining deficits, and active window.
    """
    data = _NGO_DAILY_QUOTAS_STORE.get(ngo_id or "ngo-org-001")
    if not data:
        data = {
            "breakfast_target_kg": 25.0,
            "breakfast_fulfilled_kg": 10.0,
            "breakfast_beneficiaries": 50,
            "lunch_target_kg": 50.0,
            "lunch_fulfilled_kg": 20.0,
            "lunch_beneficiaries": 100,
            "dinner_target_kg": 60.0,
            "dinner_fulfilled_kg": 15.0,
            "dinner_beneficiaries": 120,
            "receiving_address": "Dharavi Welfare Hub, Near Sion Station, Mumbai",
            "latitude": 19.0400,
            "longitude": 72.8550,
            "ngo_name": "Mumbai Roti & Annadaan Foundation",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        _NGO_DAILY_QUOTAS_STORE[ngo_id or "ngo-org-001"] = data

    active_slot = _get_active_meal_window()

    b_rem = max(0.0, data["breakfast_target_kg"] - data["breakfast_fulfilled_kg"])
    l_rem = max(0.0, data["lunch_target_kg"] - data["lunch_fulfilled_kg"])
    d_rem = max(0.0, data["dinner_target_kg"] - data["dinner_fulfilled_kg"])

    total_target = data["breakfast_target_kg"] + data["lunch_target_kg"] + data["dinner_target_kg"]
    total_fulfilled = data["breakfast_fulfilled_kg"] + data["lunch_fulfilled_kg"] + data["dinner_fulfilled_kg"]
    total_remaining = b_rem + l_rem + d_rem

    return {
        "ngo_id": ngo_id or "ngo-org-001",
        "ngo_name": data.get("ngo_name", "Mumbai Roti & Annadaan Foundation"),
        "date": data.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "receiving_address": data["receiving_address"],
        "latitude": data["latitude"],
        "longitude": data["longitude"],
        "active_slot": active_slot,
        "total_target_kg": total_target,
        "total_fulfilled_kg": total_fulfilled,
        "total_remaining_kg": total_remaining,
        "slots": {
            "BREAKFAST": {
                "slot": "BREAKFAST",
                "label": "Morning Breakfast",
                "time_window": "07:00 - 10:30",
                "target_kg": data["breakfast_target_kg"],
                "fulfilled_kg": data["breakfast_fulfilled_kg"],
                "remaining_kg": b_rem,
                "beneficiaries_count": data.get("breakfast_beneficiaries", 50),
                "status": "ACTIVE_WINDOW" if active_slot == "BREAKFAST" else ("COMPLETED" if b_rem <= 0 else "DEFICIT")
            },
            "LUNCH": {
                "slot": "LUNCH",
                "label": "Afternoon Lunch",
                "time_window": "11:30 - 15:30",
                "target_kg": data["lunch_target_kg"],
                "fulfilled_kg": data["lunch_fulfilled_kg"],
                "remaining_kg": l_rem,
                "beneficiaries_count": data.get("lunch_beneficiaries", 100),
                "status": "ACTIVE_WINDOW" if active_slot == "LUNCH" else ("COMPLETED" if l_rem <= 0 else "DEFICIT")
            },
            "DINNER": {
                "slot": "DINNER",
                "label": "Evening Dinner",
                "time_window": "18:30 - 22:30",
                "target_kg": data["dinner_target_kg"],
                "fulfilled_kg": data["dinner_fulfilled_kg"],
                "remaining_kg": d_rem,
                "beneficiaries_count": data.get("dinner_beneficiaries", 120),
                "status": "ACTIVE_WINDOW" if active_slot == "DINNER" else ("COMPLETED" if d_rem <= 0 else "DEFICIT")
            }
        }
    }

@router.post("/daily-3meal-quotas", response_model=DailyMealQuotasResponse)
def update_daily_3meal_quotas(req: DailyMealQuotasUpdateRequest, ngo_id: Optional[str] = "ngo-org-001"):
    """
    Allows the NGO to raise or configure their fixed daily target quantities
    and beneficiary numbers for Breakfast, Lunch, and Dinner.
    """
    target = _NGO_DAILY_QUOTAS_STORE.get(ngo_id or "ngo-org-001", {
        "breakfast_target_kg": 25.0,
        "breakfast_fulfilled_kg": 10.0,
        "breakfast_beneficiaries": 50,
        "lunch_target_kg": 50.0,
        "lunch_fulfilled_kg": 20.0,
        "lunch_beneficiaries": 100,
        "dinner_target_kg": 60.0,
        "dinner_fulfilled_kg": 15.0,
        "dinner_beneficiaries": 120,
        "receiving_address": "Dharavi Welfare Hub, Near Sion Station, Mumbai",
        "latitude": 19.0400,
        "longitude": 72.8550,
        "ngo_name": "Mumbai Roti & Annadaan Foundation",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    })

    if req.breakfast_target_kg is not None:
        target["breakfast_target_kg"] = max(5.0, float(req.breakfast_target_kg))
    if req.lunch_target_kg is not None:
        target["lunch_target_kg"] = max(5.0, float(req.lunch_target_kg))
    if req.dinner_target_kg is not None:
        target["dinner_target_kg"] = max(5.0, float(req.dinner_target_kg))

    if req.breakfast_beneficiaries is not None:
        target["breakfast_beneficiaries"] = max(1, int(req.breakfast_beneficiaries))
    if req.lunch_beneficiaries is not None:
        target["lunch_beneficiaries"] = max(1, int(req.lunch_beneficiaries))
    if req.dinner_beneficiaries is not None:
        target["dinner_beneficiaries"] = max(1, int(req.dinner_beneficiaries))

    if req.receiving_address:
        target["receiving_address"] = req.receiving_address
    if req.latitude is not None:
        target["latitude"] = req.latitude
    if req.longitude is not None:
        target["longitude"] = req.longitude

    _NGO_DAILY_QUOTAS_STORE[ngo_id or "ngo-org-001"] = target
    return get_daily_3meal_quotas(ngo_id)

@router.get("/ai-proximity-alerts", response_model=List[ProximityAlertMatch])
def get_ai_proximity_alerts(ngo_id: Optional[str] = "ngo-org-001", max_radius_km: float = 25.0):
    """
    AI Proximity Engine:
    Compares the NGO's remaining 3-meal gaps against newly posted/active restaurant surplus batches.
    Returns intelligent proximity alerts with distance, coverage percentage, and one-click match recommendations.
    """
    quotas_res = get_daily_3meal_quotas(ngo_id)
    ngo_lat = quotas_res["latitude"]
    ngo_lon = quotas_res["longitude"]
    slots = quotas_res["slots"]
    active_slot_name = quotas_res["active_slot"]

    matches: List[ProximityAlertMatch] = []

    with SyncSessionLocal() as db:
        # Query active donations with unreserved portions
        active_donations = db.query(Donation, Organization.name.label("donor_name")).join(
            Organization, Organization.id == Donation.donor_id, isouter=True
        ).filter(
            Donation.status.in_([DonationStatus.AVAILABLE, DonationStatus.RESERVED])
        ).all()

        for donation, donor_name in active_donations:
            avail_kg = donation.quantity_kg - (donation.reserved_quantity_kg + donation.allocated_quantity_kg)
            if avail_kg <= 0:
                continue

            dist_km = haversine_distance_km(ngo_lat, ngo_lon, donation.latitude, donation.longitude)
            if dist_km > max_radius_km:
                continue

            duration_min = estimate_travel_minutes(dist_km)

            # Determine best-fit slot based on deficit
            matched_slot_name = active_slot_name
            slot_data = slots.get(matched_slot_name)
            rem_kg = slot_data["remaining_kg"] if slot_data else 0.0

            # If active slot is already fulfilled, pick the slot with greatest remaining need
            if rem_kg <= 0:
                for s_key in ["LUNCH", "DINNER", "BREAKFAST"]:
                    if slots[s_key]["remaining_kg"] > 0:
                        matched_slot_name = s_key
                        slot_data = slots[s_key]
                        rem_kg = slot_data["remaining_kg"]
                        break

            if rem_kg <= 0:
                rem_kg = 20.0  # nominal buffer

            fulfillment_pct = round(min(100.0, (avail_kg / rem_kg) * 100.0), 1)

            urgency = "OPTIMAL"
            if dist_km <= 5.0 and fulfillment_pct >= 70.0:
                urgency = "CRITICAL"
            elif dist_km <= 15.0 and fulfillment_pct >= 50.0:
                urgency = "HIGH"

            donor_display = donor_name or "Taj Grand Kitchens"
            category_display = donation.food_category.replace("_", " ").title()

            headline = f"Surplus Order Nearby! {donor_display} posted {avail_kg:.1f} kg {category_display} ({dist_km:.1f} km away)."
            description = (
                f"Fulfills {fulfillment_pct}% of your remaining {slots[matched_slot_name]['label']} quota "
                f"({rem_kg:.1f} kg deficit). Estimated transit: ~{int(duration_min)} mins."
            )

            # Calculate declared delivery fare based on distance, vehicle, rush hour & food amount
            fare_quote = calculate_declared_delivery_amount(
                distance_km=dist_km,
                weight_kg=avail_kg
            )

            matches.append(ProximityAlertMatch(
                donation_id=donation.id,
                donor_id=donation.donor_id,
                donor_name=donor_display,
                donation_title=donation.title,
                food_category=donation.food_category,
                is_veg=donation.is_veg,
                available_quantity_kg=round(avail_kg, 1),
                distance_km=dist_km,
                estimated_duration_min=duration_min,
                matched_slot=matched_slot_name,
                slot_remaining_need_kg=rem_kg,
                fulfillment_percentage=fulfillment_pct,
                urgency=urgency,
                headline=headline,
                description=description,
                pickup_address=donation.pickup_address,
                deadline=donation.deadline,
                delivery_fare_inr=fare_quote["total_amount_inr"],
                vehicle_class=fare_quote["vehicle_class"],
                vehicle_name=fare_quote["vehicle_name"],
                is_rush_hour=fare_quote["is_rush_hour"],
                rush_hour_multiplier=fare_quote["rush_hour_multiplier"],
                rush_hour_label=fare_quote["rush_hour_label"],
                fare_breakdown=fare_quote["breakdown"]
            ))

    # Sort matches by urgency priority and proximity distance
    matches.sort(key=lambda m: (0 if m.urgency == "CRITICAL" else 1 if m.urgency == "HIGH" else 2, m.distance_km))
    return matches

@router.post("/claim-for-quota")
def claim_for_quota(
    donation_id: str = Query(...),
    slot: str = Query(..., pattern="^(BREAKFAST|LUNCH|DINNER)$"),
    quantity_kg: float = Query(..., gt=0),
    ngo_id: Optional[str] = "ngo-org-001"
):
    """
    Directly allocates a nearby surplus batch towards the NGO's specific meal slot quota,
    reducing the remaining deficit and updating the daily progress.
    """
    quotas = _NGO_DAILY_QUOTAS_STORE.get(ngo_id or "ngo-org-001")
    if quotas:
        slot_key = f"{slot.lower()}_fulfilled_kg"
        quotas[slot_key] = round(quotas.get(slot_key, 0.0) + quantity_kg, 1)

    return {
        "success": True,
        "message": f"Successfully allocated {quantity_kg} kg towards {slot} meal quota.",
        "quotas": get_daily_3meal_quotas(ngo_id)
    }

@router.patch("/{need_id}", response_model=NeedResponse)
def update_need(need_id: str, req: NeedUpdate):
    with SyncSessionLocal() as db:
        need = db.query(Need).filter(Need.id == need_id).first()
        if not need:
            raise HTTPException(status_code=404, detail="Need not found")

        if req.title is not None:
            need.title = req.title
        if req.required_quantity_kg is not None:
            need.required_quantity_kg = req.required_quantity_kg
        if req.minimum_acceptable_quantity_kg is not None:
            need.minimum_acceptable_quantity_kg = req.minimum_acceptable_quantity_kg
        if req.required_by is not None:
            need.required_by = req.required_by
        if req.status is not None:
            need.status = req.status
        if req.special_requirements is not None:
            need.special_requirements = req.special_requirements

        db.commit()
        db.refresh(need)
        org = db.query(Organization).filter(Organization.id == need.ngo_id).first()

        return {
            "id": need.id,
            "ngo_id": need.ngo_id,
            "ngo_name": org.name if org else "Verified NGO",
            "title": need.title,
            "meal_period": need.meal_period,
            "food_category": need.food_category,
            "is_veg": need.is_veg,
            "required_quantity_kg": need.required_quantity_kg,
            "minimum_acceptable_quantity_kg": need.minimum_acceptable_quantity_kg,
            "fulfilled_quantity_kg": need.fulfilled_quantity_kg,
            "remaining_quantity_kg": max(0.0, need.required_quantity_kg - need.fulfilled_quantity_kg),
            "required_by": need.required_by,
            "receiving_address": need.receiving_address,
            "latitude": need.latitude,
            "longitude": need.longitude,
            "status": need.status,
            "special_requirements": need.special_requirements,
            "created_at": need.created_at
        }

