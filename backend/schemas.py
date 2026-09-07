"""
schemas.py
----------
Pydantic v2 request / response schemas for:
  - Auth
  - HostedZone
  - DnsRecord

All response schemas inherit from a common base that sets
`from_attributes = True` (replaces orm_mode in Pydantic v2).
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from models import SUPPORTED_RECORD_TYPES

# ===========================================================================
# Shared config
# ===========================================================================

class _OrmBase(BaseModel):
    """Base class for all response schemas — enables ORM attribute reading."""
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Auth
# ===========================================================================

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(_OrmBase):
    id: int
    username: str
    created_at: datetime


# ===========================================================================
# HostedZone
# ===========================================================================

class HostedZoneCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Domain name, e.g. 'example.com'. Trailing dot will be added automatically.",
    )
    type: str = Field(default="Public", pattern="^(Public|Private)$")
    comment: Optional[str] = Field(default=None, max_length=256)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        """Ensure the domain name always ends with a trailing dot."""
        v = v.strip().lower()
        if not v.endswith("."):
            v += "."
        return v


class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = Field(default=None, max_length=256)
    # Name and type are immutable after creation (mirrors AWS behaviour)


class HostedZoneResponse(_OrmBase):
    id: int
    zone_id: str
    name: str
    type: str
    comment: Optional[str]
    record_count: int
    created_at: datetime
    updated_at: datetime


class HostedZoneListResponse(BaseModel):
    items: List[HostedZoneResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ===========================================================================
# DnsRecord
# ===========================================================================

class DnsRecordCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Record name, e.g. 'www.example.com.' or '@' for apex.",
    )
    type: str = Field(
        ...,
        description=f"Record type. Must be one of: {', '.join(sorted(SUPPORTED_RECORD_TYPES))}",
    )
    ttl: int = Field(default=300, ge=0, le=2147483647, description="TTL in seconds")
    value: str = Field(
        ...,
        min_length=1,
        description=(
            "Record value. For multi-value records supply a JSON array string. "
            "For MX: '[{\"priority\": 10, \"value\": \"mail.example.com.\"}]'"
        ),
    )
    routing_policy: str = Field(default="Simple", max_length=32)
    comment: Optional[str] = Field(default=None, max_length=256)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.upper()
        if v not in SUPPORTED_RECORD_TYPES:
            raise ValueError(
                f"Unsupported record type '{v}'. "
                f"Must be one of: {', '.join(sorted(SUPPORTED_RECORD_TYPES))}"
            )
        return v

    @field_validator("name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        v = v.strip()
        # Keep '@' as-is (apex record)
        if v != "@" and not v.endswith("."):
            v += "."
        return v


class DnsRecordUpdate(BaseModel):
    ttl: Optional[int] = Field(default=None, ge=0, le=2147483647)
    value: Optional[str] = Field(default=None, min_length=1)
    routing_policy: Optional[str] = Field(default=None, max_length=32)
    comment: Optional[str] = Field(default=None, max_length=256)
    # name and type are immutable (mirrors AWS "Change record" flow where you
    # delete + re-create to change name/type)


class DnsRecordResponse(_OrmBase):
    id: int
    zone_id: int
    name: str
    type: str
    ttl: int
    value: str
    routing_policy: str
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime


class DnsRecordListResponse(BaseModel):
    items: List[DnsRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ===========================================================================
# Bulk operations
# ===========================================================================

class BulkDeleteRequest(BaseModel):
    ids: List[int] = Field(..., min_length=1, description="List of record IDs to delete")


# ===========================================================================
# Import / Export
# ===========================================================================

class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]


# ===========================================================================
# Generic responses
# ===========================================================================

class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
