"""
Tests for ANNASETU Statutory Verification Options
Validates that users can select between authorized statutory documents for:
- NGOs (5 options)
- Vendors (4 options)
- Drivers (4 options)
"""

import pytest
from apps.api.models.verification_registry import (
    VERIFICATION_CATALOG, validate_credential_format, get_verification_option
)

def test_ngo_verification_options():
    ngo_options = VERIFICATION_CATALOG["NGO"]
    option_ids = [o["id"] for o in ngo_options]
    
    assert "REGISTRATION_CERTIFICATE" in option_ids
    assert "TAX_EXEMPTION_12A_80G" in option_ids
    assert "NGO_DARPAN" in option_ids
    assert "ORGANIZATION_PAN" in option_ids
    assert "AUDITED_FINANCIALS" in option_ids

    # 1. Registration Certificate
    res = validate_credential_format("NGO", "REGISTRATION_CERTIFICATE", "MH/TRUST/2018/002341")
    assert res["valid"] is True
    assert "Registrar of Public Trusts" in res["issuing_authority"]

    # 2. 12A & 80G Certificates
    res = validate_credential_format("NGO", "TAX_EXEMPTION_12A_80G", "AAATR1234FE20214")
    assert res["valid"] is True
    assert "Income Tax Department" in res["issuing_authority"]

    # 3. NGO Darpan Unique ID
    res = validate_credential_format("NGO", "NGO_DARPAN", "MH/2019/0219842")
    assert res["valid"] is True
    assert "NITI Aayog" in res["issuing_authority"]

    # 4. PAN Card in the Organization's Name
    res = validate_credential_format("NGO", "ORGANIZATION_PAN", "AAATR1234F")
    assert res["valid"] is True
    assert "Central Board of Direct Taxes" in res["issuing_authority"]

    # 5. Audited Financial Statements & Annual Reports
    res = validate_credential_format("NGO", "AUDITED_FINANCIALS", "UDIN-24098124BCAW4912")
    assert res["valid"] is True
    assert "Institute of Chartered Accountants of India" in res["issuing_authority"]


def test_vendor_verification_options():
    vendor_options = VERIFICATION_CATALOG["DONOR"]
    option_ids = [o["id"] for o in vendor_options]

    assert "FSSAI_LICENSE" in option_ids
    assert "GSTIN" in option_ids
    assert "TRADE_LICENSE" in option_ids
    assert "FIRE_SAFETY_POLLUTION_NOC" in option_ids

    # 1. FSSAI License
    res = validate_credential_format("DONOR", "FSSAI_LICENSE", "11521018000456")
    assert res["valid"] is True
    assert "FSSAI" in res["issuing_authority"]

    # 2. GSTIN
    res = validate_credential_format("DONOR", "GSTIN", "27AABCU9603R1ZM")
    assert res["valid"] is True
    assert "Goods and Services Tax" in res["issuing_authority"]

    # 3. Trade License
    res = validate_credential_format("DONOR", "TRADE_LICENSE", "MCGM-SHOP-2022-849201")
    assert res["valid"] is True
    assert "Municipal" in res["issuing_authority"]

    # 4. Fire Safety NOC
    res = validate_credential_format("DONOR", "FIRE_SAFETY_POLLUTION_NOC", "FIRE-NOC-MH-2023-44182")
    assert res["valid"] is True


def test_driver_verification_options():
    driver_options = VERIFICATION_CATALOG["DRIVER"]
    option_ids = [o["id"] for o in driver_options]

    assert "GOVT_PHOTO_ID" in option_ids
    assert "VALID_DRIVING_LICENSE" in option_ids
    assert "POLICE_VERIFICATION_REPORT" in option_ids
    assert "AGGREGATOR_COMPANY_BADGE" in option_ids

    # 1. Government Photo ID
    res = validate_credential_format("DRIVER", "GOVT_PHOTO_ID", "9842-8821-4192")
    assert res["valid"] is True

    # 2. Valid Driving License
    res = validate_credential_format("DRIVER", "VALID_DRIVING_LICENSE", "MH0120150048291")
    assert res["valid"] is True
    assert "MoRTH" in res["issuing_authority"]

    # 3. Police Verification Report (PVR)
    res = validate_credential_format("DRIVER", "POLICE_VERIFICATION_REPORT", "PVR-MUMBAI-POLICE-2024-88419")
    assert res["valid"] is True
    assert "Police" in res["issuing_authority"]

    # 4. Aggregator / Company ID Badge
    res = validate_credential_format("DRIVER", "AGGREGATOR_COMPANY_BADGE", "LOGIX-FLEET-EMP-77412")
    assert res["valid"] is True
