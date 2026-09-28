"""
ANNASETU SQLAlchemy Database Models
Maps 1-to-1 with PostgreSQL / SQLite schema.
Supports both async and sync execution.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Float, Integer, DateTime, Text, JSON, ForeignKey, Enum as SQLEnum, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, relationship
from apps.api.models.enums import (
    UserRole, VerificationStatus, MealPeriod, NeedStatus, FoodStorageCondition,
    DonationStatus, ReservationStatus, VehicleClass, DeliveryJobStatus,
    LedgerEntryType, IntegrityVerdict
)

Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

def gen_uuid():
    return str(uuid.uuid4())

class ConfigModel(Base):
    __tablename__ = "config"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    key = Column(String(100), nullable=False)
    value = Column(JSON, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    effective_from = Column(DateTime(timezone=True), default=get_utc_now)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    __table_args__ = (UniqueConstraint("key", "version", name="uq_config_key_version"),)

class FoodCategoryModel(Base):
    __tablename__ = "food_categories"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    shelf_life_hours = Column(Integer, nullable=False, default=4)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class VehicleClassModel(Base):
    __tablename__ = "vehicle_classes"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    max_weight_kg = Column(Float, nullable=False)
    max_volume_cft = Column(Float, nullable=True)
    base_rate_inr = Column(Float, nullable=False)
    per_km_rate_inr = Column(Float, nullable=False)
    per_min_rate_inr = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    org_type = Column(SQLEnum(UserRole), nullable=False)
    verification_status = Column(SQLEnum(VerificationStatus), nullable=False, default=VerificationStatus.REGISTERED)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(255), nullable=True)
    created_by = Column(String(36), ForeignKey("profiles.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class DonorDetails(Base):
    __tablename__ = "donor_details"
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True)
    gstin = Column(String(50), nullable=True)
    fssai_license = Column(String(50), nullable=True)
    business_type = Column(String(100), nullable=True)
    authorized_person = Column(String(255), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

class NgoDetails(Base):
    __tablename__ = "ngo_details"
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True)
    pan = Column(String(50), nullable=True)
    registration_number = Column(String(100), nullable=True)
    ngo_darpan_id = Column(String(100), nullable=True)
    has_80g = Column(Boolean, nullable=False, default=False)
    has_12a = Column(Boolean, nullable=False, default=False)
    meal_capacity_per_day = Column(Integer, nullable=False, default=100)
    receiving_start_time = Column(String(8), nullable=False, default="08:00:00")
    receiving_end_time = Column(String(8), nullable=False, default="22:00:00")
    verified_at = Column(DateTime(timezone=True), nullable=True)

class DriverDetails(Base):
    __tablename__ = "driver_details"
    profile_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    driving_license_number = Column(String(100), nullable=False)
    license_expiry_date = Column(String(20), nullable=False)
    emergency_contact = Column(String(100), nullable=True)
    verification_status = Column(SQLEnum(VerificationStatus), nullable=False, default=VerificationStatus.REGISTERED)
    is_available = Column(Boolean, nullable=False, default=False)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    last_location_updated_at = Column(DateTime(timezone=True), nullable=True)
    rating = Column(Float, nullable=False, default=5.0)
    total_rescues_completed = Column(Integer, nullable=False, default=0)
    verified_at = Column(DateTime(timezone=True), nullable=True)

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    driver_id = Column(String(36), ForeignKey("driver_details.profile_id", ondelete="CASCADE"), nullable=False)
    vehicle_class = Column(String(50), ForeignKey("vehicle_classes.id"), nullable=False)
    registration_number = Column(String(50), unique=True, nullable=False)
    rc_number = Column(String(50), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True)
    insurance_expiry = Column(String(20), nullable=False)
    puc_expiry = Column(String(20), nullable=False)
    fitness_expiry = Column(String(20), nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class VerificationCase(Base):
    __tablename__ = "verification_cases"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    entity_id = Column(String(36), nullable=False)
    entity_type = Column(SQLEnum(UserRole), nullable=False)
    status = Column(SQLEnum(VerificationStatus), nullable=False, default=VerificationStatus.REGISTERED)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String(36), ForeignKey("profiles.id"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    gov_lookup_status = Column(String(50), nullable=False, default="MANUAL_LOOKUP_REQUIRED")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class Document(Base):
    __tablename__ = "documents"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    verification_case_id = Column(String(36), ForeignKey("verification_cases.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=True)
    extracted_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class Need(Base):
    __tablename__ = "needs"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    ngo_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    title = Column(String(255), nullable=False)
    meal_period = Column(SQLEnum(MealPeriod), nullable=False)
    food_category = Column(String(50), ForeignKey("food_categories.id"), nullable=False)
    is_veg = Column(Boolean, nullable=False, default=True)
    required_quantity_kg = Column(Float, nullable=False)
    minimum_acceptable_quantity_kg = Column(Float, nullable=False)
    fulfilled_quantity_kg = Column(Float, nullable=False, default=0.0)
    required_by = Column(DateTime(timezone=True), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    receiving_address = Column(Text, nullable=False)
    special_requirements = Column(Text, nullable=True)
    status = Column(SQLEnum(NeedStatus), nullable=False, default=NeedStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class Donation(Base):
    __tablename__ = "donations"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    donor_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    title = Column(String(255), nullable=False)
    food_category = Column(String(50), ForeignKey("food_categories.id"), nullable=False)
    is_veg = Column(Boolean, nullable=False, default=True)
    quantity_kg = Column(Float, nullable=False)
    reserved_quantity_kg = Column(Float, nullable=False, default=0.0)
    allocated_quantity_kg = Column(Float, nullable=False, default=0.0)
    available_from = Column(DateTime(timezone=True), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=False)
    storage_condition = Column(SQLEnum(FoodStorageCondition), nullable=False, default=FoodStorageCondition.AMBIENT)
    pickup_address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    images = Column(JSON, default=list)
    seal_number = Column(String(100), nullable=True)
    special_instructions = Column(Text, nullable=True)
    status = Column(SQLEnum(DonationStatus), nullable=False, default=DonationStatus.AVAILABLE)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    __table_args__ = (
        CheckConstraint("quantity_kg >= 5.0", name="chk_min_donation_qty"),
        CheckConstraint("reserved_quantity_kg + allocated_quantity_kg <= quantity_kg", name="chk_reservation_bounds"),
    )

class MatchProposal(Base):
    __tablename__ = "match_proposals"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    donation_id = Column(String(36), ForeignKey("donations.id", ondelete="CASCADE"), nullable=False)
    need_id = Column(String(36), ForeignKey("needs.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    factors_breakdown = Column(JSON, nullable=False)
    is_eligible = Column(Boolean, nullable=False)
    rejection_reasons = Column(JSON, default=list)
    distance_km = Column(Float, nullable=True)
    estimated_duration_min = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    __table_args__ = (UniqueConstraint("donation_id", "need_id", name="uq_match_donation_need"),)

class Reservation(Base):
    __tablename__ = "reservations"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    donation_id = Column(String(36), ForeignKey("donations.id"), nullable=False)
    need_id = Column(String(36), ForeignKey("needs.id"), nullable=False)
    reserved_quantity_kg = Column(Float, nullable=False)
    status = Column(SQLEnum(ReservationStatus), nullable=False, default=ReservationStatus.HELD)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class Allocation(Base):
    __tablename__ = "allocations"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    reservation_id = Column(String(36), ForeignKey("reservations.id"), nullable=False)
    donation_id = Column(String(36), ForeignKey("donations.id"), nullable=False)
    need_id = Column(String(36), ForeignKey("needs.id"), nullable=False)
    allocated_quantity_kg = Column(Float, nullable=False)
    allocated_at = Column(DateTime(timezone=True), default=get_utc_now)

class DeliveryJob(Base):
    __tablename__ = "delivery_jobs"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    allocation_id = Column(String(36), ForeignKey("allocations.id"), nullable=False)
    donation_id = Column(String(36), ForeignKey("donations.id"), nullable=False)
    need_id = Column(String(36), ForeignKey("needs.id"), nullable=False)
    donor_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    ngo_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    assigned_driver_id = Column(String(36), ForeignKey("driver_details.profile_id"), nullable=True)
    vehicle_class = Column(String(50), ForeignKey("vehicle_classes.id"), nullable=False)
    total_quantity_kg = Column(Float, nullable=False)
    pickup_address = Column(Text, nullable=False)
    pickup_latitude = Column(Float, nullable=False)
    pickup_longitude = Column(Float, nullable=False)
    drop_address = Column(Text, nullable=False)
    drop_latitude = Column(Float, nullable=False)
    drop_longitude = Column(Float, nullable=False)
    estimated_distance_km = Column(Float, nullable=False)
    estimated_duration_min = Column(Float, nullable=False)
    actual_distance_km = Column(Float, nullable=True)
    actual_duration_min = Column(Float, nullable=True)
    delivery_fare_inr = Column(Float, nullable=False)
    service_fee_inr = Column(Float, nullable=False)
    total_ngo_charge_inr = Column(Float, nullable=False)
    driver_earnings_inr = Column(Float, nullable=False)
    status = Column(SQLEnum(DeliveryJobStatus), nullable=False, default=DeliveryJobStatus.AVAILABLE)
    search_radius_km = Column(Float, nullable=False, default=5.0)
    pickup_otp_hash = Column(String(255), nullable=True)
    delivery_otp_hash = Column(String(255), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class Seal(Base):
    __tablename__ = "seals"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    delivery_job_id = Column(String(36), ForeignKey("delivery_jobs.id", ondelete="CASCADE"), nullable=False)
    seal_number = Column(String(100), nullable=False)
    applied_by_donor_at = Column(DateTime(timezone=True), default=get_utc_now)
    verified_intact_at_pickup = Column(Boolean, nullable=True)
    verified_intact_at_delivery = Column(Boolean, nullable=True)

class DeliveryEvidence(Base):
    __tablename__ = "delivery_evidence"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    delivery_job_id = Column(String(36), ForeignKey("delivery_jobs.id", ondelete="CASCADE"), nullable=False)
    stage = Column(String(50), nullable=False) # 'PICKUP' or 'DELIVERY'
    photo_url = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geofence_passed = Column(Boolean, nullable=False, default=True)
    captured_at = Column(DateTime(timezone=True), default=get_utc_now)

class IntegrityReview(Base):
    __tablename__ = "integrity_reviews"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    delivery_job_id = Column(String(36), ForeignKey("delivery_jobs.id", ondelete="CASCADE"), nullable=False)
    verdict = Column(SQLEnum(IntegrityVerdict), nullable=False)
    confidence_score = Column(Float, nullable=True)
    details = Column(Text, nullable=True)
    admin_reviewed = Column(Boolean, nullable=False, default=False)
    admin_override_verdict = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), unique=True, nullable=False)
    balance_inr = Column(Float, nullable=False, default=0.00)
    reserved_inr = Column(Float, nullable=False, default=0.00)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    __table_args__ = (CheckConstraint("balance_inr >= reserved_inr", name="chk_wallet_available"),)

class WalletLedger(Base):
    __tablename__ = "wallet_ledger"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    wallet_id = Column(String(36), ForeignKey("wallets.id"), nullable=False)
    delivery_job_id = Column(String(36), ForeignKey("delivery_jobs.id"), nullable=True)
    entry_type = Column(SQLEnum(LedgerEntryType), nullable=False)
    amount_inr = Column(Float, nullable=False)
    balance_before_inr = Column(Float, nullable=False)
    balance_after_inr = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    reference_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class Settlement(Base):
    __tablename__ = "settlements"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    delivery_job_id = Column(String(36), ForeignKey("delivery_jobs.id"), unique=True, nullable=False)
    total_charged_inr = Column(Float, nullable=False)
    driver_payout_inr = Column(Float, nullable=False)
    platform_fee_inr = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="SETTLED")
    settled_at = Column(DateTime(timezone=True), default=get_utc_now)

class ImpactRecord(Base):
    __tablename__ = "impact_records"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    delivery_job_id = Column(String(36), ForeignKey("delivery_jobs.id"), unique=True, nullable=False)
    donor_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    ngo_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    driver_id = Column(String(36), ForeignKey("profiles.id"), nullable=False)
    rescued_weight_kg = Column(Float, nullable=False)
    meals_served = Column(Integer, nullable=False)
    co2e_saved_kg = Column(Float, nullable=False)
    water_saved_liters = Column(Float, nullable=False)
    landfill_diverted_kg = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class AchievementDefinition(Base):
    __tablename__ = "achievement_definitions"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    badge_icon = Column(String(100), nullable=True)
    milestone_rescues = Column(Integer, nullable=True)
    milestone_kg = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class DriverAchievement(Base):
    __tablename__ = "driver_achievements"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    driver_id = Column(String(36), ForeignKey("driver_details.profile_id"), nullable=False)
    achievement_id = Column(String(50), ForeignKey("achievement_definitions.id"), nullable=False)
    awarded_at = Column(DateTime(timezone=True), default=get_utc_now)
    __table_args__ = (UniqueConstraint("driver_id", "achievement_id", name="uq_driver_achievement"),)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    actor_id = Column(String(36), ForeignKey("profiles.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_name = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=False)
    old_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("profiles.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    metadata_json = Column("metadata", JSON, default=dict)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
