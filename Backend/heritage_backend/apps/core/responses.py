"""Standardized API response helpers."""

from __future__ import annotations

from typing import Any, Dict, Optional

from rest_framework.response import Response

RESPONSE_SUCCESS_MESSAGE = {
    "profile_retrieved": "Profile retrieved successfully.",
    "profile_updated": "Profile updated successfully.",
}

RESPONSE_CONFLICT_MESSAGE = {
    "email_exists": "A user with this email already exists.",
    "username_exists": "A user with this username already exists.",
}


def api_success(
    message: str,
    data: Optional[Dict[str, Any]] = None,
    status_code: int = 200,
) -> Response:
    """Return a standardized success response."""
    return Response(
        {"success": True, "message": message, "data": data},
        status=status_code,
    )


def api_error(
    message: str,
    errors: Optional[Dict[str, Any]] = None,
    status_code: int = 400,
) -> Response:
    """Return a standardized error response."""
    return Response(
        {"success": False, "message": message, "errors": errors},
        status=status_code,
    )

