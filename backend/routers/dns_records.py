"""
routers/dns_records.py
----------------------
DNS Record CRUD endpoints nested under a Hosted Zone (all require auth):

  GET    /api/hosted-zones/{zone_id}/records                       — list + search + paginate
  POST   /api/hosted-zones/{zone_id}/records                       — create
  GET    /api/hosted-zones/{zone_id}/records/{record_id}           — get single record
  PUT    /api/hosted-zones/{zone_id}/records/{record_id}           — update
  DELETE /api/hosted-zones/{zone_id}/records/{record_id}           — delete one record
  DELETE /api/hosted-zones/{zone_id}/records                       — bulk delete (body: ids[])
"""

import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import DnsRecord, HostedZone, User, refresh_record_count
from schemas import (
    BulkDeleteRequest,
    DnsRecordCreate,
    DnsRecordListResponse,
    DnsRecordResponse,
    DnsRecordUpdate,
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


def _get_record_or_404(record_id: int, zone_pk: int, db: Session) -> DnsRecord:
    """Fetch a DnsRecord by its integer PK, scoped to the given zone PK."""
    record = (
        db.query(DnsRecord)
        .filter(DnsRecord.id == record_id, DnsRecord.zone_id == zone_pk)
        .first()
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DNS record {record_id} not found in this hosted zone.",
        )
    return record


# ---------------------------------------------------------------------------
# GET /  — List + search + paginate
# ---------------------------------------------------------------------------
@router.get(
    "/",
    response_model=DnsRecordListResponse,
    summary="List DNS Records",
    description="Returns a paginated list of DNS records for the given hosted zone.",
    status_code=status.HTTP_200_OK,
)
def list_dns_records(
    zone_id: str,
    search: str = Query(default="", description="Filter records by name or value"),
    record_type: str = Query(default="", description="Filter by record type (e.g. A, CNAME)"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = _get_zone_or_404(zone_id, db)
    query = db.query(DnsRecord).filter(DnsRecord.zone_id == zone.id)

    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(DnsRecord.name).like(pattern),
                func.lower(DnsRecord.value).like(pattern),
            )
        )

    if record_type:
        query = query.filter(DnsRecord.type == record_type.upper())

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size

    records = (
        query.order_by(DnsRecord.name.asc(), DnsRecord.type.asc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return DnsRecordListResponse(
        items=records,
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
    response_model=DnsRecordResponse,
    summary="Create DNS Record",
    description="Create a new DNS record inside the specified hosted zone.",
    status_code=status.HTTP_201_CREATED,
)
def create_dns_record(
    zone_id: str,
    payload: DnsRecordCreate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = _get_zone_or_404(zone_id, db)

    record = DnsRecord(
        zone_id=zone.id,
        name=payload.name,
        type=payload.type,
        ttl=payload.ttl,
        value=payload.value,
        routing_policy=payload.routing_policy,
        comment=payload.comment,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    refresh_record_count(zone.id, db)
    return record


# ---------------------------------------------------------------------------
# GET /{record_id}  — Get single record
# ---------------------------------------------------------------------------
@router.get(
    "/{record_id}",
    response_model=DnsRecordResponse,
    summary="Get DNS Record",
    description="Retrieve a single DNS record by its ID.",
    status_code=status.HTTP_200_OK,
)
def get_dns_record(
    zone_id: str,
    record_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = _get_zone_or_404(zone_id, db)
    return _get_record_or_404(record_id, zone.id, db)


# ---------------------------------------------------------------------------
# PUT /{record_id}  — Update
# ---------------------------------------------------------------------------
@router.put(
    "/{record_id}",
    response_model=DnsRecordResponse,
    summary="Update DNS Record",
    description=(
        "Update TTL, value, routing policy, or comment of a DNS record. "
        "Name and type are immutable; delete and re-create to change them."
    ),
    status_code=status.HTTP_200_OK,
)
def update_dns_record(
    zone_id: str,
    record_id: int,
    payload: DnsRecordUpdate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = _get_zone_or_404(zone_id, db)
    record = _get_record_or_404(record_id, zone.id, db)

    if payload.ttl is not None:
        record.ttl = payload.ttl
    if payload.value is not None:
        record.value = payload.value
    if payload.routing_policy is not None:
        record.routing_policy = payload.routing_policy
    if payload.comment is not None:
        record.comment = payload.comment

    db.commit()
    db.refresh(record)
    return record


# ---------------------------------------------------------------------------
# DELETE /{record_id}  — Delete single record
# ---------------------------------------------------------------------------
@router.delete(
    "/{record_id}",
    response_model=MessageResponse,
    summary="Delete DNS Record",
    description="Delete a single DNS record.",
    status_code=status.HTTP_200_OK,
)
def delete_dns_record(
    zone_id: str,
    record_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = _get_zone_or_404(zone_id, db)
    record = _get_record_or_404(record_id, zone.id, db)
    name, rtype = record.name, record.type
    db.delete(record)
    db.commit()
    refresh_record_count(zone.id, db)
    return MessageResponse(message=f"DNS record '{name}' ({rtype}) deleted successfully.")


# ---------------------------------------------------------------------------
# DELETE /  (body: ids[])  — Bulk delete
# ---------------------------------------------------------------------------
@router.delete(
    "/",
    response_model=MessageResponse,
    summary="Bulk Delete DNS Records",
    description="Delete multiple DNS records by their IDs in a single request.",
    status_code=status.HTTP_200_OK,
)
def bulk_delete_dns_records(
    zone_id: str,
    payload: BulkDeleteRequest,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = _get_zone_or_404(zone_id, db)

    records = (
        db.query(DnsRecord)
        .filter(DnsRecord.zone_id == zone.id, DnsRecord.id.in_(payload.ids))
        .all()
    )

    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="None of the specified record IDs were found in this zone.",
        )

    found_ids = {r.id for r in records}
    missing_ids = set(payload.ids) - found_ids

    for record in records:
        db.delete(record)
    db.commit()
    refresh_record_count(zone.id, db)

    msg = f"Deleted {len(records)} record(s)."
    if missing_ids:
        msg += f" IDs not found (skipped): {sorted(missing_ids)}."

    return MessageResponse(message=msg)
