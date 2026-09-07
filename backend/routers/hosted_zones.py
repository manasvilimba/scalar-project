"""
routers/hosted_zones.py
-----------------------
Hosted Zone CRUD endpoints (all require authentication):

  GET    /api/hosted-zones                  — list + search + paginate
  POST   /api/hosted-zones                  — create
  GET    /api/hosted-zones/{zone_id}        — get single zone
  PUT    /api/hosted-zones/{zone_id}        — update (comment only, mirrors AWS)
  DELETE /api/hosted-zones/{zone_id}        — delete (cascades records)
"""

import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import HostedZone, User
from schemas import (
    HostedZoneCreate,
    HostedZoneListResponse,
    HostedZoneResponse,
    HostedZoneUpdate,
    MessageResponse,
)

router = APIRouter()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_zone_or_404(zone_id: str, db: Session) -> HostedZone:
    """Fetch a HostedZone by its AWS-style zone_id string, or raise 404."""
    zone = db.query(HostedZone).filter(HostedZone.zone_id == zone_id).first()
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone '{zone_id}' not found.",
        )
    return zone


# ---------------------------------------------------------------------------
# GET /  — List + search + paginate
# ---------------------------------------------------------------------------
@router.get(
    "/",
    response_model=HostedZoneListResponse,
    summary="List Hosted Zones",
    description="Returns a paginated list of hosted zones. Optionally filter by name.",
    status_code=status.HTTP_200_OK,
)
def list_hosted_zones(
    search: str = Query(default="", description="Filter zones whose name contains this string"),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Results per page"),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(HostedZone)

    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(HostedZone.name).like(pattern),
                func.lower(HostedZone.zone_id).like(pattern),
            )
        )

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size

    zones = (
        query.order_by(HostedZone.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return HostedZoneListResponse(
        items=zones,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ---------------------------------------------------------------------------
# POST /  — Create
# ---------------------------------------------------------------------------
@router.post(
    "/",
    response_model=HostedZoneResponse,
    summary="Create Hosted Zone",
    description="Creates a new hosted zone with an auto-generated AWS-style zone ID.",
    status_code=status.HTTP_201_CREATED,
)
def create_hosted_zone(
    payload: HostedZoneCreate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Prevent duplicate names
    existing = db.query(HostedZone).filter(HostedZone.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A hosted zone with name '{payload.name}' already exists (ID: {existing.zone_id}).",
        )

    zone = HostedZone(
        name=payload.name,
        type=payload.type,
        comment=payload.comment,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


# ---------------------------------------------------------------------------
# GET /{zone_id}  — Get single zone
# ---------------------------------------------------------------------------
@router.get(
    "/{zone_id}",
    response_model=HostedZoneResponse,
    summary="Get Hosted Zone",
    description="Retrieve a single hosted zone by its AWS-style zone ID.",
    status_code=status.HTTP_200_OK,
)
def get_hosted_zone(
    zone_id: str,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_zone_or_404(zone_id, db)


# ---------------------------------------------------------------------------
# PUT /{zone_id}  — Update (comment only — name/type are immutable post-create)
# ---------------------------------------------------------------------------
@router.put(
    "/{zone_id}",
    response_model=HostedZoneResponse,
    summary="Update Hosted Zone",
    description=(
        "Update the comment of an existing hosted zone. "
        "Name and type are immutable after creation (mirrors AWS behaviour)."
    ),
    status_code=status.HTTP_200_OK,
)
def update_hosted_zone(
    zone_id: str,
    payload: HostedZoneUpdate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = _get_zone_or_404(zone_id, db)

    if payload.comment is not None:
        zone.comment = payload.comment

    db.commit()
    db.refresh(zone)
    return zone


# ---------------------------------------------------------------------------
# DELETE /{zone_id}  — Delete (cascades to all DNS records)
# ---------------------------------------------------------------------------
@router.delete(
    "/{zone_id}",
    response_model=MessageResponse,
    summary="Delete Hosted Zone",
    description="Delete a hosted zone and all of its DNS records (cascade).",
    status_code=status.HTTP_200_OK,
)
def delete_hosted_zone(
    zone_id: str,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = _get_zone_or_404(zone_id, db)
    name = zone.name
    db.delete(zone)
    db.commit()
    return MessageResponse(message=f"Hosted zone '{name}' ({zone_id}) deleted successfully.")
