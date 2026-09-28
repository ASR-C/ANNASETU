"""
ANNASETU Configuration & Settings
Manages environment variables and application constants.
"""

import os
from pathlib import Path
from pydantic import BaseModel
from typing import Dict, Any, List

# Load .env file from project root if it exists
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

class Settings(BaseModel):
    PROJECT_NAME: str = "ANNASETU"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Environment & Host
    ENV: str = os.getenv("ENV", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./annasetu.db")
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", "sqlite:///./annasetu.db")
    
    # Supabase / Auth / Storage
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "annasetu_super_secret_jwt_key_2026_rescue_platform")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # AI / Groq
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    GROQ_VISION_MODEL: str = "llama-3.2-11b-vision-preview"
    
    # Default Config Fallbacks (Mirrors Config Table)
    DEFAULT_MATCHING_WEIGHTS: Dict[str, float] = {
        "distance": 0.20,
        "eta": 0.20,
        "expiry_buffer": 0.15,
        "need_fulfillment": 0.15,
        "route_efficiency": 0.10,
        "driver_availability": 0.10,
        "deadline_urgency": 0.10,
    }
    
    SERVICE_FEE_PERCENT: float = 12.0
    MIN_DONATION_KG: float = 5.0
    DEFAULT_DRIVER_RADII_KM: List[float] = [5.0, 10.0, 15.0]
    RESERVATION_TIMEOUT_MINUTES: int = 15
    OTP_LENGTH: int = 6
    OTP_EXPIRY_MINUTES: int = 30

settings = Settings()
