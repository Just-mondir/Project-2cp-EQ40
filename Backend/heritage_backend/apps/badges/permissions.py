"""Permissions for badge requests."""

from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsModeratorOrAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return getattr(user, "role", None) in ("moderator", "admin") or getattr(user, "is_staff", False)
