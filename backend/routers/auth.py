"""
routers/auth.py
---------------
Authentication endpoints:
  POST /api/auth/login   — returns JWT
  POST /api/auth/logout  — client-side only (instructs frontend to clear token)
  GET  /api/auth/me      — returns current user info
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    get_current_user,
    verify_password,
)
from database import get_db
from models import User
from schemas import LoginRequest, MessageResponse, TokenResponse, UserResponse

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /login
# ---------------------------------------------------------------------------
@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
    description="Authenticate with username and password. Returns a JWT bearer token.",
    status_code=status.HTTP_200_OK,
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user: User | None = db.query(User).filter(User.username == payload.username).first()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user.username})
    return TokenResponse(access_token=token, token_type="bearer")


# ---------------------------------------------------------------------------
# POST /logout
# ---------------------------------------------------------------------------
@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout",
    description=(
        "Signals logout intent. Token invalidation is handled client-side "
        "(the frontend should delete the stored JWT)."
    ),
    status_code=status.HTTP_200_OK,
)
def logout(current_user: User = Depends(get_current_user)):
    # For a mock auth system, logout is stateless — the client drops the token.
    # A production system would add the token to a denylist here.
    return MessageResponse(message=f"User '{current_user.username}' logged out successfully.")


# ---------------------------------------------------------------------------
# GET /me
# ---------------------------------------------------------------------------
@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Returns profile information for the currently authenticated user.",
    status_code=status.HTTP_200_OK,
)
def me(current_user: User = Depends(get_current_user)):
    return current_user
