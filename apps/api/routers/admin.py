"""
ANNASETU Admin Rescue Command Center Router
Provides operational telemetry, verification queue management, integrity reviews, and config management.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from apps.api.database import SyncSessionLocal
from apps.api.models.db_models import (
    DeliveryJob, Organization, DriverDetails, IntegrityReview,
    Settlement, ImpactRecord, ConfigModel, AuditLog, VerificationCase, Document,
    NgoDetails, DonorDetails
)
from apps.api.models.enums import DeliveryJobStatus, VerificationStatus, IntegrityVerdict
from apps.api.models.schemas import AdminStatsResponse, VerificationReviewRequest
from apps.api.models.verification_registry import get_verification_option

router = APIRouter(prefix="/admin", tags=["Admin Rescue Command Center"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_command_center_stats():
    with SyncSessionLocal() as db:
        active_rescues = db.query(DeliveryJob).filter(
            DeliveryJob.status.in_([
                DeliveryJobStatus.AVAILABLE,
                DeliveryJobStatus.OFFERED,
                DeliveryJobStatus.ON_JOB,
                DeliveryJobStatus.ARRIVED_PICKUP,
                DeliveryJobStatus.PICKED_UP,
                DeliveryJobStatus.IN_TRANSIT
            ])
        ).count()

        pending_verifications = db.query(Organization).filter(
            Organization.verification_status.in_([
                VerificationStatus.REGISTERED,
                VerificationStatus.DOCUMENTS_SUBMITTED,
                VerificationStatus.ADMIN_REVIEW
            ])
        ).count()

        active_drivers = db.query(DriverDetails).filter(DriverDetails.is_available == True).count()
        integrity_reviews = db.query(IntegrityReview).filter(IntegrityReview.admin_reviewed == False).count()
        
        # Pending settlements: Delivered jobs without completed settlement
        pending_settlements = db.query(DeliveryJob).filter(
            DeliveryJob.status == DeliveryJobStatus.DELIVERED
        ).count() - db.query(Settlement).count()
        pending_settlements = max(0, pending_settlements)

        impacts = db.query(ImpactRecord).all()
        total_kg = sum(r.rescued_weight_kg for r in impacts)
        total_meals = sum(r.meals_served for r in impacts)

        return {
            "active_rescues": active_rescues,
            "pending_verifications": pending_verifications,
            "active_drivers": active_drivers,
            "integrity_reviews": integrity_reviews,
            "pending_settlements": pending_settlements,
            "total_food_rescued_kg": round(total_kg, 1),
            "total_meals_served": total_meals
        }

@router.get("/verifications")
def get_verification_queue():
    with SyncSessionLocal() as db:
        orgs = db.query(Organization).filter(
            Organization.verification_status.in_([
                VerificationStatus.REGISTERED,
                VerificationStatus.DOCUMENTS_SUBMITTED,
                VerificationStatus.ADMIN_REVIEW
            ])
        ).all()

        queue = []
        for o in orgs:
            # Check if linked verification case and document exist
            vcase = db.query(VerificationCase).filter(VerificationCase.entity_id == o.id).first()
            doc = db.query(Document).filter(Document.verification_case_id == vcase.id).first() if vcase else None
            
            doc_data = doc.extracted_data if (doc and doc.extracted_data) else {}
            doc_type = doc_data.get("document_type") or ("FSSAI_LICENSE" if o.org_type.value == "DONOR" else "REGISTRATION_CERTIFICATE")
            meta = get_verification_option(o.org_type.value, doc_type)

            queue.append({
                "id": o.id,
                "name": o.name,
                "org_type": o.org_type.value,
                "city": o.city,
                "address": o.address,
                "contact_email": o.contact_email,
                "contact_phone": o.contact_phone,
                "verification_status": o.verification_status.value,
                "created_at": o.created_at.isoformat(),
                "document_type": doc_type,
                "document_title": doc_data.get("document_title") or meta.get("title", doc_type),
                "document_number": doc_data.get("document_number") or meta.get("demo_value", "SUBMITTED"),
                "issuing_authority": doc_data.get("issuing_authority") or meta.get("issuing_authority", "Sovereign Registry"),
                "portal_url": doc_data.get("portal_url") or meta.get("portal_url", "https://ngodarpan.gov.in"),
                "description": meta.get("description", ""),
                "badge_text": doc_data.get("badge_text") or meta.get("badge_text", "Under Review")
            })

        # If database has fewer than 2 pending cases, provide realistic showcase cases covering the user's statutory options
        if len(queue) == 0:
            queue = [
                {
                    "id": "pending-ngo-001",
                    "name": "Seva Sankalp Annakshetra Trust",
                    "org_type": "NGO",
                    "city": "Mumbai",
                    "address": "Opp. Sion Hospital, Ambedkar Road, Sion West, Mumbai",
                    "contact_email": "trustees@sevasankalp.org",
                    "contact_phone": "+91-9820199441",
                    "verification_status": "DOCUMENTS_SUBMITTED",
                    "created_at": "2026-09-24T10:15:00Z",
                    "document_type": "REGISTRATION_CERTIFICATE",
                    "document_title": "Registration Certificate",
                    "document_number": "MH/TRUST/2021/008412",
                    "issuing_authority": "Registrar of Public Trusts (Greater Mumbai)",
                    "portal_url": "https://www.mca.gov.in",
                    "description": "Proof of incorporation under the relevant act (Trust Deed for Trusts, Memorandum of Association/Registration Certificate for Societies, or Incorporation Certificate for Section 8 Companies).",
                    "badge_text": "Trust Deed Proof Submitted"
                },
                {
                    "id": "pending-ngo-002",
                    "name": "Prerana Children & Homeless Welfare",
                    "org_type": "NGO",
                    "city": "Mumbai",
                    "address": "Sector 3, Charkop, Kandivali West, Mumbai",
                    "contact_email": "info@preranawelfare.in",
                    "contact_phone": "+91-9870022331",
                    "verification_status": "DOCUMENTS_SUBMITTED",
                    "created_at": "2026-09-24T11:30:00Z",
                    "document_type": "TAX_EXEMPTION_12A_80G",
                    "document_title": "12A & 80G Certificates",
                    "document_number": "AAATP9921FE20221",
                    "issuing_authority": "Income Tax Department (CBDT, Govt. of India)",
                    "portal_url": "https://www.incometax.gov.in",
                    "description": "Essential Income Tax Department certificates. 12A proves tax exemption status for the organization, while 80G allows donors to claim tax deductions.",
                    "badge_text": "12A & 80G Tax Exemption Filed"
                },
                {
                    "id": "pending-donor-001",
                    "name": "Bawarchi Banquets & Caterers",
                    "org_type": "DONOR",
                    "city": "Mumbai",
                    "address": "Link Road, Andheri West, Mumbai",
                    "contact_email": "operations@bawarchibanquets.com",
                    "contact_phone": "+91-9833441122",
                    "verification_status": "DOCUMENTS_SUBMITTED",
                    "created_at": "2026-09-24T09:45:00Z",
                    "document_type": "TRADE_LICENSE",
                    "document_title": "Trade License / Shop & Establishment License",
                    "document_number": "MCGM-KWEST-FOOD-2023-9918",
                    "issuing_authority": "Municipal Corporation of Greater Mumbai (MCGM / BMC)",
                    "portal_url": "https://portal.mcgm.gov.in/",
                    "description": "Municipal or local authority clearance proving the physical location is legally permitted to operate a commercial food establishment.",
                    "badge_text": "Municipal Shop Act Clearance"
                },
                {
                    "id": "pending-driver-001",
                    "name": "Sunil V. Shinde (Cargo 2-Wheeler Fleet)",
                    "org_type": "DRIVER",
                    "city": "Mumbai",
                    "address": "Dharavi 90ft Road, Mumbai",
                    "contact_email": "sunil.shinde@logixfleet.com",
                    "contact_phone": "+91-9819922883",
                    "verification_status": "DOCUMENTS_SUBMITTED",
                    "created_at": "2026-09-24T12:00:00Z",
                    "document_type": "POLICE_VERIFICATION_REPORT",
                    "document_title": "Police Verification Report (PVR)",
                    "document_number": "PVR-MUMBAI-POLICE-2024-88419",
                    "issuing_authority": "State Police Commissionerate (MahaOnline Citizen Portal)",
                    "portal_url": "https://pcs.mahaonline.gov.in/",
                    "description": "A background check certificate issued by local law enforcement confirming no active criminal record.",
                    "badge_text": "Law Enforcement PCC / PVR"
                }
            ]

        return queue

@router.post("/verifications/{org_id}/review")
def review_organization(org_id: str, req: VerificationReviewRequest):
    with SyncSessionLocal() as db:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
            
        org.verification_status = req.status
        db.commit()
        return {"status": "SUCCESS", "new_status": org.verification_status.value}

@router.get("/integrity-reviews")
def list_integrity_reviews():
    with SyncSessionLocal() as db:
        reviews = db.query(IntegrityReview).order_by(IntegrityReview.created_at.desc()).all()
        return [
            {
                "id": r.id,
                "delivery_job_id": r.delivery_job_id,
                "verdict": r.verdict.value,
                "confidence_score": r.confidence_score,
                "details": r.details,
                "admin_reviewed": r.admin_reviewed,
                "created_at": r.created_at.isoformat()
            }
            for r in reviews
        ]

@router.get("/configs")
def list_configs():
    with SyncSessionLocal() as db:
        configs = db.query(ConfigModel).all()
        return [{"key": c.key, "value": c.value, "version": c.version} for c in configs]
