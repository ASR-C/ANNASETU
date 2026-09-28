"""
ANNASETU Finance Router
Exposes NGO wallet balances, double-entry ledger statements, and top-up operations.
"""

from typing import List
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from apps.api.database import SyncSessionLocal
from apps.api.models.db_models import Wallet, WalletLedger
from apps.api.models.schemas import WalletResponse, WalletLedgerResponse, TopupRequest
from apps.api.finance.wallet_service import get_or_create_wallet, topup_ngo_wallet

router = APIRouter(prefix="/finance", tags=["Finance & Wallets"])

@router.get("/wallet/{org_id}", response_model=WalletResponse)
def get_wallet(org_id: str):
    with SyncSessionLocal() as db:
        wallet = get_or_create_wallet(db, org_id)
        return {
            "id": wallet.id,
            "organization_id": wallet.organization_id,
            "balance_inr": wallet.balance_inr,
            "reserved_inr": wallet.reserved_inr,
            "available_inr": max(0.0, wallet.balance_inr - wallet.reserved_inr)
        }

@router.get("/wallet/{org_id}/ledger", response_model=List[WalletLedgerResponse])
def get_wallet_ledger(org_id: str):
    with SyncSessionLocal() as db:
        wallet = get_or_create_wallet(db, org_id)
        entries = db.query(WalletLedger).filter(WalletLedger.wallet_id == wallet.id).order_by(WalletLedger.created_at.desc()).all()
        return [
            {
                "id": e.id,
                "wallet_id": e.wallet_id,
                "delivery_job_id": e.delivery_job_id,
                "entry_type": e.entry_type,
                "amount_inr": e.amount_inr,
                "balance_before_inr": e.balance_before_inr,
                "balance_after_inr": e.balance_after_inr,
                "description": e.description,
                "reference_id": e.reference_id,
                "created_at": e.created_at
            }
            for e in entries
        ]

@router.post("/wallet/{org_id}/topup", response_model=WalletResponse)
def topup_wallet(org_id: str, req: TopupRequest):
    with SyncSessionLocal() as db:
        wallet = topup_ngo_wallet(db, org_id, req.amount_inr, description="Simulated NGO Wallet Top-up")
        return {
            "id": wallet.id,
            "organization_id": wallet.organization_id,
            "balance_inr": wallet.balance_inr,
            "reserved_inr": wallet.reserved_inr,
            "available_inr": max(0.0, wallet.balance_inr - wallet.reserved_inr)
        }
