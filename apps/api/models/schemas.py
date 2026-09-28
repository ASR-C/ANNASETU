"""
ANNASETU Pydantic Schemas
Defines request and response data contracts for all API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from apps.api.models.enums import (
    UserRole, VerificationStatus, MealPeriod, NeedStatus, FoodStorageCondition,
    DonationStatus, ReservationStatus, VehicleClass, DeliveryJobStatus,
    LedgerEntryType, IntegrityVerdict
)

# ---------------------------------------------------------------------------
# Auth & Profile
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    org_name: Optional[str] = None
    org_address: Optional[str] = None
    city: Optional[str] = "Mumbai"
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    verification_doc_type: Optional[str] = None
    verification_doc_number: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserProfileSchema(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None

# ---------------------------------------------------------------------------
# Needs
# ---------------------------------------------------------------------------
class NeedCreate(BaseModel):
    title: str
    meal_period: MealPeriod
    food_category: str
    is_veg: bool = True
    required_quantity_kg: float = Field(..., gt=0)
    minimum_acceptable_quantity_kg: float = Field(..., gt=0)
    required_by: datetime
    receiving_address: str
    latitude: float
    longitude: float
    special_requirements: Optional[str] = None

class NeedUpdate(BaseModel):
    title: Optional[str] = None
    required_quantity_kg: Optional[float] = None
    minimum_acceptable_quantity_kg: Optional[float] = None
    required_by: Optional[datetime] = None
    status: Optional[NeedStatus] = None
    special_requirements: Optional[str] = None

class NeedResponse(BaseModel):
    id: str
    ngo_id: str
    ngo_name: Optional[str] = None
    title: str
    meal_period: MealPeriod
    food_category: str
    is_veg: bool
    required_quantity_kg: float
    minimum_acceptable_quantity_kg: float
    fulfilled_quantity_kg: float
    remaining_quantity_kg: float
    required_by: datetime
    receiving_address: str
    latitude: float
    longitude: float
    status: NeedStatus
    special_requirements: Optional[str] = None
    created_at: datetime

# ---------------------------------------------------------------------------
# Donations
# ---------------------------------------------------------------------------
class DonationCreate(BaseModel):
    title: str
    food_category: str
    is_veg: bool = True
    quantity_kg: float = Field(..., ge=5.0, description="Minimum donation quantity is 5 kg")
    available_from: datetime
    deadline: datetime
    storage_condition: FoodStorageCondition = FoodStorageCondition.AMBIENT
    pickup_address: str
    latitude: float
    longitude: float
    images: List[str] = []
    seal_number: Optional[str] = None
    special_instructions: Optional[str] = None

class DonationResponse(BaseModel):
    id: str
    donor_id: str
    donor_name: Optional[str] = None
    title: str
    food_category: str
    is_veg: bool
    quantity_kg: float
    reserved_quantity_kg: float
    allocated_quantity_kg: float
    available_quantity_kg: float
    available_from: datetime
    deadline: datetime
    storage_condition: FoodStorageCondition
    pickup_address: str
    latitude: float
    longitude: float
    images: List[str]
    seal_number: Optional[str] = None
    special_instructions: Optional[str] = None
    status: DonationStatus
    created_at: datetime

# ---------------------------------------------------------------------------
# Matching & Proposals
# ---------------------------------------------------------------------------
class ScoreFactorsSchema(BaseModel):
    distance: float
    eta: float
    expiry_buffer: float
    need_fulfillment: float
    route_efficiency: float
    driver_availability: float
    deadline_urgency: float

class MatchProposalResponse(BaseModel):
    id: str
    donation_id: str
    need_id: str
    score: float
    factors_breakdown: ScoreFactorsSchema
    is_eligible: bool
    rejection_reasons: List[str]
    distance_km: float
    estimated_duration_min: float
    donor_name: Optional[str] = None
    ngo_name: Optional[str] = None
    donation_title: Optional[str] = None
    need_title: Optional[str] = None
    quantity_kg: Optional[float] = None
    explanation: Optional[str] = None
    delivery_fare_inr: Optional[float] = None
    vehicle_class: Optional[str] = None
    vehicle_name: Optional[str] = None
    is_rush_hour: Optional[bool] = False
    rush_hour_multiplier: Optional[float] = 1.0
    rush_hour_label: Optional[str] = None
    fare_breakdown: Optional[Dict[str, Any]] = None

# ---------------------------------------------------------------------------
# Reservations & Allocations
# ---------------------------------------------------------------------------
class ReservationCreate(BaseModel):
    donation_id: str
    need_id: str
    requested_quantity_kg: float = Field(..., gt=0)

class ReservationResponse(BaseModel):
    id: str
    donation_id: str
    need_id: str
    reserved_quantity_kg: float
    status: ReservationStatus
    expires_at: datetime
    confirmed_at: Optional[datetime] = None

# ---------------------------------------------------------------------------
# Delivery Marketplace
# ---------------------------------------------------------------------------
class DeliveryJobResponse(BaseModel):
    id: str
    allocation_id: str
    donation_id: str
    need_id: str
    donor_id: str
    donor_name: str
    ngo_id: str
    ngo_name: str
    assigned_driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_class: VehicleClass
    total_quantity_kg: float
    pickup_address: str
    pickup_latitude: float
    pickup_longitude: float
    drop_address: str
    drop_latitude: float
    drop_longitude: float
    estimated_distance_km: float
    estimated_duration_min: float
    delivery_fare_inr: float
    service_fee_inr: float
    total_ngo_charge_inr: float
    driver_earnings_inr: float
    status: DeliveryJobStatus
    search_radius_km: float
    pickup_otp: Optional[str] = None # Only revealed to donor or verified driver upon pickup
    delivery_otp: Optional[str] = None # Only revealed to NGO or verified driver upon drop
    accepted_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime

class DriverAcceptRequest(BaseModel):
    driver_id: str

class PickupVerifyRequest(BaseModel):
    otp: str
    latitude: float
    longitude: float
    photo_url: str
    seal_number: Optional[str] = None

class DeliveryVerifyRequest(BaseModel):
    otp: str
    latitude: float
    longitude: float
    photo_url: str
    seal_intact: bool = True

# ---------------------------------------------------------------------------
# Finance & Wallets
# ---------------------------------------------------------------------------
class WalletResponse(BaseModel):
    id: str
    organization_id: str
    balance_inr: float
    reserved_inr: float
    available_inr: float

class WalletLedgerResponse(BaseModel):
    id: str
    wallet_id: str
    delivery_job_id: Optional[str] = None
    entry_type: LedgerEntryType
    amount_inr: float
    balance_before_inr: float
    balance_after_inr: float
    description: str
    reference_id: Optional[str] = None
    created_at: datetime

class TopupRequest(BaseModel):
    amount_inr: float = Field(..., gt=0)

# ---------------------------------------------------------------------------
# Impact & Reports
# ---------------------------------------------------------------------------
class ImpactSummaryResponse(BaseModel):
    total_rescued_kg: float
    total_meals_served: int
    total_co2e_saved_kg: float
    total_water_saved_liters: float
    total_rescues_count: int

class ImpactRecordResponse(BaseModel):
    id: str
    delivery_job_id: str
    donor_name: str
    ngo_name: str
    driver_name: str
    rescued_weight_kg: float
    meals_served: int
    co2e_saved_kg: float
    water_saved_liters: float
    landfill_diverted_kg: float
    created_at: datetime

# ---------------------------------------------------------------------------
# Admin & AI Copilot
# ---------------------------------------------------------------------------
class AdminStatsResponse(BaseModel):
    active_rescues: int
    pending_verifications: int
    active_drivers: int
    integrity_reviews: int
    pending_settlements: int
    total_food_rescued_kg: float
    total_meals_served: int

class VerificationReviewRequest(BaseModel):
    status: VerificationStatus # VERIFIED or REJECTED
    admin_notes: Optional[str] = None

class CopilotQueryRequest(BaseModel):
    query: str

class CopilotResponse(BaseModel):
    answer: str
    context: Dict[str, Any] = {}

# ---------------------------------------------------------------------------
# NGO Daily 3-Meal Demand Quotas & AI Proximity Alert Engine
# ---------------------------------------------------------------------------
class MealSlotDetail(BaseModel):
    slot: str  # BREAKFAST, LUNCH, DINNER
    label: str
    time_window: str
    target_kg: float
    fulfilled_kg: float
    remaining_kg: float
    beneficiaries_count: int
    status: str  # ACTIVE_WINDOW, UPCOMING, COMPLETED, DEFICIT

class DailyMealQuotasResponse(BaseModel):
    ngo_id: str
    ngo_name: str
    date: str
    receiving_address: str
    latitude: float
    longitude: float
    active_slot: str
    total_target_kg: float
    total_fulfilled_kg: float
    total_remaining_kg: float
    slots: Dict[str, MealSlotDetail]

class DailyMealQuotasUpdateRequest(BaseModel):
    breakfast_target_kg: Optional[float] = None
    lunch_target_kg: Optional[float] = None
    dinner_target_kg: Optional[float] = None
    breakfast_beneficiaries: Optional[int] = None
    lunch_beneficiaries: Optional[int] = None
    dinner_beneficiaries: Optional[int] = None
    receiving_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ProximityAlertMatch(BaseModel):
    donation_id: str
    donor_id: str
    donor_name: str
    donation_title: str
    food_category: str
    is_veg: bool
    available_quantity_kg: float
    distance_km: float
    estimated_duration_min: float
    matched_slot: str  # BREAKFAST, LUNCH, DINNER
    slot_remaining_need_kg: float
    fulfillment_percentage: float
    urgency: str  # CRITICAL, HIGH, OPTIMAL
    headline: str
    description: str
    pickup_address: str
    deadline: datetime
    delivery_fare_inr: Optional[float] = None
    vehicle_class: Optional[str] = None
    vehicle_name: Optional[str] = None
    is_rush_hour: Optional[bool] = False
    rush_hour_multiplier: Optional[float] = 1.0
    rush_hour_label: Optional[str] = None
    fare_breakdown: Optional[Dict[str, Any]] = None

