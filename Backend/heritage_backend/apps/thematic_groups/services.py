"""Shared helpers for group access control and lookup."""

from __future__ import annotations

from .models import GroupMembership, ThematicGroup


def get_group_by_id(group_id: str) -> ThematicGroup | None:
    try:
        return ThematicGroup.objects.get(id=group_id)
    except (ThematicGroup.DoesNotExist, Exception):
        return None


def user_is_group_admin(user_id: str, group: ThematicGroup | str) -> bool:
    group_obj = group if isinstance(group, ThematicGroup) else get_group_by_id(str(group))
    if not group_obj:
        return False
    return str(group_obj.admin_id) == str(user_id)


def user_is_group_member(user_id: str, group: ThematicGroup | str) -> bool:
    group_obj = group if isinstance(group, ThematicGroup) else get_group_by_id(str(group))
    if not group_obj:
        return False
    return GroupMembership.objects(group=group_obj, user_id=str(user_id)).count() > 0


def user_can_access_group(user_id: str, group: ThematicGroup | str) -> bool:
    return user_is_group_admin(user_id, group) or user_is_group_member(user_id, group)


def accessible_group_ids_for_user(user_id: str) -> set[str]:
    memberships = GroupMembership.objects(user_id=str(user_id))
    return {str(membership.group.id) for membership in memberships}
