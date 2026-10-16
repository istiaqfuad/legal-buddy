"""
JWT authentication middleware for FastAPI.

Validates Neon Auth JWTs using JWKS. Auth is optional for the MVP —
requests without a valid token still pass through (the Next.js layer
enforces access control and rate limiting). This middleware enriches
requests with user context when a valid token is present.
"""

import logging
import os
from functools import lru_cache
from typing import Optional

import httpx
from fastapi import Request
from jose import JWTError, jwt
from jose.backends import RSAKey
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

JWKS_URL = os.getenv(
    "JWKS_URL",
    "https://ep-flat-brook-b3wu7lak.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json",
)


@lru_cache(maxsize=1)
def _fetch_jwks() -> dict:
    """Fetch JWKS from Neon Auth (cached in-process)."""
    try:
        resp = httpx.get(JWKS_URL, timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        logger.warning("Failed to fetch JWKS: %s", exc)
        return {"keys": []}


def _verify_jwt(token: str) -> Optional[dict]:
    """Verify a JWT against Neon Auth JWKS. Returns claims dict or None."""
    try:
        jwks = _fetch_jwks()
        # Decode without verification first to get the kid header
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        # Find matching key
        matching_key = None
        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                matching_key = key_data
                break

        if not matching_key:
            logger.debug("No matching JWKS key found for kid=%s", kid)
            return None

        claims = jwt.decode(
            token,
            matching_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return claims
    except JWTError as exc:
        logger.debug("JWT verification failed: %s", exc)
        return None
    except Exception as exc:
        logger.warning("Unexpected JWT error: %s", exc)
        return None


class NeonAuthMiddleware(BaseHTTPMiddleware):
    """
    Optional JWT auth middleware.

    If an Authorization: Bearer <token> header is present and the token
    is valid, enriches the request state with:
      - request.state.user_id: str
      - request.state.user_email: str | None
      - request.state.user_role: str (default "user")
      - request.state.authenticated: True

    Unauthenticated requests are still allowed through — access control
    is enforced by the Next.js API layer.
    """

    async def dispatch(self, request: Request, call_next):
        request.state.authenticated = False
        request.state.user_id = None
        request.state.user_email = None
        request.state.user_role = "user"

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            claims = _verify_jwt(token)
            if claims:
                request.state.authenticated = True
                request.state.user_id = claims.get("sub")
                request.state.user_email = claims.get("email")
                request.state.user_role = claims.get("role", "user")

        return await call_next(request)
