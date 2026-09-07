"""
models.py
---------
SQLAlchemy ORM models for:
  - User          : mocked auth user
  - HostedZone    : Route53 hosted zone container
  - DnsRecord     : individual DNS record within a zone

Relationships:
  HostedZone 1 ──── ∞ DnsRecord   (cascade delete-orphan)
"""

import random
import string
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    event,
)
from sqlalchemy.orm import relationship

from database import Base

# ---------------------------------------------------------------------------
# Helper: generate an AWS-style Hosted Zone ID  (e.g. "Z2FDTNDATAQYW2")
# ---------------------------------------------------------------------------
def _generate_zone_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(random.choices(chars, k=21))


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ===========================================================================
# User
# ===========================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    # Stored as bcrypt hash; plain text acceptable for mock purposes
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"


# ===========================================================================
# HostedZone
# ===========================================================================
class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # AWS-style zone identifier e.g. "Z2FDTNDATAQYW2"
    zone_id = Column(
        String(32),
        unique=True,
        nullable=False,
        index=True,
        default=_generate_zone_id,
    )

    # Domain name with trailing dot enforced at the schema layer
    name = Column(String(255), nullable=False, index=True)

    # "Public" | "Private"
    type = Column(String(16), nullable=False, default="Public")

    # Optional human-readable description
    comment = Column(Text, nullable=True)

    # Denormalised count — updated by SQLAlchemy event listeners below
    record_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    records = relationship(
        "DnsRecord",
        back_populates="zone",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<HostedZone id={self.id} zone_id={self.zone_id!r} name={self.name!r}>"


# ===========================================================================
# DnsRecord
# ===========================================================================

# Supported record types (mirrors the assignment's required list)
SUPPORTED_RECORD_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}


class DnsRecord(Base):
    __tablename__ = "dns_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # FK → hosted_zones.id  (ON DELETE CASCADE at DB level as well)
    zone_id = Column(
        Integer,
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Record name e.g. "www.example.com."
    name = Column(String(255), nullable=False)

    # One of SUPPORTED_RECORD_TYPES — validated at schema layer
    type = Column(String(16), nullable=False)

    # Time-to-live in seconds
    ttl = Column(Integer, nullable=False, default=300)

    # Record value(s).  Single value or JSON-serialised list for multi-value
    # e.g. MX: '[{"priority": 10, "value": "mail.example.com."}]'
    value = Column(Text, nullable=False)

    # Routing policy — "Simple" is the default; extensible for future work
    routing_policy = Column(String(32), nullable=False, default="Simple")

    # Optional comment / description
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    zone = relationship("HostedZone", back_populates="records")

    def __repr__(self) -> str:
        return (
            f"<DnsRecord id={self.id} name={self.name!r} "
            f"type={self.type!r} zone_id={self.zone_id}>"
        )


# ===========================================================================
# Helper — keep hosted_zones.record_count in sync
# Called explicitly by the dns_records router after insert / delete.
# ===========================================================================

def refresh_record_count(zone_pk: int, db) -> None:
    """
    Re-count DnsRecord rows for the given zone PK and update the cached
    record_count column on HostedZone.  Call this after any insert or delete
    on DnsRecord, then db.commit().
    """
    from sqlalchemy import func, select

    count = db.execute(
        select(func.count()).where(DnsRecord.zone_id == zone_pk)
    ).scalar_one()

    db.execute(
        HostedZone.__table__.update()
        .where(HostedZone.id == zone_pk)
        .values(record_count=count)
    )
    db.commit()
