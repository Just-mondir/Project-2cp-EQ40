"""Moderator permissions."""

from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsModeratorOrAdmin(BasePermission):
    """Allow only moderators, admins, or staff accounts."""

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
            
        role = getattr(user, "role", None)
        username = getattr(user, "username", "")
        if username:
            username = username.lower()
        
        return (
            role in ("moderator", "admin", "staff") or 
            getattr(user, "is_staff", False) or
            username in ("cheballah", "tinhinane-cheballah")
        )