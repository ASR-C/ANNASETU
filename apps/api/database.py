"""
ANNASETU Database Connection & Initialization
Supports async sessions for FastAPI handlers and sync sessions for tests/scripts.
Includes auto-migration and demo data seeder.
"""

from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
from apps.api.config import settings
from apps.api.models.db_models import (
    Base, ConfigModel, FoodCategoryModel, VehicleClassModel,
    AchievementDefinition, Profile, Organization, DonorDetails, NgoDetails,
    DriverDetails, Vehicle, Wallet, WalletLedger
)
from apps.api.models.enums import UserRole, VerificationStatus, LedgerEntryType

# Convert database URL for async sqlite or postgres
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    async_db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    sync_db_url = db_url
else:
    async_db_url = db_url
    sync_db_url = settings.SYNC_DATABASE_URL

async_engine = create_async_engine(async_db_url, echo=False)
AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

sync_engine = create_engine(sync_db_url, echo=False)
SyncSessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def seed_initial_data(db: Session):
    """Seed initial categories, vehicles, configs, achievements and demo users."""
    # 1. Config
    if not db.query(ConfigModel).filter(ConfigModel.key == "matching_weights").first():
        db.add(ConfigModel(key="matching_weights", value=settings.DEFAULT_MATCHING_WEIGHTS, version=1))
        db.add(ConfigModel(key="pricing_rules", value={"service_fee_percent": 12.0, "stop_rate_inr": 50.0}, version=1))
        db.add(ConfigModel(key="marketplace_rules", value={"min_donation_kg": 5.0, "reservation_timeout_minutes": 15}, version=1))
        db.add(ConfigModel(key="driver_search_policy", value={"radii_km": [5.0, 10.0, 15.0], "radius_timeout_seconds": 60}, version=1))
        db.add(ConfigModel(key="impact_factors", value={"meals_per_kg": 2.0, "co2e_kg_per_kg": 2.5, "water_liters_per_kg": 154.0}, version=1))

    # 2. Food Categories
    if not db.query(FoodCategoryModel).first():
        categories = [
            FoodCategoryModel(id="COOKED_MEALS", name="Prepared Cooked Meals", description="Freshly prepared hot or warm cooked food", shelf_life_hours=4),
            FoodCategoryModel(id="BAKERY_GRAIN", name="Bakery & Dry Grains", description="Bread, buns, rotis, rice, flour, biscuits", shelf_life_hours=24),
            FoodCategoryModel(id="FRESH_PRODUCE", name="Fresh Fruits & Vegetables", description="Intact raw fruits and vegetables", shelf_life_hours=48),
            FoodCategoryModel(id="DAIRY_PRODUCTS", name="Dairy & Refrigerated", description="Milk, paneer, curd, cheese under cold storage", shelf_life_hours=12),
            FoodCategoryModel(id="PACKAGED_GOODS", name="Packaged & Canned Goods", description="Factory sealed unexpired packaged foods", shelf_life_hours=72),
        ]
        db.add_all(categories)

    # 3. Vehicle Classes
    if not db.query(VehicleClassModel).first():
        vehicles = [
            VehicleClassModel(id="MOTORCYCLE", name="Motorcycle / Bike", max_weight_kg=20.0, max_volume_cft=3.0, base_rate_inr=80.0, per_km_rate_inr=12.0, per_min_rate_inr=1.5),
            VehicleClassModel(id="SCOOTER", name="Scooter with carrier", max_weight_kg=25.0, max_volume_cft=4.0, base_rate_inr=90.0, per_km_rate_inr=13.0, per_min_rate_inr=1.5),
            VehicleClassModel(id="SMALL_VAN", name="Small Cargo Van", max_weight_kg=150.0, max_volume_cft=25.0, base_rate_inr=250.0, per_km_rate_inr=22.0, per_min_rate_inr=2.5),
            VehicleClassModel(id="VAN", name="Standard Delivery Van", max_weight_kg=500.0, max_volume_cft=80.0, base_rate_inr=400.0, per_km_rate_inr=28.0, per_min_rate_inr=3.0),
            VehicleClassModel(id="MINI_TRUCK", name="Mini Truck", max_weight_kg=1500.0, max_volume_cft=250.0, base_rate_inr=800.0, per_km_rate_inr=45.0, per_min_rate_inr=4.5),
            VehicleClassModel(id="TRUCK", name="Commercial Heavy Truck", max_weight_kg=5000.0, max_volume_cft=800.0, base_rate_inr=1800.0, per_km_rate_inr=75.0, per_min_rate_inr=7.0),
        ]
        db.add_all(vehicles)

    # 4. Achievements
    if not db.query(AchievementDefinition).first():
        achievements = [
            AchievementDefinition(id="FIRST_RESCUE", name="First Leap", description="Completed first verified food rescue mission", badge_icon="Zap", milestone_rescues=1, milestone_kg=5.0),
            AchievementDefinition(id="RESCUE_WARRIOR_50", name="Hunger Warrior", description="Completed 50 successful food rescue deliveries", badge_icon="Award", milestone_rescues=50, milestone_kg=500.0),
            AchievementDefinition(id="TON_MILESTONE", name="One Ton Titan", description="Transported over 1,000 kg of edible food", badge_icon="Truck", milestone_rescues=75, milestone_kg=1000.0),
        ]
        db.add_all(achievements)

    # 5. Demo Organizations and Users
    # Simple hash for demo: "password123"
    import hashlib
    demo_pass_hash = hashlib.sha256("password123".encode()).hexdigest()

    # Admin
    if not db.query(Profile).filter(Profile.email == "admin@annasetu.org").first():
        admin = Profile(
            id="admin-profile-001",
            email="admin@annasetu.org",
            hashed_password=demo_pass_hash,
            full_name="Rescue Commander",
            phone="+91-9876543210",
            role=UserRole.ADMIN
        )
        db.add(admin)

    # Donor (Taj Catering / Grand Palace Banquets)
    if not db.query(Profile).filter(Profile.email == "donor@tajkitchens.com").first():
        donor_user = Profile(
            id="donor-profile-001",
            email="donor@tajkitchens.com",
            hashed_password=demo_pass_hash,
            full_name="Chef Vikram Oberoi",
            phone="+91-9820011223",
            role=UserRole.DONOR
        )
        donor_org = Organization(
            id="donor-org-001",
            name="Taj Grand Kitchens & Banquets",
            org_type=UserRole.DONOR,
            verification_status=VerificationStatus.VERIFIED,
            address="Colaba Causeway, Apollo Bunder, Mumbai",
            city="Mumbai",
            latitude=18.9220,
            longitude=72.8347,
            contact_phone="+91-9820011223",
            contact_email="donor@tajkitchens.com",
            created_by=donor_user.id
        )
        donor_details = DonorDetails(
            organization_id=donor_org.id,
            gstin="27AABCU9603R1ZM",
            fssai_license="11521018000456",
            business_type="Luxury Catering & Banquets",
            authorized_person="Vikram Oberoi"
        )
        db.add(donor_user)
        db.add(donor_org)
        db.add(donor_details)

    # NGO (Roti Bank Mumbai Foundation)
    if not db.query(Profile).filter(Profile.email == "coordinator@rotibank.org").first():
        ngo_user = Profile(
            id="ngo-profile-001",
            email="coordinator@rotibank.org",
            hashed_password=demo_pass_hash,
            full_name="Pooja Sharma (Coordinator)",
            phone="+91-9811223344",
            role=UserRole.NGO
        )
        ngo_org = Organization(
            id="ngo-org-001",
            name="Mumbai Roti & Annadaan Foundation",
            org_type=UserRole.NGO,
            verification_status=VerificationStatus.VERIFIED,
            address="Dharavi Welfare Hub, Near Sion Station, Mumbai",
            city="Mumbai",
            latitude=19.0400,
            longitude=72.8550,
            contact_phone="+91-9811223344",
            contact_email="coordinator@rotibank.org",
            created_by=ngo_user.id
        )
        ngo_details = NgoDetails(
            organization_id=ngo_org.id,
            pan="AAATR1234F",
            registration_number="MH/2018/002341",
            ngo_darpan_id="MH/2019/0219842",
            has_80g=True,
            has_12a=True,
            meal_capacity_per_day=500,
            receiving_start_time="07:00:00",
            receiving_end_time="23:00:00"
        )
        ngo_wallet = Wallet(
            id="wallet-ngo-001",
            organization_id=ngo_org.id,
            balance_inr=15000.0,
            reserved_inr=0.0
        )
        db.add(ngo_user)
        db.add(ngo_org)
        db.add(ngo_details)
        db.add(ngo_wallet)
        db.flush()
        db.add(WalletLedger(
            wallet_id=ngo_wallet.id,
            entry_type=LedgerEntryType.DEPOSIT,
            amount_inr=15000.0,
            balance_before_inr=0.0,
            balance_after_inr=15000.0,
            description="Initial CSR Grant Seed Deposit",
            reference_id="INIT-SEED-15K"
        ))

    # Driver (Ramesh Kumar - Verified Van Delivery Partner)
    if not db.query(Profile).filter(Profile.email == "driver@annasetu.org").first():
        driver_user = Profile(
            id="driver-profile-001",
            email="driver@annasetu.org",
            hashed_password=demo_pass_hash,
            full_name="Ramesh Kumar",
            phone="+91-9988776655",
            role=UserRole.DRIVER
        )
        driver_details = DriverDetails(
            profile_id=driver_user.id,
            driving_license_number="MH0120150048291",
            license_expiry_date="2032-12-31",
            emergency_contact="+91-9988776600",
            verification_status=VerificationStatus.VERIFIED,
            is_available=True,
            current_latitude=18.9800, # Between Colaba and Sion
            current_longitude=72.8400,
            rating=4.95,
            total_rescues_completed=28
        )
        driver_vehicle = Vehicle(
            id="vehicle-001",
            driver_id=driver_user.id,
            vehicle_class="VAN",
            registration_number="MH 01 CR 4821",
            rc_number="RC98765432",
            insurance_policy_number="HDFC-ERGO-98124",
            insurance_expiry="2027-11-20",
            puc_expiry="2027-05-15",
            is_verified=True
        )
        db.add(driver_user)
        db.add(driver_details)
        db.add(driver_vehicle)

    db.commit()

def init_db():
    """Create all tables and seed default data synchronously."""
    Base.metadata.create_all(bind=sync_engine)
    with SyncSessionLocal() as session:
        seed_initial_data(session)
