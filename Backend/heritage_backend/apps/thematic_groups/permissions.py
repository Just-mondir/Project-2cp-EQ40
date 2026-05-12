"""Permission helpers for thematic groups."""

from __future__ import annotations

from rest_framework.permissions import BasePermission, SAFE_METHODS

from .services import user_is_group_admin, user_is_group_member


class IsGroupAdmin(BasePermission):
    """Allow access only to the group admin."""

    def has_object_permission(self, request, view, obj) -> bool:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return user_is_group_admin(str(user.id), obj)


class IsGroupMemberOrReadOnly(BasePermission):
    """Allow read access to everyone and writes only to members."""

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user = getattr(request, "user", None)
        group = getattr(view, "group", None)
        if not user or not getattr(user, "is_authenticated", False) or not group:
            return False
        return user_is_group_member(str(user.id), group) or user_is_group_admin(str(user.id), group)
