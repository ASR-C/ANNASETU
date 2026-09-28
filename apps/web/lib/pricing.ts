/**
 * ANNASETU Transparent Delivery Pricing Engine (Client & Shared)
 * Calculates the exact declared delivery amount shown to NGOs considering:
 * 1. Distance (km) & long distance deadhead buffer (>15 km)
 * 2. Vehicle Type (Motorcycle, Scooter, Small Van, Van, Mini Truck, Truck)
 * 3. Time of Delivery (Rush hour congestion multiplier: morning/evening peak & late night)
 * 4. Amount of Food (weight_kg handling & insulated container surcharge)
 */

export type VehicleClassType = 'MOTORCYCLE' | 'SCOOTER' | 'SMALL_VAN' | 'VAN' | 'MINI_TRUCK' | 'TRUCK';

export interface VehicleRateInfo {
  id: VehicleClassType;
  name: string;
  baseFare: number;
  includedKm: number;
  perKmRate: number;
  maxKg: number;
  description: string;
  iconName: string;
}

export const VEHICLE_RATES: Record<VehicleClassType, VehicleRateInfo> = {
  MOTORCYCLE: {
    id: 'MOTORCYCLE',
    name: 'Eco Motorcycle',
    baseFare: 60.0,
    includedKm: 2.0,
    perKmRate: 10.0,
    maxKg: 20.0,
    description: 'Fast & agile for light rescue batches up to 20 kg',
    iconName: 'Bike',
  },
  SCOOTER: {
    id: 'SCOOTER',
    name: 'Cargo Scooter with Insulated Carrier',
    baseFare: 80.0,
    includedKm: 2.0,
    perKmRate: 12.0,
    maxKg: 30.0,
    description: 'Equipped with thermal insulated box up to 30 kg',
    iconName: 'Scooter',
  },
  SMALL_VAN: {
    id: 'SMALL_VAN',
    name: 'Auto Cargo / Electric Loader',
    baseFare: 220.0,
    includedKm: 2.0,
    perKmRate: 20.0,
    maxKg: 150.0,
    description: 'Three-wheeler cargo box for community catering up to 150 kg',
    iconName: 'Car',
  },
  VAN: {
    id: 'VAN',
    name: 'Insulated Temperature-Controlled Van',
    baseFare: 380.0,
    includedKm: 2.0,
    perKmRate: 28.0,
    maxKg: 500.0,
    description: 'Commercial multi-tier insulated van up to 500 kg',
    iconName: 'Truck',
  },
  MINI_TRUCK: {
    id: 'MINI_TRUCK',
    name: 'Mini Commercial Truck (Tata Ace)',
    baseFare: 750.0,
    includedKm: 2.0,
    perKmRate: 45.0,
    maxKg: 1500.0,
    description: '1-Ton commercial flatbed for heavy banquet clearance up to 1,500 kg',
    iconName: 'Truck',
  },
  TRUCK: {
    id: 'TRUCK',
    name: 'Heavy Freight Transport Truck',
    baseFare: 1600.0,
    includedKm: 2.0,
    perKmRate: 75.0,
    maxKg: 5000.0,
    description: 'Heavy transport for institutional distributions above 1,500 kg',
    iconName: 'Truck',
  },
};

/**
 * Recommends the optimal, most cost-effective vehicle class based on weight.
 */
export function recommendVehicleClass(weightKg: number): VehicleClassType {
  if (weightKg <= 20.0) return 'MOTORCYCLE';
  if (weightKg <= 30.0) return 'SCOOTER';
  if (weightKg <= 150.0) return 'SMALL_VAN';
  if (weightKg <= 500.0) return 'VAN';
  if (weightKg <= 1500.0) return 'MINI_TRUCK';
  return 'TRUCK';
}

/**
 * Evaluates whether delivery time falls in urban rush hours (Morning peak, evening peak, or late night).
 */
export function evaluateRushHour(targetTime?: Date): {
  isRushHour: boolean;
  multiplier: number;
  label: string;
  surgePercent: number;
} {
  const d = targetTime || new Date();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const timeDec = hours + minutes / 60.0;

  // 1. Evening Peak (17:30 to 21:00) - Dinner Rush & Heavy Traffic
  if (timeDec >= 17.5 && timeDec < 21.0) {
    return {
      isRushHour: true,
      multiplier: 1.35,
      label: 'Evening Peak Traffic Rush (+35% Driver Incentive)',
      surgePercent: 35,
    };
  }

  // 2. Morning Peak (08:30 to 11:30) - Commute Traffic
  if (timeDec >= 8.5 && timeDec < 11.5) {
    return {
      isRushHour: true,
      multiplier: 1.25,
      label: 'Morning Commute Rush (+25% Driver Incentive)',
      surgePercent: 25,
    };
  }

  // 3. Late Night Window (22:30 to 05:30) - Night Allowance
  if (timeDec >= 22.5 || timeDec < 5.5) {
    return {
      isRushHour: true,
      multiplier: 1.20,
      label: 'Late Night Delivery Window (+20% Night Allowance)',
      surgePercent: 20,
    };
  }

  // 4. Standard Off-Peak
  return {
    isRushHour: false,
    multiplier: 1.00,
    label: 'Standard Off-Peak Hour (0% Surge)',
    surgePercent: 0,
  };
}

/**
 * Computes volumetric & handling fee for large food batches.
 */
export function calculateFoodHandlingSurcharge(weightKg: number): {
  surcharge: number;
  label: string;
} {
  if (weightKg <= 25.0) {
    return {
      surcharge: 0.0,
      label: 'Standard Light Batch (Free handling included)',
    };
  }
  if (weightKg <= 75.0) {
    const excess = weightKg - 25.0;
    const charge = Math.round(excess * 1.5 * 100) / 100;
    return {
      surcharge: charge,
      label: `Bulk Catering Handling (${weightKg.toFixed(1)} kg • ₹1.50/kg over 25 kg)`,
    };
  }
  if (weightKg <= 200.0) {
    const excess = weightKg - 25.0;
    const charge = Math.round(excess * 2.0 * 100) / 100;
    return {
      surcharge: charge,
      label: `Heavy Banquet Crates Handling (${weightKg.toFixed(1)} kg • ₹2.00/kg over 25 kg)`,
    };
  }
  const excess = weightKg - 25.0;
  const charge = Math.round(excess * 2.5 * 100) / 100;
  return {
    surcharge: charge,
    label: `Commercial Bulk Loading Assistance (${weightKg.toFixed(1)} kg • ₹2.50/kg over 25 kg)`,
  };
}

export interface DeclaredDeliveryFare {
  totalAmountInr: number;
  driverEarningsInr: number;
  serviceFeeInr: number;
  vehicleClass: VehicleClassType;
  vehicleName: string;
  distanceKm: number;
  weightKg: number;
  isRushHour: boolean;
  rushHourMultiplier: number;
  rushHourLabel: string;
  breakdown: {
    vehicleBaseFare: number;
    includedDistanceKm: number;
    billableDistanceKm: number;
    distanceCharge: number;
    longDistanceSurcharge: number;
    foodHandlingCharge: number;
    foodHandlingLabel: string;
    subtotalBeforeSurge: number;
    rushHourSurcharge: number;
    driverPayout: number;
    serviceFee: number;
    finalTotal: number;
  };
}

/**
 * Main declared fare calculation engine.
 */
export function calculateDeclaredDeliveryAmount(params: {
  distanceKm: number;
  weightKg: number;
  vehicleClass?: VehicleClassType;
  deliveryTime?: Date;
  serviceFeePercent?: number;
}): DeclaredDeliveryFare {
  const { distanceKm, weightKg, deliveryTime, serviceFeePercent = 10.0 } = params;

  // 1. Vehicle Selection
  const vClass = params.vehicleClass || recommendVehicleClass(weightKg);
  const cfg = VEHICLE_RATES[vClass] || VEHICLE_RATES.SCOOTER;

  // 2. Distance Calculation
  const baseFare = cfg.baseFare;
  const includedKm = cfg.includedKm;
  const billableDistanceKm = Math.max(0, distanceKm - includedKm);
  const distanceCharge = Math.round(billableDistanceKm * cfg.perKmRate * 100) / 100;

  // Long distance deadhead surcharge (>15 km)
  let longDistanceSurcharge = 0;
  if (distanceKm > 15.0) {
    const excessDist = distanceKm - 15.0;
    longDistanceSurcharge = Math.round(excessDist * (cfg.perKmRate * 0.25) * 100) / 100;
  }
  const totalDistanceFare = Math.round((distanceCharge + longDistanceSurcharge) * 100) / 100;

  // 3. Amount of Food Handling Surcharge
  const handling = calculateFoodHandlingSurcharge(weightKg);

  // 4. Subtotal Before Surge
  const subtotalBeforeSurge = Math.round((baseFare + totalDistanceFare + handling.surcharge) * 100) / 100;

  // 5. Time of Delivery / Rush Hour Evaluation
  const rush = evaluateRushHour(deliveryTime);
  const rushHourSurcharge = Math.round(subtotalBeforeSurge * (rush.multiplier - 1.0) * 100) / 100;

  // 6. Driver Earnings (100% of base + distance + handling + rush surge)
  const driverEarnings = Math.round((subtotalBeforeSurge + rushHourSurcharge) * 100) / 100;

  // 7. Non-Profit Subsidized Platform Service Fee (10%)
  const serviceFee = Math.round(driverEarnings * (serviceFeePercent / 100.0) * 100) / 100;

  // 8. Total Declared Delivery Amount
  const totalNgoCharge = Math.round((driverEarnings + serviceFee) * 100) / 100;

  return {
    totalAmountInr: totalNgoCharge,
    driverEarningsInr: driverEarnings,
    serviceFeeInr: serviceFee,
    vehicleClass: vClass,
    vehicleName: cfg.name,
    distanceKm: Math.round(distanceKm * 10) / 10,
    weightKg: Math.round(weightKg * 10) / 10,
    isRushHour: rush.isRushHour,
    rushHourMultiplier: rush.multiplier,
    rushHourLabel: rush.label,
    breakdown: {
      vehicleBaseFare: baseFare,
      includedDistanceKm: includedKm,
      billableDistanceKm: Math.round(billableDistanceKm * 10) / 10,
      distanceCharge,
      longDistanceSurcharge,
      foodHandlingCharge: handling.surcharge,
      foodHandlingLabel: handling.label,
      subtotalBeforeSurge,
      rushHourSurcharge,
      driverPayout: driverEarnings,
      serviceFee,
      finalTotal: totalNgoCharge,
    },
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
