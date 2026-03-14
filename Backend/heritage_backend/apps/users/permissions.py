"""Custom permission classes for the users app."""

from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsSelf(BasePermission):
    """Allow access only to the authenticated user's own resource."""

    def has_object_permission(self, request, view, obj) -> bool:
        """Return True if the object belongs to the requesting user."""
        return getattr(obj, "id", None) == getattr(request.user, "id", None)

