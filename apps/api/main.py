"""
ANNASETU FastAPI Application Entrypoint
Surplus Food Rescue Platform API
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.config import settings
from apps.api.database import init_db
from apps.api.routers import (
    auth, needs, donations, matching, reservations,
    delivery, finance, impact, admin, copilot
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite/PostgreSQL schema and seed demo data
    init_db()
    yield

app = FastAPI(
    title="ANNASETU API",
    description="Need-Driven Surplus-Food Rescue Marketplace Platform",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Domain Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(needs.router, prefix=settings.API_PREFIX)
app.include_router(donations.router, prefix=settings.API_PREFIX)
app.include_router(matching.router, prefix=settings.API_PREFIX)
app.include_router(reservations.router, prefix=settings.API_PREFIX)
app.include_router(delivery.router, prefix=settings.API_PREFIX)
app.include_router(finance.router, prefix=settings.API_PREFIX)
app.include_router(impact.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(copilot.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "platform": "ANNASETU",
        "tagline": "Connecting Surplus Food to Verified Need",
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "OPERATIONAL"
    }

@app.get("/health")
def health_check():
    return {"status": "HEALTHY", "database": "CONNECTED", "version": settings.VERSION}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host=settings.HOST, port=settings.PORT, reload=True)
