"""
auth.py
-------
Mocked authentication helpers:
  - Password hashing / verification  (bcrypt via passlib)
  - JWT creation / decoding          (python-jose HS256)
  - Seed user creation               (Krish / Krish@123)
  - FastAPI dependency               (get_current_user)
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models import User

# ---------------------------------------------------------------------------
# Configuration  (override via environment variables in production)
# ---------------------------------------------------------------------------
SECRET_KEY: str = os.getenv("SECRET_KEY", "route53-clone-super-secret-key-change-me")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 h

# Seed credentials (mock — not for production)
SEED_USERNAME: str = os.getenv("SEED_USERNAME", "user")
SEED_PASSWORD: str = os.getenv("SEED_PASSWORD", "user@123")

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Return a signed JWT with an expiry claim."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT.
    Raises HTTPException(401) on any failure.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# ---------------------------------------------------------------------------
# OAuth2 scheme — reads Bearer token from Authorization header
# ---------------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------------------------------------------------------------------------
# FastAPI dependency — resolves the current authenticated user
# ---------------------------------------------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to inject into any protected route.
    Returns the User ORM object or raises HTTP 401.
    """
    payload = decode_access_token(token)
    username: str = payload.get("sub")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# ---------------------------------------------------------------------------
# Seed user — called once at startup
# ---------------------------------------------------------------------------
def seed_admin_user(db: Session) -> None:
    """
    Create the default admin user if no users exist in the database.
    Safe to call multiple times (idempotent).
    """
    existing = db.query(User).filter(User.username == SEED_USERNAME).first()
    if existing is None:
        admin = User(
            username=SEED_USERNAME,
            password_hash=hash_password(SEED_PASSWORD),
        )
        db.add(admin)
        db.commit()
        print(f"[auth] Seed user created: username='{SEED_USERNAME}' password='{SEED_PASSWORD}'")
    else:
        print(f"[auth] Seed user already exists: username='{SEED_USERNAME}'")