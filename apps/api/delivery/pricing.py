"""
ANNASETU Transparent Delivery Pricing Engine
Declares the exact delivery amount shown to NGOs based on 4 deterministic factors:
1. Distance (km) & long-distance buffer
2. Vehicle Type (Motorcycle, Scooter, Small Van, Van, Mini Truck, Truck)
3. Time of Delivery (Rush hour congestion multiplier: morning/evening peak & late night)
4. Amount of Food (weight_kg handling & insulated container surcharge)
"""

from typing import Dict, Any, Tuple, Optional
from datetime import datetime, timezone
from apps.api.models.enums import VehicleClass

# Vehicle default pricing matrix
VEHICLE_CONFIG: Dict[VehicleClass, Dict[str, Any]] = {
    VehicleClass.MOTORCYCLE: {
        "name": "Eco Motorcycle",
        "base_fare": 60.0,
        "included_km": 2.0,
        "per_km_rate": 10.0,
        "max_kg": 20.0,
        "description": "Fast & agile courier for light rescue batches up to 20 kg",
        "icon": "motorcycle",
    },
    VehicleClass.SCOOTER: {
        "name": "Cargo Scooter with Insulated Carrier",
        "base_fare": 80.0,
        "included_km": 2.0,
        "per_km_rate": 12.0,
        "max_kg": 30.0,
        "description": "Fitted with rear food-grade insulated box up to 30 kg",
        "icon": "scooter",
    },
    VehicleClass.SMALL_VAN: {
        "name": "Auto Cargo / Electric Loader",
        "base_fare": 220.0,
        "included_km": 2.0,
        "per_km_rate": 20.0,
        "max_kg": 150.0,
        "description": "Three-wheeler cargo box for community catering up to 150 kg",
        "icon": "small_van",
    },
    VehicleClass.VAN: {
        "name": "Insulated Temperature-Controlled Van",
        "base_fare": 380.0,
        "included_km": 2.0,
        "per_km_rate": 28.0,
        "max_kg": 500.0,
        "description": "Commercial multi-tier insulated van up to 500 kg",
        "icon": "van",
    },
    VehicleClass.MINI_TRUCK: {
        "name": "Mini Commercial Truck (Tata Ace)",
        "base_fare": 750.0,
        "included_km": 2.0,
        "per_km_rate": 45.0,
        "max_kg": 1500.0,
        "description": "1-Ton commercial flatbed for heavy banquet clearance up to 1,500 kg",
        "icon": "mini_truck",
    },
    VehicleClass.TRUCK: {
        "name": "Heavy Freight Transport Truck",
        "base_fare": 1600.0,
        "included_km": 2.0,
        "per_km_rate": 75.0,
        "max_kg": 5000.0,
        "description": "Heavy transport for large institutional distributions above 1,500 kg",
        "icon": "truck",
    },
}

def recommend_vehicle_class(weight_kg: float) -> VehicleClass:
    """Selects the most cost-effective vehicle class capable of transporting the food volume safely."""
    if weight_kg <= 20.0:
        return VehicleClass.MOTORCYCLE
    elif weight_kg <= 30.0:
        return VehicleClass.SCOOTER
    elif weight_kg <= 150.0:
        return VehicleClass.SMALL_VAN
    elif weight_kg <= 500.0:
        return VehicleClass.VAN
    elif weight_kg <= 1500.0:
        return VehicleClass.MINI_TRUCK
    else:
        return VehicleClass.TRUCK

def evaluate_rush_hour(target_time: Optional[datetime] = None) -> Tuple[bool, float, str]:
    """
    Evaluates whether the scheduled or current delivery time falls in urban peak rush hours:
    - Morning Rush (08:30 - 11:30 IST): 1.25x (+25% traffic & driver surge)
    - Evening Rush (17:30 - 21:00 IST): 1.35x (+35% dinner/traffic peak surge)
    - Late Night Window (22:30 - 05:30 IST): 1.20x (+20% night safety & driver incentive)
    - Standard Off-Peak: 1.00x (Regular standard rate)
    """
    now = target_time or datetime.now(timezone.utc)
    # Convert UTC to Indian Standard Time (UTC + 5:30)
    ist_hour = (now.hour + 5 + (1 if now.minute + 30 >= 60 else 0)) % 24
    ist_minute = (now.minute + 30) % 60
    current_time_dec = ist_hour + (ist_minute / 60.0)

    # 1. Evening Peak (17:30 to 21:00)
    if 17.5 <= current_time_dec < 21.0:
        return True, 1.35, "Evening Peak Rush Hour (+35% Traffic Surge)"
    # 2. Morning Peak (08:30 to 11:30)
    elif 8.5 <= current_time_dec < 11.5:
        return True, 1.25, "Morning Commute Rush Hour (+25% Traffic Surge)"
    # 3. Late Night (22:30 to 05:30)
    elif current_time_dec >= 22.5 or current_time_dec < 5.5:
        return True, 1.20, "Late Night Delivery Window (+20% Night Incentive)"
    # 4. Off-Peak Standard
    else:
        return False, 1.00, "Standard Off-Peak Hour (0% Surge)"

def calculate_food_handling_surcharge(weight_kg: float) -> Tuple[float, str]:
    """
    Computes volumetric and physical food handling surcharge:
    - <= 25 kg: Included in base vehicle fare (Light rescue)
    - 25 to 75 kg: ₹1.50/kg for bulk catering container handling
    - 75 to 200 kg: ₹2.00/kg for heavy multi-pot insulated loading
    - > 200 kg: ₹2.50/kg for commercial banquet bulk fleet handling
    """
    if weight_kg <= 25.0:
        return 0.0, "Standard Light Batch (Free handling included)"
    elif weight_kg <= 75.0:
        excess = weight_kg - 25.0
        charge = round(excess * 1.50, 2)
        return charge, f"Bulk Catering Handling ({weight_kg:.1f} kg • ₹1.50/kg over 25 kg)"
    elif weight_kg <= 200.0:
        excess = weight_kg - 25.0
        charge = round(excess * 2.00, 2)
        return charge, f"Heavy Banquet Crates Handling ({weight_kg:.1f} kg • ₹2.00/kg over 25 kg)"
    else:
        excess = weight_kg - 25.0
        charge = round(excess * 2.50, 2)
        return charge, f"Commercial Bulk Loading Assistance ({weight_kg:.1f} kg • ₹2.50/kg over 25 kg)"

def calculate_declared_delivery_amount(
    distance_km: float,
    weight_kg: float,
    vehicle_class: Optional[VehicleClass] = None,
    delivery_time: Optional[datetime] = None,
    service_fee_percent: float = 10.0
) -> Dict[str, Any]:
    """
    Declares the exact, itemized delivery amount shown to NGOs based on:
    1. Distance (km) & long distance buffer
    2. Vehicle Type
    3. Time of Delivery (Rush hour status)
    4. Amount of Food (weight_kg)
    """
    # 1. Vehicle Selection
    v_class = vehicle_class or recommend_vehicle_class(weight_kg)
    cfg = VEHICLE_CONFIG.get(v_class, VEHICLE_CONFIG[VehicleClass.SCOOTER])

    # 2. Base Fare & Distance Calculation
    base_fare = cfg["base_fare"]
    included_km = cfg["included_km"]
    billable_distance_km = max(0.0, distance_km - included_km)
    per_km_rate = cfg["per_km_rate"]

    distance_charge = round(billable_distance_km * per_km_rate, 2)

    # Long distance deadhead surcharge (> 15 km)
    long_distance_surcharge = 0.0
    if distance_km > 15.0:
        excess_dist = distance_km - 15.0
        long_distance_surcharge = round(excess_dist * (per_km_rate * 0.25), 2)

    total_distance_fare = round(distance_charge + long_distance_surcharge, 2)

    # 3. Food Amount Handling Surcharge
    food_handling_charge, handling_label = calculate_food_handling_surcharge(weight_kg)

    # 4. Subtotal Before Surge
    subtotal_before_surge = round(base_fare + total_distance_fare + food_handling_charge, 2)

    # 5. Time of Delivery (Rush Hour Evaluation)
    is_rush_hour, rush_multiplier, rush_label = evaluate_rush_hour(delivery_time)
    rush_hour_surcharge = round(subtotal_before_surge * (rush_multiplier - 1.0), 2)

    # 6. Driver Payout (100% of transport fare + surge)
    driver_earnings = round(subtotal_before_surge + rush_hour_surcharge, 2)

    # 7. Non-Profit Subsidized Platform Service Fee (covers cargo insurance & OTP security)
    service_fee = round(driver_earnings * (service_fee_percent / 100.0), 2)

    # 8. Total Declared Delivery Amount Shown to NGO
    total_ngo_charge = round(driver_earnings + service_fee, 2)

    return {
        "total_amount_inr": total_ngo_charge,
        "driver_earnings_inr": driver_earnings,
        "service_fee_inr": service_fee,
        "vehicle_class": v_class.value,
        "vehicle_name": cfg["name"],
        "distance_km": round(distance_km, 1),
        "weight_kg": round(weight_kg, 1),
        "is_rush_hour": is_rush_hour,
        "rush_hour_multiplier": rush_multiplier,
        "rush_hour_label": rush_label,
        "breakdown": {
            "vehicle_base_fare": base_fare,
            "included_distance_km": included_km,
            "billable_distance_km": round(billable_distance_km, 1),
            "distance_charge": distance_charge,
            "long_distance_surcharge": long_distance_surcharge,
            "food_handling_charge": food_handling_charge,
            "food_handling_label": handling_label,
            "subtotal_before_surge": subtotal_before_surge,
            "rush_hour_surcharge": rush_hour_surcharge,
            "driver_payout": driver_earnings,
            "service_fee": service_fee,
            "final_total": total_ngo_charge,
        }
    }

def calculate_delivery_fare(
    weight_kg: float,
    distance_km: float,
    duration_min: float = 0.0,
    num_stops: int = 1,
    vehicle_class: VehicleClass = None,
    service_fee_percent: float = 10.0,
    stop_rate_inr: float = 50.0,
    delivery_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Backwards-compatible wrapper returning standard dictionary format,
    enhanced with 4-factor declared pricing logic.
    """
    quote = calculate_declared_delivery_amount(
        distance_km=distance_km,
        weight_kg=weight_kg,
        vehicle_class=vehicle_class,
        delivery_time=delivery_time,
        service_fee_percent=service_fee_percent
    )

    bd = quote["breakdown"]
    return {
        "vehicle_class": quote["vehicle_class"],
        "vehicle_name": quote["vehicle_name"],
        "base_fare": bd["vehicle_base_fare"],
        "distance_fare": bd["distance_charge"],
        "duration_fare": 0.0,
        "stops_fare": 0.0,
        "food_handling_fare": bd["food_handling_charge"],
        "rush_hour_surcharge": bd["rush_hour_surcharge"],
        "is_rush_hour": quote["is_rush_hour"],
        "rush_hour_label": quote["rush_hour_label"],
        "rush_hour_multiplier": quote["rush_hour_multiplier"],
        "delivery_fare": quote["driver_earnings_inr"],
        "service_fee": quote["service_fee_inr"],
        "total_ngo_charge": quote["total_amount_inr"],
        "driver_earnings": quote["driver_earnings_inr"],
        "breakdown": bd
    }
