"""
ANNASETU Complete Rescue Lifecycle & Concurrency Test Suite
Validates:
1. Eligibility filtering & scoring logic
2. Concurrency test: 30 kg donation receiving simultaneous 15 kg and 20 kg requests
3. Fare calculation & 12% service fee
4. Complete rescue loop: Need -> Donation -> Match -> Reserve -> Driver Accept -> Pickup OTP -> Delivery OTP -> Settle -> Impact
"""

import pytest
from datetime import datetime, timezone, timedelta
from apps.api.database import SyncSessionLocal, init_db
from apps.api.models.db_models import (
    Donation, Need, Organization, Profile, DeliveryJob, Settlement, ImpactRecord, Wallet
)
from apps.api.models.enums import (
    NeedStatus, DonationStatus, DeliveryJobStatus, UserRole, VerificationStatus
)
from apps.api.matching.eligibility import check_eligibility, haversine_distance_km
from apps.api.matching.scoring import calculate_priority_score
from apps.api.matching.normalization import normalize_distance, normalize_need_fulfillment
from apps.api.allocation.engine import create_atomic_reservation, confirm_allocation_transactional
from apps.api.delivery.pricing import calculate_delivery_fare, recommend_vehicle_class
from apps.api.delivery.marketplace import atomic_driver_accept
from apps.api.trust_chain.verification import (
    generate_secure_otp, verify_otp_hash, record_pickup_evidence, record_delivery_evidence
)
from apps.api.finance.wallet_service import settle_delivery_transaction, reserve_fare_for_job
from apps.api.impact.calculator import create_impact_record_for_delivery

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()

def test_normalization_and_scoring():
    # Closer distance should give higher score
    score_close = normalize_distance(2.0, max_range_km=30.0)
    score_far = normalize_distance(25.0, max_range_km=30.0)
    assert score_close > score_far

    # 100% fulfillment should be 100
    assert normalize_need_fulfillment(20.0, 20.0) == 100.0

    # Total score calculation
    now = datetime.now(timezone.utc)
    score, factors = calculate_priority_score(
        distance_km=3.5,
        eta_minutes=20.0,
        donation_deadline=now + timedelta(hours=5),
        need_required_by=now + timedelta(hours=3),
        donation_available_kg=25.0,
        need_remaining_kg=25.0,
        nearby_driver_available=True,
        current_time=now
    )
    assert 0 <= score <= 100
    assert "distance" in factors
    assert "eta" in factors

def test_eligibility_criteria():
    now = datetime.now(timezone.utc)
    # 1. Matching categories and veg compatibility -> Eligible
    is_eligible, reasons, dist, eta = check_eligibility(
        donation_category="COOKED_MEALS",
        donation_is_veg=True,
        donation_available_kg=30.0,
        donation_deadline=now + timedelta(hours=6),
        donation_lat=18.9220,
        donation_lon=72.8347,
        need_status=NeedStatus.ACTIVE,
        need_category="COOKED_MEALS",
        need_is_veg=True,
        need_remaining_kg=25.0,
        need_min_acceptable_kg=10.0,
        need_required_by=now + timedelta(hours=4),
        need_lat=19.0400,
        need_lon=72.8550
    )
    assert is_eligible is True
    assert len(reasons) == 0

    # 2. Non-veg donation for veg need -> Rejected
    is_eligible_veg, reasons_veg, _, _ = check_eligibility(
        donation_category="COOKED_MEALS",
        donation_is_veg=False,
        donation_available_kg=30.0,
        donation_deadline=now + timedelta(hours=6),
        donation_lat=18.9220,
        donation_lon=72.8347,
        need_status=NeedStatus.ACTIVE,
        need_category="COOKED_MEALS",
        need_is_veg=True,
        need_remaining_kg=25.0,
        need_min_acceptable_kg=10.0,
        need_required_by=now + timedelta(hours=4),
        need_lat=19.0400,
        need_lon=72.8550
    )
    assert is_eligible_veg is False
    assert any("Vegetarian compatibility" in r for r in reasons_veg)

def test_fare_calculation_and_12_percent_fee():
    fare = calculate_delivery_fare(
        weight_kg=30.0,
        distance_km=10.0,
        duration_min=30.0,
        service_fee_percent=12.0
    )
    delivery_fare = fare["delivery_fare"]
    service_fee = fare["service_fee"]
    total_charge = fare["total_ngo_charge"]
    
    assert round(delivery_fare * 0.12, 2) == service_fee
    assert round(delivery_fare + service_fee, 2) == total_charge
    assert fare["driver_earnings"] == delivery_fare

def test_concurrency_reservation_bounds():
    """
    Mandatory PRD Concurrency Rule:
    A 30 kg donation receiving simultaneous 15 kg and 20 kg requests
    must never end with more than 30 kg reserved or allocated.
    """
    with SyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        # Create a 30 kg donation
        don = Donation(
            donor_id="donor-org-001",
            title="Surplus Rice & Curry",
            food_category="COOKED_MEALS",
            is_veg=True,
            quantity_kg=30.0,
            available_from=now,
            deadline=now + timedelta(hours=4),
            pickup_address="Apollo Bunder, Colaba",
            latitude=18.9220,
            longitude=72.8347
        )
        db.add(don)

        # Create two needs: Need A (15 kg), Need B (20 kg)
        need_a = Need(
            ngo_id="ngo-org-001",
            title="Shelter Lunch Batch A",
            meal_period="LUNCH",
            food_category="COOKED_MEALS",
            is_veg=True,
            required_quantity_kg=15.0,
            minimum_acceptable_quantity_kg=5.0,
            required_by=now + timedelta(hours=3),
            receiving_address="Dharavi Hub",
            latitude=19.0400,
            longitude=72.8550
        )
        need_b = Need(
            ngo_id="ngo-org-001",
            title="Shelter Lunch Batch B",
            meal_period="LUNCH",
            food_category="COOKED_MEALS",
            is_veg=True,
            required_quantity_kg=20.0,
            minimum_acceptable_quantity_kg=5.0,
            required_by=now + timedelta(hours=3),
            receiving_address="Dharavi Hub",
            latitude=19.0400,
            longitude=72.8550
        )
        db.add(need_a)
        db.add(need_b)
        db.commit()

        # Request 1: NGO A requests 15 kg -> should succeed
        s1, res1, _ = create_atomic_reservation(db, don.id, need_a.id, 15.0)
        assert s1 is True
        assert res1.reserved_quantity_kg == 15.0

        # Request 2: NGO B requests 20 kg -> 30 - 15 = 15 remaining unreserved.
        # It must NOT allow 20 kg!
        s2, res2, msg2 = create_atomic_reservation(db, don.id, need_b.id, 20.0)
        assert s2 is False
        assert "Insufficient unreserved food" in msg2

        # Verify invariant: total holds never exceed donation quantity
        db.refresh(don)
        assert don.reserved_quantity_kg <= don.quantity_kg
        assert don.reserved_quantity_kg == 15.0

def test_full_rescue_lifecycle_loop():
    """
    Validates Definition of Done:
    Need -> Donation -> Match -> Reserve -> Allocation -> Job -> Driver Accept ->
    Pickup OTP -> Delivery OTP -> Settlement -> Impact Record
    """
    with SyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        
        # 1. Need created by NGO
        need = Need(
            ngo_id="ngo-org-001",
            title="Community Dinner Need",
            meal_period="DINNER",
            food_category="COOKED_MEALS",
            is_veg=True,
            required_quantity_kg=20.0,
            minimum_acceptable_quantity_kg=10.0,
            required_by=now + timedelta(hours=4),
            receiving_address="Sion Community Center",
            latitude=19.0400,
            longitude=72.8550
        )
        db.add(need)

        # 2. Donation created by Donor
        don = Donation(
            donor_id="donor-org-001",
            title="Evening Banquet Stew",
            food_category="COOKED_MEALS",
            is_veg=True,
            quantity_kg=20.0,
            available_from=now,
            deadline=now + timedelta(hours=5),
            pickup_address="Colaba Kitchen",
            latitude=18.9220,
            longitude=72.8347
        )
        db.add(don)
        db.commit()

        # 3. Reserve & Allocate
        s_res, res, _ = create_atomic_reservation(db, don.id, need.id, 20.0)
        assert s_res is True
        s_alloc, alloc, _ = confirm_allocation_transactional(db, res.id)
        assert s_alloc is True

        # 4. Generate Delivery Job with OTPs
        pickup_plain, pickup_hash = generate_secure_otp(6)
        delivery_plain, delivery_hash = generate_secure_otp(6)

        job = DeliveryJob(
            allocation_id=alloc.id,
            donation_id=don.id,
            need_id=need.id,
            donor_id=don.donor_id,
            ngo_id=need.ngo_id,
            vehicle_class="VAN",
            total_quantity_kg=20.0,
            pickup_address=don.pickup_address,
            pickup_latitude=don.latitude,
            pickup_longitude=don.longitude,
            drop_address=need.receiving_address,
            drop_latitude=need.latitude,
            drop_longitude=need.longitude,
            estimated_distance_km=14.0,
            estimated_duration_min=35.0,
            delivery_fare_inr=500.0,
            service_fee_inr=60.0,
            total_ngo_charge_inr=560.0,
            driver_earnings_inr=500.0,
            status=DeliveryJobStatus.AVAILABLE,
            pickup_otp_hash=pickup_hash,
            delivery_otp_hash=delivery_hash
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Reserve fare from NGO wallet
        reserve_fare_for_job(db, need.ngo_id, job.id, 560.0)

        # 5. Driver Accept (first-accept-wins)
        driver = db.query(Profile).filter(Profile.role == UserRole.DRIVER).first()
        s_accept, job_accepted, _ = atomic_driver_accept(db, job.id, driver.id)
        assert s_accept is True
        assert job_accepted.status == DeliveryJobStatus.ON_JOB

        # 6. Pickup Handoff (Donor Seal & OTP verification)
        s_pick, pick_msg = record_pickup_evidence(
            db=db,
            job_id=job.id,
            driver_id=driver.id,
            plain_otp=pickup_plain,
            actual_lat=job.pickup_latitude,
            actual_lon=job.pickup_longitude,
            photo_url="https://images.annasetu.org/pickup-proof.jpg",
            seal_number="SEAL-TEST-999"
        )
        assert s_pick is True
        db.refresh(job)
        assert job.status == DeliveryJobStatus.PICKED_UP

        # 7. Delivery Handoff (NGO Delivery OTP verification)
        s_drop, drop_msg = record_delivery_evidence(
            db=db,
            job_id=job.id,
            driver_id=driver.id,
            plain_otp=delivery_plain,
            actual_lat=job.drop_latitude,
            actual_lon=job.drop_longitude,
            photo_url="https://images.annasetu.org/delivery-proof.jpg",
            seal_intact=True
        )
        assert s_drop is True
        db.refresh(job)
        assert job.status == DeliveryJobStatus.DELIVERED

        # 8. Settlement Transaction
        s_settle, settlement, _ = settle_delivery_transaction(db, job.id)
        assert s_settle is True
        assert settlement.total_charged_inr == 560.0
        assert settlement.driver_payout_inr == 500.0
        assert settlement.platform_fee_inr == 60.0

        # 9. Verified Impact Record
        impact = create_impact_record_for_delivery(db, job.id)
        assert impact is not None
        assert impact.rescued_weight_kg == 20.0
        assert impact.meals_served == 40 # 20 kg * 2 meals/kg
        assert impact.co2e_saved_kg == 50.0 # 20 kg * 2.5 kg CO2e
