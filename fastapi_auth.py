# Kisan-Credit FastAPI Auth Dependency & JWT Verification Middleware
# Features:
# - Decodes & verifies Supabase JWT using PyJWT (matching Supabase secret)
# - Extracts user ID and Role (LENDER_OFFICER, ADMIN)
# - Server-side Rate Limiting / Failed Login Attempts Enforcement (3 limit per rolling 24-hours)

import os
import time
from datetime import datetime, timedelta
from typing import List, Optional
import jwt
from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# Secret configuration (Supabase JWT Secret from env)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "your-fallback-supabase-jwt-secret-key-change-in-prod")
SUPABASE_JWT_ALGORITHM = "HS256"

# In-Memory Simulation for Demo/Rate Limiter fallback (if DB is disconnected)
# In production, these should query public.login_attempts table in PostgreSQL via Tortoise ORM
LOGIN_ATTEMPTS_STORE = {} # Format: { email: [timestamp1, timestamp2, ...] }
MAX_FAILED_ATTEMPTS = 3
ROLLING_WINDOW_HOURS = 24

class UserProfile(BaseModel):
    id: str
    email: str
    role: str

security_bearer = HTTPBearer()

# FastAPI dependency to extract, decode and verify the JWT
async def verify_supabase_jwt(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)) -> UserProfile:
    token = credentials.credentials
    try:
        # Decode JWT signature against Supabase Secret Key
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=[SUPABASE_JWT_ALGORITHM], 
            audience="authenticated"
        )
        
        # Extract metadata and custom profile claim
        user_id = payload.get("sub")
        email = payload.get("email")
        
        # Roles stored in app_metadata or user_metadata fallback
        # In Supabase RLS, roles can be checked using direct DB query or custom claims
        app_metadata = payload.get("app_metadata", {})
        user_metadata = payload.get("user_metadata", {})
        role = app_metadata.get("role") or user_metadata.get("role") or "LENDER_OFFICER"
        
        if not user_id or not email:
            raise HTTPException(status_code=401, detail="Invalid token claims. Missing sub or email.")
            
        return UserProfile(id=user_id, email=email, role=role)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authorization signature or expired token.")


# Role-based Authorization Dependency
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UserProfile = Depends(verify_supabase_jwt)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Access Denied. Role '{user.role}' does not have permission. Required: {self.allowed_roles}"
            )
        return user


# Login Rate-limiting & Failed attempt manager (FastAPI Middleware or Route Hook)
def check_login_rate_limit(email: str):
    """
    Checks if the email has reached the limit of 3 failed attempts in the rolling 24-hour window.
    Returns remaining cooldown time if locked, otherwise returns None.
    """
    now = time.time()
    cutoff = now - (ROLLING_WINDOW_HOURS * 3600)
    
    # Filter attempts inside the rolling 24 hour window
    attempts = LOGIN_ATTEMPTS_STORE.get(email, [])
    active_attempts = [t for t in attempts if t > cutoff]
    LOGIN_ATTEMPTS_STORE[email] = active_attempts
    
    if len(active_attempts) >= MAX_FAILED_ATTEMPTS:
        # Calculate oldest active attempt time to find exact cooldown end
        oldest_attempt = active_attempts[0]
        cooldown_end = oldest_attempt + (ROLLING_WINDOW_HOURS * 3600)
        remaining_seconds = max(0, int(cooldown_end - now))
        
        # Render human readable time
        hours = remaining_seconds // 3600
        minutes = (remaining_seconds % 3600) // 60
        seconds = remaining_seconds % 60
        
        time_str = f"{hours}h {minutes}m {seconds}s" if hours > 0 else f"{minutes}m {seconds}s"
        return time_str
        
    return None

def record_failed_login_attempt(email: str):
    """
    Log a failed attempt for the specified email to enforce rolling window rate-limits.
    """
    now = time.time()
    if email not in LOGIN_ATTEMPTS_STORE:
        LOGIN_ATTEMPTS_STORE[email] = []
    LOGIN_ATTEMPTS_STORE[email].append(now)


# Example usage in FastAPI Router:
#
# @router.get("/api/applicants", response_model=List[ApplicantSchema])
# def get_applicants(user: UserProfile = Depends(RoleChecker(["LENDER_OFFICER", "ADMIN"]))):
#     return db.get_all_applicants()
#
# @router.patch("/api/applicants/{id}/trust-score")
# def update_trust_score(id: str, user: UserProfile = Depends(RoleChecker(["ADMIN"]))):
#     # Only admins can update trust score
#     return db.update_trust_score(id)
