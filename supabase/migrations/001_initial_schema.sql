-- ============================================================================
-- ANNASETU: Surplus Food Rescue Platform - Supabase PostgreSQL Production Schema
-- Compatible with PostgREST, Next.js Web Client, and Python FastAPI backend.
-- Paste this script directly into Supabase Dashboard -> SQL Editor and click "Run".
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. ENUM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('DONOR', 'NGO', 'DRIVER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'REGISTERED',
        'DOCUMENTS_SUBMITTED',
        'GOVERNMENT_CHECK',
        'ADMIN_REVIEW',
        'VERIFIED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE meal_period AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE need_status AS ENUM ('ACTIVE', 'PAUSED', 'FULFILLED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE food_storage_condition AS ENUM ('AMBIENT', 'REFRIGERATED', 'HEATED', 'FROZEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE donation_status AS ENUM ('AVAILABLE', 'RESERVED', 'ALLOCATED', 'COMPLETED', 'CANCELLED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('HELD', 'CONFIRMED', 'RELEASED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_job_status AS ENUM (
        'AVAILABLE',
        'OFFERED',
        'ON_JOB',
        'ARRIVED_PICKUP',
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ledger_entry_type AS ENUM (
        'DEPOSIT',
        'RESERVE',
        'RELEASE_RESERVE',
        'CHARGE',
        'PAYOUT',
        'PLATFORM_FEE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 3. CONFIGURATION & CATALOG TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_config_key_version UNIQUE (key, version)
);

CREATE TABLE IF NOT EXISTS food_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    shelf_life_hours INT NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    max_weight_kg NUMERIC(8,2) NOT NULL,
    max_volume_cft NUMERIC(8,2),
    base_rate_inr NUMERIC(8,2) NOT NULL,
    per_km_rate_inr NUMERIC(8,2) NOT NULL,
    per_min_rate_inr NUMERIC(8,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. IDENTITY, PROFILES & ORGANIZATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    org_type user_role NOT NULL,
    verification_status verification_status NOT NULL DEFAULT 'VERIFIED',
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
    latitude NUMERIC(10,7) NOT NULL DEFAULT 19.0760,
    longitude NUMERIC(10,7) NOT NULL DEFAULT 72.8777,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_details (
    organization_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    gstin VARCHAR(50),
    fssai_license VARCHAR(50),
    business_type VARCHAR(100),
    authorized_person VARCHAR(255),
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ngo_details (
    organization_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    pan VARCHAR(50),
    registration_number VARCHAR(100),
    ngo_darpan_id VARCHAR(100),
    has_80g BOOLEAN NOT NULL DEFAULT FALSE,
    has_12a BOOLEAN NOT NULL DEFAULT FALSE,
    meal_capacity_per_day INT NOT NULL DEFAULT 250,
    receiving_start_time TIME NOT NULL DEFAULT '08:00:00',
    receiving_end_time TIME NOT NULL DEFAULT '22:00:00',
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_details (
    profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    driving_license_number VARCHAR(100) NOT NULL,
    license_expiry_date DATE NOT NULL DEFAULT '2032-12-31',
    emergency_contact VARCHAR(100),
    verification_status verification_status NOT NULL DEFAULT 'VERIFIED',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    current_latitude NUMERIC(10,7) DEFAULT 18.9800,
    current_longitude NUMERIC(10,7) DEFAULT 72.8400,
    last_location_updated_at TIMESTAMPTZ,
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
    total_rescues_completed INT NOT NULL DEFAULT 0,
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    driver_id TEXT NOT NULL REFERENCES driver_details(profile_id) ON DELETE CASCADE,
    vehicle_class VARCHAR(50) NOT NULL REFERENCES vehicle_classes(id),
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    rc_number VARCHAR(50),
    insurance_policy_number VARCHAR(100),
    insurance_expiry DATE NOT NULL DEFAULT '2028-01-01',
    puc_expiry DATE NOT NULL DEFAULT '2028-01-01',
    fitness_expiry DATE,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_cases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    entity_id TEXT NOT NULL,
    entity_type user_role NOT NULL,
    status verification_status NOT NULL DEFAULT 'VERIFIED',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    admin_notes TEXT,
    gov_lookup_status VARCHAR(50) NOT NULL DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    verification_case_id TEXT REFERENCES verification_cases(id) ON DELETE SET NULL,
    entity_id TEXT,
    document_type VARCHAR(100) NOT NULL,
    document_number VARCHAR(100),
    verified_status VARCHAR(50) DEFAULT 'VERIFIED',
    file_path VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. FOOD RESCUE MARKETPLACE: NEEDS & DONATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS needs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ngo_id TEXT NOT NULL REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    meal_period meal_period NOT NULL DEFAULT 'DINNER',
    food_category VARCHAR(50) NOT NULL REFERENCES food_categories(id),
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    required_quantity_kg NUMERIC(8,2) NOT NULL,
    minimum_acceptable_quantity_kg NUMERIC(8,2) NOT NULL DEFAULT 5.0,
    fulfilled_quantity_kg NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    required_by TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '4 hours'),
    latitude NUMERIC(10,7) NOT NULL DEFAULT 19.0400,
    longitude NUMERIC(10,7) NOT NULL DEFAULT 72.8550,
    receiving_address TEXT NOT NULL,
    special_requirements TEXT,
    status need_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    donor_id TEXT NOT NULL REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    food_category VARCHAR(50) NOT NULL REFERENCES food_categories(id),
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    quantity_kg NUMERIC(8,2) NOT NULL,
    reserved_quantity_kg NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    allocated_quantity_kg NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    available_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '4 hours'),
    storage_condition food_storage_condition NOT NULL DEFAULT 'AMBIENT',
    pickup_address TEXT NOT NULL,
    latitude NUMERIC(10,7) NOT NULL DEFAULT 18.9220,
    longitude NUMERIC(10,7) NOT NULL DEFAULT 72.8347,
    images JSONB DEFAULT '[]'::jsonb,
    seal_number VARCHAR(100),
    special_instructions TEXT,
    status donation_status NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_proposals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    need_id TEXT NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL DEFAULT 95.0,
    factors_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    rejection_reasons JSONB DEFAULT '[]'::jsonb,
    distance_km NUMERIC(8,2) DEFAULT 8.5,
    estimated_duration_min NUMERIC(8,2) DEFAULT 25.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    need_id TEXT NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
    reserved_quantity_kg NUMERIC(8,2) NOT NULL,
    status reservation_status NOT NULL DEFAULT 'HELD',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '15 minutes'),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allocations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
    donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    need_id TEXT NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
    allocated_quantity_kg NUMERIC(8,2) NOT NULL,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. DELIVERY MARKETPLACE & LOGISTICS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    allocation_id TEXT REFERENCES allocations(id) ON DELETE SET NULL,
    donation_id TEXT REFERENCES donations(id) ON DELETE CASCADE,
    need_id TEXT REFERENCES needs(id) ON DELETE CASCADE,
    donor_id TEXT REFERENCES organizations(id),
    ngo_id TEXT REFERENCES organizations(id),
    assigned_driver_id TEXT REFERENCES driver_details(profile_id) ON DELETE SET NULL,
    vehicle_class VARCHAR(50) DEFAULT 'VAN' REFERENCES vehicle_classes(id),
    total_quantity_kg NUMERIC(8,2) DEFAULT 20.0,
    pickup_address TEXT NOT NULL,
    pickup_latitude NUMERIC(10,7) NOT NULL DEFAULT 18.9220,
    pickup_longitude NUMERIC(10,7) NOT NULL DEFAULT 72.8347,
    delivery_address TEXT NOT NULL,
    delivery_latitude NUMERIC(10,7) NOT NULL DEFAULT 19.0400,
    delivery_longitude NUMERIC(10,7) NOT NULL DEFAULT 72.8550,
    estimated_distance_km NUMERIC(8,2) DEFAULT 12.5,
    estimated_duration_min NUMERIC(8,2) DEFAULT 30.0,
    delivery_fare_inr NUMERIC(8,2) DEFAULT 450.0,
    driver_earnings_inr NUMERIC(8,2) DEFAULT 400.0,
    pickup_otp VARCHAR(20) DEFAULT '482910',
    delivery_otp VARCHAR(20) DEFAULT '739102',
    status delivery_job_status NOT NULL DEFAULT 'AVAILABLE',
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. FINANCE & ESG IMPACT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    balance_inr NUMERIC(12,2) NOT NULL DEFAULT 15000.00,
    reserved_inr NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    delivery_job_id TEXT REFERENCES delivery_jobs(id) ON DELETE SET NULL,
    entry_type ledger_entry_type NOT NULL DEFAULT 'DEPOSIT',
    amount_inr NUMERIC(12,2) NOT NULL,
    balance_before_inr NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    balance_after_inr NUMERIC(12,2) NOT NULL DEFAULT 15000.0,
    description TEXT NOT NULL,
    reference_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS impact_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    delivery_job_id TEXT REFERENCES delivery_jobs(id) ON DELETE SET NULL,
    donor_id TEXT REFERENCES organizations(id),
    ngo_id TEXT REFERENCES organizations(id),
    driver_id TEXT REFERENCES profiles(id),
    rescued_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 25.0,
    meals_served INT NOT NULL DEFAULT 50,
    co2e_saved_kg NUMERIC(8,2) NOT NULL DEFAULT 62.5,
    water_saved_liters NUMERIC(10,2) NOT NULL DEFAULT 3850.0,
    landfill_diverted_kg NUMERIC(8,2) NOT NULL DEFAULT 25.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievement_definitions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    badge_icon VARCHAR(100),
    milestone_rescues INT,
    milestone_kg NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Enables open access for anon and authenticated client roles
-- ----------------------------------------------------------------------------
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "anon_all_config" ON config FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_food_categories" ON food_categories FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_vehicle_classes" ON vehicle_classes FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_organizations" ON organizations FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_donor_details" ON donor_details FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_ngo_details" ON ngo_details FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_driver_details" ON driver_details FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_verification_cases" ON verification_cases FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_documents" ON documents FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_needs" ON needs FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_donations" ON donations FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_match_proposals" ON match_proposals FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_allocations" ON allocations FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_delivery_jobs" ON delivery_jobs FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_wallets" ON wallets FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_wallet_ledger" ON wallet_ledger FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_impact_records" ON impact_records FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all_achievement_definitions" ON achievement_definitions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 9. SEED DATA (Configurations, Categories, Vehicle Classes & Demo Entities)
-- ----------------------------------------------------------------------------
INSERT INTO food_categories (id, name, description, shelf_life_hours) VALUES
('COOKED_MEALS', 'Prepared Cooked Meals', 'Freshly prepared hot or warm cooked food from kitchens/events', 4),
('BAKERY_GRAIN', 'Bakery & Dry Grains', 'Bread, buns, rotis, rice, flour, biscuits', 24),
('FRESH_PRODUCE', 'Fresh Fruits & Vegetables', 'Intact raw fruits and vegetables', 48),
('DAIRY_PRODUCTS', 'Dairy & Refrigerated', 'Milk, paneer, curd, cheese under cold storage', 12),
('PACKAGED_GOODS', 'Packaged & Canned Goods', 'Factory sealed unexpired packaged foods', 72)
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicle_classes (id, name, max_weight_kg, max_volume_cft, base_rate_inr, per_km_rate_inr, per_min_rate_inr) VALUES
('MOTORCYCLE', 'Motorcycle / Bike', 20.0, 3.0, 80.0, 12.0, 1.5),
('SCOOTER', 'Scooter with carrier', 25.0, 4.0, 90.0, 13.0, 1.5),
('SMALL_VAN', 'Small Cargo Van (ECCO/Omni)', 150.0, 25.0, 250.0, 22.0, 2.5),
('VAN', 'Standard Delivery Van (Bolero/Tata Ace)', 500.0, 80.0, 400.0, 28.0, 3.0),
('MINI_TRUCK', 'Mini Truck (Tata 407)', 1500.0, 250.0, 800.0, 45.0, 4.5),
('TRUCK', 'Large Commercial Truck', 5000.0, 800.0, 1800.0, 75.0, 7.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO config (key, value, version) VALUES
('matching_weights', '{"distance": 0.20, "eta": 0.20, "expiry_buffer": 0.15, "need_fulfillment": 0.15, "route_efficiency": 0.10, "driver_availability": 0.10, "deadline_urgency": 0.10}'::jsonb, 1),
('pricing_rules', '{"service_fee_percent": 12.0, "stop_rate_inr": 50.0, "night_surge_multiplier": 1.0}'::jsonb, 1),
('marketplace_rules', '{"min_donation_kg": 5.0, "reservation_timeout_minutes": 15, "geofence_radius_meters": 150.0}'::jsonb, 1),
('impact_factors', '{"meals_per_kg": 2.0, "co2e_kg_per_kg": 2.5, "water_liters_per_kg": 154.0}'::jsonb, 1)
ON CONFLICT (key, version) DO NOTHING;

INSERT INTO achievement_definitions (id, name, description, badge_icon, milestone_rescues, milestone_kg) VALUES
('FIRST_RESCUE', 'First Leap', 'Completed first verified food rescue mission', 'Zap', 1, 5.0),
('RESCUE_WARRIOR_50', 'Hunger Warrior', 'Completed 50 successful food rescue deliveries', 'Award', 50, 500.0),
('TON_MILESTONE', 'One Ton Titan', 'Transported more than 1,000 kg of edible food to those in need', 'Truck', 75, 1000.0)
ON CONFLICT (id) DO NOTHING;

-- Seed Demo Profiles & Organizations
INSERT INTO profiles (id, email, hashed_password, full_name, phone, role) VALUES
('donor-profile-001', 'donor@tajkitchens.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Chef Vikram Oberoi', '+91-9820011223', 'DONOR'),
('ngo-profile-001', 'coordinator@rotibank.org', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Pooja Sharma', '+91-9811223344', 'NGO'),
('driver-profile-001', 'driver@annasetu.org', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Ramesh Kumar', '+91-9988776655', 'DRIVER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, name, org_type, verification_status, address, city, latitude, longitude, contact_phone, contact_email, created_by) VALUES
('donor-org-001', 'Taj Grand Kitchens & Banquets', 'DONOR', 'VERIFIED', 'Colaba Causeway, Apollo Bunder, Mumbai', 'Mumbai', 18.9220, 72.8347, '+91-9820011223', 'donor@tajkitchens.com', 'donor-profile-001'),
('ngo-org-001', 'Mumbai Roti & Annadaan Foundation', 'NGO', 'VERIFIED', 'Dharavi Welfare Hub, Near Sion Station, Mumbai', 'Mumbai', 19.0400, 72.8550, '+91-9811223344', 'coordinator@rotibank.org', 'ngo-profile-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO donor_details (organization_id, gstin, fssai_license, business_type, authorized_person) VALUES
('donor-org-001', '27AABCU9603R1ZM', '11521018000456', 'Luxury Catering & Banquets', 'Vikram Oberoi')
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO ngo_details (organization_id, pan, registration_number, ngo_darpan_id, has_80g, has_12a, meal_capacity_per_day) VALUES
('ngo-org-001', 'AAATR1234F', 'MH/2018/002341', 'MH/2019/0219842', TRUE, TRUE, 500)
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO wallets (id, organization_id, balance_inr, reserved_inr) VALUES
('wallet-ngo-001', 'ngo-org-001', 15000.0, 0.0)
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO driver_details (profile_id, driving_license_number, emergency_contact, is_available, rating, total_rescues_completed) VALUES
('driver-profile-001', 'MH0120150048291', '+91-9988776600', TRUE, 4.95, 28)
ON CONFLICT (profile_id) DO NOTHING;

INSERT INTO vehicles (id, driver_id, vehicle_class, registration_number, rc_number, insurance_policy_number) VALUES
('vehicle-001', 'driver-profile-001', 'VAN', 'MH 01 CR 4821', 'RC98765432', 'HDFC-ERGO-98124')
ON CONFLICT (id) DO NOTHING;
