"""Custom permission classes for the reports app."""

from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsModeratorOrAdmin(BasePermission):
    """Allow access only to moderators and admins."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return (
            getattr(user, "role", None) in ("moderator", "admin")
            or getattr(user, "is_staff", False)
        )
