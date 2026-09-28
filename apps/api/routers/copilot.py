"""
ANNASETU AI Copilot Router
Read-only conversational assistance scoped strictly to authenticated user context.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from apps.api.database import SyncSessionLocal
from apps.api.models.schemas import CopilotQueryRequest, CopilotResponse
from apps.api.routers.auth import get_current_user
from apps.api.ai.copilot import answer_copilot_query
from apps.api.impact.calculator import get_aggregate_impact
from apps.api.models.db_models import DeliveryJob, Wallet

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

@router.post("/query", response_model=CopilotResponse)
async def query_copilot(req: CopilotQueryRequest, user: dict = Depends(get_current_user)):
    with SyncSessionLocal() as db:
        role = user.get("role", "DONOR")
        user_name = user.get("email", "Member")
        org_id = user.get("org_id")

        # Build scoped context
        impact = get_aggregate_impact(db, donor_id=org_id if role == "DONOR" else None, ngo_id=org_id if role == "NGO" else None)
        active_rescues = db.query(DeliveryJob).count()
        wallet_balance = 0.0
        if org_id:
            wallet = db.query(Wallet).filter(Wallet.organization_id == org_id).first()
            if wallet:
                wallet_balance = wallet.balance_inr

        context = {
            "user_role": role,
            "total_food_rescued_kg": impact.get("total_food_rescued_kg", 0),
            "meals_served": impact.get("total_meals_supported", 0),
            "co2e_emissions_prevented_kg": impact.get("co2e_emissions_prevented_kg", 0),
            "active_rescues": active_rescues,
            "wallet_balance": wallet_balance
        }

        answer = await answer_copilot_query(
            user_role=role,
            user_name=user_name,
            context_data=context,
            query=req.query
        )

        return {"answer": answer, "context": context}
