"""
ANNASETU Enums
All state machines and catalog keys represented as typed Python enums.
Never use arbitrary status strings in business logic.
"""

from enum import Enum

class UserRole(str, Enum):
    DONOR = "DONOR"
    NGO = "NGO"
    DRIVER = "DRIVER"
    ADMIN = "ADMIN"

class VerificationStatus(str, Enum):
    REGISTERED = "REGISTERED"
    DOCUMENTS_SUBMITTED = "DOCUMENTS_SUBMITTED"
    GOVERNMENT_CHECK = "GOVERNMENT_CHECK"
    ADMIN_REVIEW = "ADMIN_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class MealPeriod(str, Enum):
    BREAKFAST = "BREAKFAST"
    LUNCH = "LUNCH"
    DINNER = "DINNER"
    OTHER = "OTHER"

class NeedStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    FULFILLED = "FULFILLED"
    EXPIRED = "EXPIRED"

class FoodStorageCondition(str, Enum):
    AMBIENT = "AMBIENT"
    REFRIGERATED = "REFRIGERATED"
    HEATED = "HEATED"
    FROZEN = "FROZEN"

class DonationStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    ALLOCATED = "ALLOCATED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class ReservationStatus(str, Enum):
    HELD = "HELD"
    CONFIRMED = "CONFIRMED"
    RELEASED = "RELEASED"
    EXPIRED = "EXPIRED"

class VehicleClass(str, Enum):
    MOTORCYCLE = "MOTORCYCLE"
    SCOOTER = "SCOOTER"
    SMALL_VAN = "SMALL_VAN"
    VAN = "VAN"
    MINI_TRUCK = "MINI_TRUCK"
    TRUCK = "TRUCK"

class DeliveryJobStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    OFFERED = "OFFERED"
    ON_JOB = "ON_JOB"
    ARRIVED_PICKUP = "ARRIVED_PICKUP"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class LedgerEntryType(str, Enum):
    DEPOSIT = "DEPOSIT"
    RESERVE = "RESERVE"
    RELEASE_RESERVE = "RELEASE_RESERVE"
    CHARGE = "CHARGE"
    PAYOUT = "PAYOUT"
    PLATFORM_FEE = "PLATFORM_FEE"

class IntegrityVerdict(str, Enum):
    NO_VISIBLE_DISCREPANCY = "NO_VISIBLE_DISCREPANCY"
    POSSIBLE_PACKAGE_DISCREPANCY = "POSSIBLE_PACKAGE_DISCREPANCY"
    AI_UNAVAILABLE_MANUAL_REVIEW = "AI_UNAVAILABLE_MANUAL_REVIEW"
