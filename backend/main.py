"""
main.py
-------
FastAPI application entry-point.
  - Creates all database tables on startup
  - Seeds the default admin user
  - Registers all routers
  - Configures CORS for the Next.js frontend
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine
from auth import seed_admin_user
from routers import auth as auth_router
from routers import hosted_zones as hz_router
from routers import dns_records as dns_router

# ---------------------------------------------------------------------------
# Lifespan: replaces deprecated @app.on_event("startup")
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────
    print("[startup] Creating database tables...")
    Base.metadata.create_all(bind=engine)

    print("[startup] Seeding admin user...")
    db = SessionLocal()
    try:
        seed_admin_user(db)
    finally:
        db.close()

    print("[startup] Ready.")
    yield
    # ── Shutdown (nothing to clean up for SQLite) ─────────────────────────


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AWS Route53 Clone — API",
    description=(
        "A functional clone of the AWS Route53 web service. "
        "Provides CRUD for Hosted Zones and DNS Records with JWT-based auth."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js dev server and any production origin
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:3000",   # Next.js dev
    "http://127.0.0.1:3000",
    # Add your production domain here when deploying
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router.router, prefix="/api/auth", tags=["Auth"])
app.include_router(hz_router.router,   prefix="/api/hosted-zones", tags=["Hosted Zones"])

# DNS records are nested: /api/hosted-zones/{zone_id}/records
app.include_router(
    dns_router.router,
    prefix="/api/hosted-zones/{zone_id}/records",
    tags=["DNS Records"],
)

# ---------------------------------------------------------------------------
# Health-check endpoint (always available — no auth required)
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "route53-clone-api"}


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "AWS Route53 Clone API",
        "docs": "/docs",
        "health": "/health",
    }
