"""
ANNASETU Donations Router
Allows verified donors to publish surplus edible food and automatically triggers the matching engine.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.database import SyncSessionLocal
from apps.api.models.db_models import Donation, Organization, Need, MatchProposal, ConfigModel
from apps.api.models.enums import DonationStatus, UserRole, NeedStatus
from apps.api.models.schemas import DonationCreate, DonationResponse
from apps.api.routers.auth import get_current_user
from apps.api.matching.eligibility import check_eligibility
from apps.api.matching.scoring import calculate_priority_score
from apps.api.ai.adapter import analyze_food_declaration

router = APIRouter(prefix="/donations", tags=["Surplus Food Donations"])

@router.post("", response_model=DonationResponse)
def create_donation(req: DonationCreate, user: dict = Depends(get_current_user)):
    # Server-side constraint: minimum 5 kg
    if req.quantity_kg < 5.0:
        raise HTTPException(status_code=400, detail="Minimum donation quantity is 5 kg. Smaller batches cannot be published.")

    with SyncSessionLocal() as db:
        # Resolve donor organization
        org_id = user.get("org_id")
        if not org_id:
            org = db.query(Organization).filter(Organization.created_by == user["sub"]).first()
            if not org:
                org = db.query(Organization).filter(Organization.org_type == UserRole.DONOR).first()
            org_id = org.id if org else "donor-org-001"

        donation = Donation(
            donor_id=org_id,
            title=req.title,
            food_category=req.food_category,
            is_veg=req.is_veg,
            quantity_kg=req.quantity_kg,
            reserved_quantity_kg=0.0,
            allocated_quantity_kg=0.0,
            available_from=req.available_from,
            deadline=req.deadline,
            storage_condition=req.storage_condition,
            pickup_address=req.pickup_address,
            latitude=req.latitude,
            longitude=req.longitude,
            images=req.images,
            seal_number=req.seal_number or f"SEAL-{int(datetime.now().timestamp())}",
            special_instructions=req.special_instructions,
            status=DonationStatus.AVAILABLE
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)

        # Trigger Immediate Matching Engine against all active needs
        active_needs = db.query(Need).filter(Need.status == NeedStatus.ACTIVE).all()
        for need in active_needs:
            is_eligible, reasons, dist_km, eta_min = check_eligibility(
                donation_category=donation.food_category,
                donation_is_veg=donation.is_veg,
                donation_available_kg=donation.quantity_kg,
                donation_deadline=donation.deadline,
                donation_lat=donation.latitude,
                donation_lon=donation.longitude,
                need_status=need.status,
                need_category=need.food_category,
                need_is_veg=need.is_veg,
                need_remaining_kg=need.required_quantity_kg - need.fulfilled_quantity_kg,
                need_min_acceptable_kg=need.minimum_acceptable_quantity_kg,
                need_required_by=need.required_by,
                need_lat=need.latitude,
                need_lon=need.longitude
            )

            score, factors = calculate_priority_score(
                distance_km=dist_km,
                eta_minutes=eta_min,
                donation_deadline=donation.deadline,
                need_required_by=need.required_by,
                donation_available_kg=donation.quantity_kg,
                need_remaining_kg=need.required_quantity_kg - need.fulfilled_quantity_kg,
                nearby_driver_available=True
            )

            proposal = MatchProposal(
                donation_id=donation.id,
                need_id=need.id,
                score=score if is_eligible else 0.0,
                factors_breakdown=factors,
                is_eligible=is_eligible,
                rejection_reasons=reasons,
                distance_km=dist_km,
                estimated_duration_min=eta_min
            )
            db.add(proposal)

        db.commit()
        org_name = org.name if org else "Taj Grand Kitchens"

        return {
            "id": donation.id,
            "donor_id": donation.donor_id,
            "donor_name": org_name,
            "title": donation.title,
            "food_category": donation.food_category,
            "is_veg": donation.is_veg,
            "quantity_kg": donation.quantity_kg,
            "reserved_quantity_kg": donation.reserved_quantity_kg,
            "allocated_quantity_kg": donation.allocated_quantity_kg,
            "available_quantity_kg": donation.quantity_kg - (donation.reserved_quantity_kg + donation.allocated_quantity_kg),
            "available_from": donation.available_from,
            "deadline": donation.deadline,
            "storage_condition": donation.storage_condition,
            "pickup_address": donation.pickup_address,
            "latitude": donation.latitude,
            "longitude": donation.longitude,
            "images": donation.images or [],
            "seal_number": donation.seal_number,
            "special_instructions": donation.special_instructions,
            "status": donation.status,
            "created_at": donation.created_at
        }

@router.get("", response_model=List[DonationResponse])
def list_donations(donor_id: Optional[str] = None):
    with SyncSessionLocal() as db:
        query = db.query(Donation, Organization.name.label("donor_name")).join(
            Organization, Organization.id == Donation.donor_id, isouter=True
        )
        if donor_id:
            query = query.filter(Donation.donor_id == donor_id)

        results = query.order_by(Donation.created_at.desc()).all()
        response = []
        for donation, donor_name in results:
            response.append({
                "id": donation.id,
                "donor_id": donation.donor_id,
                "donor_name": donor_name or "Verified Donor",
                "title": donation.title,
                "food_category": donation.food_category,
                "is_veg": donation.is_veg,
                "quantity_kg": donation.quantity_kg,
                "reserved_quantity_kg": donation.reserved_quantity_kg,
                "allocated_quantity_kg": donation.allocated_quantity_kg,
                "available_quantity_kg": max(0.0, donation.quantity_kg - (donation.reserved_quantity_kg + donation.allocated_quantity_kg)),
                "available_from": donation.available_from,
                "deadline": donation.deadline,
                "storage_condition": donation.storage_condition,
                "pickup_address": donation.pickup_address,
                "latitude": donation.latitude,
                "longitude": donation.longitude,
                "images": donation.images or [],
                "seal_number": donation.seal_number,
                "special_instructions": donation.special_instructions,
                "status": donation.status,
                "created_at": donation.created_at
            })
        return response

@router.post("/ai-assist")
async def assist_donation_declaration(title: str, notes: Optional[str] = None):
    """Assistive endpoint using Groq to recommend categorization and storage."""
    result = await analyze_food_declaration(title, notes)
    return result
