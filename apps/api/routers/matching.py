"""
ANNASETU Matching Router
Provides ranked match proposals with factor breakdowns and human-readable score explanations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from apps.api.database import SyncSessionLocal
from apps.api.models.db_models import MatchProposal, Donation, Need, Organization
from apps.api.models.schemas import MatchProposalResponse
from apps.api.matching.explainable import generate_match_explanation
from apps.api.matching.eligibility import check_eligibility
from apps.api.matching.scoring import calculate_priority_score
from apps.api.models.enums import NeedStatus, DonationStatus
from apps.api.delivery.pricing import calculate_declared_delivery_amount

router = APIRouter(prefix="/matching", tags=["Matching Engine"])

@router.get("/proposals", response_model=List[MatchProposalResponse])
def get_match_proposals(
    ngo_id: Optional[str] = None,
    donation_id: Optional[str] = None,
    eligible_only: bool = True
):
    with SyncSessionLocal() as db:
        query = db.query(
            MatchProposal,
            Donation.title.label("donation_title"),
            Donation.quantity_kg.label("donation_quantity"),
            Need.title.label("need_title"),
            Organization.name.label("ngo_name")
        ).join(Donation, Donation.id == MatchProposal.donation_id
        ).join(Need, Need.id == MatchProposal.need_id
        ).join(Organization, Organization.id == Need.ngo_id)

        if eligible_only:
            query = query.filter(MatchProposal.is_eligible == True)
        if ngo_id:
            query = query.filter(Need.ngo_id == ngo_id)
        if donation_id:
            query = query.filter(MatchProposal.donation_id == donation_id)

        results = query.order_by(MatchProposal.score.desc()).all()
        response = []
        for prop, don_title, don_qty, need_title, ngo_name in results:
            explanations = generate_match_explanation(prop.score, prop.factors_breakdown or {})
            
            # Calculate dynamic declared delivery amount
            fare_quote = calculate_declared_delivery_amount(
                distance_km=float(prop.distance_km or 3.5),
                weight_kg=float(don_qty or 20.0)
            )

            response.append({
                "id": prop.id,
                "donation_id": prop.donation_id,
                "need_id": prop.need_id,
                "score": prop.score,
                "factors_breakdown": prop.factors_breakdown,
                "is_eligible": prop.is_eligible,
                "rejection_reasons": prop.rejection_reasons or [],
                "distance_km": prop.distance_km or 0.0,
                "estimated_duration_min": prop.estimated_duration_min or 0.0,
                "donor_name": "Taj Grand Kitchens",
                "ngo_name": ngo_name,
                "donation_title": don_title,
                "need_title": need_title,
                "quantity_kg": don_qty,
                "explanation": " • ".join(explanations),
                "delivery_fare_inr": fare_quote["total_amount_inr"],
                "vehicle_class": fare_quote["vehicle_class"],
                "vehicle_name": fare_quote["vehicle_name"],
                "is_rush_hour": fare_quote["is_rush_hour"],
                "rush_hour_multiplier": fare_quote["rush_hour_multiplier"],
                "rush_hour_label": fare_quote["rush_hour_label"],
                "fare_breakdown": fare_quote["breakdown"]
            })
        return response

@router.post("/recompute")
def recompute_matches():
    """Runs matching evaluation across all available donations and active needs."""
    with SyncSessionLocal() as db:
        active_donations = db.query(Donation).filter(
            Donation.status.in_([DonationStatus.AVAILABLE, DonationStatus.RESERVED])
        ).all()
        active_needs = db.query(Need).filter(Need.status == NeedStatus.ACTIVE).all()

        count = 0
        for donation in active_donations:
            avail_kg = donation.quantity_kg - (donation.reserved_quantity_kg + donation.allocated_quantity_kg)
            if avail_kg <= 0:
                continue

            for need in active_needs:
                is_eligible, reasons, dist_km, eta_min = check_eligibility(
                    donation_category=donation.food_category,
                    donation_is_veg=donation.is_veg,
                    donation_available_kg=avail_kg,
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
                    donation_available_kg=avail_kg,
                    need_remaining_kg=need.required_quantity_kg - need.fulfilled_quantity_kg,
                    nearby_driver_available=True
                )

                existing = db.query(MatchProposal).filter(
                    MatchProposal.donation_id == donation.id,
                    MatchProposal.need_id == need.id
                ).first()

                if existing:
                    existing.score = score if is_eligible else 0.0
                    existing.factors_breakdown = factors
                    existing.is_eligible = is_eligible
                    existing.rejection_reasons = reasons
                    existing.distance_km = dist_km
                    existing.estimated_duration_min = eta_min
                else:
                    db.add(MatchProposal(
                        donation_id=donation.id,
                        need_id=need.id,
                        score=score if is_eligible else 0.0,
                        factors_breakdown=factors,
                        is_eligible=is_eligible,
                        rejection_reasons=reasons,
                        distance_km=dist_km,
                        estimated_duration_min=eta_min
                    ))
                count += 1

        db.commit()
        return {"status": "SUCCESS", "evaluated_pairs": count}
