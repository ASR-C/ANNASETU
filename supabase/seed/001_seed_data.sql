-- ============================================================================
-- ANNASETU: Seed Data for Categories, Vehicle Classes, Config, Orgs & Demo
-- ============================================================================

-- 1. Configuration (Version 1)
INSERT INTO config (key, value, version, effective_from) VALUES
('matching_weights', '{"distance": 0.20, "eta": 0.20, "expiry_buffer": 0.15, "need_fulfillment": 0.15, "route_efficiency": 0.10, "driver_availability": 0.10, "deadline_urgency": 0.10}'::jsonb, 1, NOW()),
('pricing_rules', '{"service_fee_percent": 12.0, "stop_rate_inr": 50.0, "night_surge_multiplier": 1.0}'::jsonb, 1, NOW()),
('marketplace_rules', '{"min_donation_kg": 5.0, "reservation_timeout_minutes": 15, "geofence_radius_meters": 150.0}'::jsonb, 1, NOW()),
('driver_search_policy', '{"radii_km": [5.0, 10.0, 15.0], "radius_timeout_seconds": 60, "max_escalation_level": 3}'::jsonb, 1, NOW()),
('impact_factors', '{"meals_per_kg": 2.0, "co2e_kg_per_kg": 2.5, "water_liters_per_kg": 154.0, "landfill_factor": 1.0}'::jsonb, 1, NOW()),
('otp_policy', '{"length": 6, "expiry_minutes": 30, "max_attempts": 3}'::jsonb, 1, NOW())
ON CONFLICT (key, version) DO NOTHING;

-- 2. Food Categories
INSERT INTO food_categories (id, name, description, shelf_life_hours) VALUES
('COOKED_MEALS', 'Prepared Cooked Meals', 'Freshly prepared hot or warm cooked food from kitchens/events', 4),
('BAKERY_GRAIN', 'Bakery & Dry Grains', 'Bread, buns, rotis, rice, flour, biscuits', 24),
('FRESH_PRODUCE', 'Fresh Fruits & Vegetables', 'Intact raw fruits and vegetables', 48),
('DAIRY_PRODUCTS', 'Dairy & Refrigerated', 'Milk, paneer, curd, cheese under cold storage', 12),
('PACKAGED_GOODS', 'Packaged & Canned Goods', 'Factory sealed unexpired packaged foods', 72)
ON CONFLICT (id) DO NOTHING;

-- 3. Vehicle Classes & Capacity Matrix
INSERT INTO vehicle_classes (id, name, max_weight_kg, max_volume_cft, base_rate_inr, per_km_rate_inr, per_min_rate_inr) VALUES
('MOTORCYCLE', 'Motorcycle / Bike', 20.0, 3.0, 80.0, 12.0, 1.5),
('SCOOTER', 'Scooter with carrier', 25.0, 4.0, 90.0, 13.0, 1.5),
('SMALL_VAN', 'Small Cargo Van (ECCO/Omni)', 150.0, 25.0, 250.0, 22.0, 2.5),
('VAN', 'Standard Delivery Van (Bolero/Tata Ace)', 500.0, 80.0, 400.0, 28.0, 3.0),
('MINI_TRUCK', 'Mini Truck (Tata 407)', 1500.0, 250.0, 800.0, 45.0, 4.5),
('TRUCK', 'Large Commercial Truck', 5000.0, 800.0, 1800.0, 75.0, 7.0)
ON CONFLICT (id) DO NOTHING;

-- 4. Achievement Definitions
INSERT INTO achievement_definitions (id, name, description, badge_icon, milestone_rescues, milestone_kg) VALUES
('FIRST_RESCUE', 'First Leap', 'Completed first verified food rescue mission', 'Zap', 1, 5.0),
('RESCUE_WARRIOR_50', 'Hunger Warrior', 'Completed 50 successful food rescue deliveries', 'Award', 50, 500.0),
('CENTURY_HERO_100', 'Century Savior', 'Rescued over 100 surplus food consignments', 'ShieldCheck', 100, 1500.0),
('TON_MILESTONE', 'One Ton Titan', 'Transported more than 1,000 kg of edible food to those in need', 'Truck', 75, 1000.0),
('PLATINUM_GUARDIAN', 'Guardian Angel', 'Completed 500 rescues with zero integrity issues', 'Crown', 500, 10000.0)
ON CONFLICT (id) DO NOTHING;
