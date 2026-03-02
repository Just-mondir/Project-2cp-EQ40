"""Custom exception handler to enforce standardized API responses."""

from __future__ import annotations

import logging
import traceback
from typing import Any, Dict, Optional

from django.conf import settings
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc: Exception, context: Dict[str, Any]) -> Optional[Response]:
    """Return a standardized error response for all exceptions."""
    response = drf_exception_handler(exc, context)

    if response is not None:
        message = "An error occurred."
        if isinstance(exc, exceptions.AuthenticationFailed):
            message = "Authentication failed."
        elif isinstance(exc, exceptions.NotAuthenticated):
            message = "Authentication credentials were not provided or invalid."
        elif isinstance(exc, exceptions.PermissionDenied):
            message = "You do not have permission to perform this action."
        elif isinstance(exc, exceptions.ValidationError):
            message = "Validation error."
        elif isinstance(exc, Http404):
            message = "Resource not found."

        return Response(
            {
                "success": False,
                "message": message,
                "errors": response.data,
            },
            status=response.status_code,
        )

    # Unhandled exception (500): log it and optionally expose in DEBUG
    logger.exception("Unhandled exception: %s", exc)
    tb = traceback.format_exc()

    payload = {
        "success": False,
        "message": "Internal server error.",
        "errors": None,
    }
    if getattr(settings, "DEBUG", False):
        payload["errors"] = {
            "detail": str(exc),
            "traceback": tb.split("\n"),
        }

    return Response(
        payload,
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )

