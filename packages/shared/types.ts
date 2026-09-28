/**
 * ANNASETU Shared Types & Contracts
 * Auto-aligned with FastAPI OpenAPI schemas & Supabase Enums
 */

export type UserRole = 'DONOR' | 'NGO' | 'DRIVER' | 'ADMIN';

export type VerificationStatus =
  | 'REGISTERED'
  | 'DOCUMENTS_SUBMITTED'
  | 'GOVERNMENT_CHECK'
  | 'ADMIN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type MealPeriod = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'OTHER';

export type NeedStatus = 'ACTIVE' | 'PAUSED' | 'FULFILLED' | 'EXPIRED';

export type FoodStorageCondition = 'AMBIENT' | 'REFRIGERATED' | 'HEATED' | 'FROZEN';

export type DonationStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'ALLOCATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type ReservationStatus = 'HELD' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';

export type VehicleClass =
  | 'MOTORCYCLE'
  | 'SCOOTER'
  | 'SMALL_VAN'
  | 'VAN'
  | 'MINI_TRUCK'
  | 'TRUCK';

export type DeliveryJobStatus =
  | 'AVAILABLE'
  | 'OFFERED'
  | 'ON_JOB'
  | 'ARRIVED_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type LedgerEntryType =
  | 'DEPOSIT'
  | 'RESERVE'
  | 'RELEASE_RESERVE'
  | 'CHARGE'
  | 'PAYOUT'
  | 'PLATFORM_FEE';

export type IntegrityVerdict =
  | 'NO_VISIBLE_DISCREPANCY'
  | 'POSSIBLE_PACKAGE_DISCREPANCY'
  | 'AI_UNAVAILABLE_MANUAL_REVIEW';

export interface ScoreFactors {
  distance: number;
  eta: number;
  expiry_buffer: number;
  need_fulfillment: number;
  route_efficiency: number;
  driver_availability: number;
  deadline_urgency: number;
}

export interface MatchProposalDTO {
  id: string;
  donation_id: string;
  need_id: string;
  score: number;
  factors_breakdown: ScoreFactors;
  is_eligible: boolean;
  rejection_reasons: string[];
  distance_km: number;
  estimated_duration_min: number;
  ngo_name?: string;
  donor_name?: string;
  need_title?: string;
  donation_title?: string;
  quantity_kg?: number;
}

export interface UserProfileDTO {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  organization_id?: string;
  organization_name?: string;
  verification_status?: VerificationStatus;
}

export interface NeedDTO {
  id: string;
  ngo_id: string;
  ngo_name?: string;
  title: string;
  meal_period: MealPeriod;
  food_category: string;
  is_veg: boolean;
  required_quantity_kg: number;
  minimum_acceptable_quantity_kg: number;
  fulfilled_quantity_kg: number;
  required_by: string;
  latitude: number;
  longitude: number;
  receiving_address: string;
  special_requirements?: string;
  status: NeedStatus;
  created_at: string;
}

export interface DonationDTO {
  id: string;
  donor_id: string;
  donor_name?: string;
  title: string;
  food_category: string;
  is_veg: boolean;
  quantity_kg: number;
  reserved_quantity_kg: number;
  allocated_quantity_kg: number;
  available_from: string;
  deadline: string;
  storage_condition: FoodStorageCondition;
  pickup_address: string;
  latitude: number;
  longitude: number;
  images: string[];
  seal_number?: string;
  special_instructions?: string;
  status: DonationStatus;
  created_at: string;
}

export interface DeliveryJobDTO {
  id: string;
  allocation_id: string;
  donation_id: string;
  need_id: string;
  donor_id: string;
  donor_name: string;
  ngo_id: string;
  ngo_name: string;
  assigned_driver_id?: string;
  driver_name?: string;
  vehicle_class: VehicleClass;
  total_quantity_kg: number;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  drop_address: string;
  drop_latitude: number;
  drop_longitude: number;
  estimated_distance_km: number;
  estimated_duration_min: number;
  delivery_fare_inr: number;
  service_fee_inr: number;
  total_ngo_charge_inr: number;
  driver_earnings_inr: number;
  status: DeliveryJobStatus;
  pickup_otp?: string;
  delivery_otp?: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface ImpactRecordDTO {
  id: string;
  delivery_job_id: string;
  donor_name: string;
  ngo_name: string;
  driver_name: string;
  rescued_weight_kg: number;
  meals_served: number;
  co2e_saved_kg: number;
  water_saved_liters: number;
  landfill_diverted_kg: number;
  created_at: string;
}

export interface WalletDTO {
  id: string;
  organization_id: string;
  balance_inr: number;
  reserved_inr: number;
  available_inr: number;
}
