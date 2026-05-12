"""Shared helpers for group access control and lookup."""

from __future__ import annotations

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.signing import TimestampSigner

from apps.users.models import User
from .models import GroupMembership, ThematicGroup


def get_group_by_id(group_id: str) -> ThematicGroup | None:
    try:
        return ThematicGroup.objects.get(id=group_id, is_deleted=False)
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
    return GroupMembership.objects(group=group_obj, user_id=str(user_id), is_deleted=False).count() > 0


def user_can_access_group(user_id: str, group: ThematicGroup | str) -> bool:
    return user_is_group_admin(user_id, group) or user_is_group_member(user_id, group)


def accessible_group_ids_for_user(user_id: str) -> set[str]:
    memberships = GroupMembership.objects(user_id=str(user_id), is_deleted=False)
    return {str(membership.group.id) for membership in memberships}


# ---------------------------------------------------------------------------
# Join-request email helpers (modeled on badges/services.py)
# ---------------------------------------------------------------------------

_JOIN_REVIEW_SIGNER = TimestampSigner(salt="group-join-request-review")


def build_join_review_token(request_id: str, action: str) -> str:
    return _JOIN_REVIEW_SIGNER.sign(f"{request_id}:{action}")


def decode_join_review_token(token: str, max_age_seconds: int = 60 * 60 * 24 * 7) -> tuple[str, str]:
    payload = _JOIN_REVIEW_SIGNER.unsign(token, max_age=max_age_seconds)
    request_id, action = payload.split(":", 1)
    return request_id, action


def build_join_review_url(group_id: str, request_id: str, action: str) -> str:
    token = build_join_review_token(request_id, action)
    return f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/api/groups/{group_id}/requests/email-review/{token}/"


def build_join_request_html(
    requester_name: str,
    group_name: str,
    approve_url: str,
    reject_url: str,
) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;background:#fff8e2;padding:24px;color:#432817;">
        <h2 style="margin:0 0 12px;">Join request for {group_name}</h2>
        <p style="margin:0 0 8px;"><strong>{requester_name}</strong> wants to join your group <strong>{group_name}</strong>.</p>
        <p style="margin:0 0 16px;">You can approve or reject this request using the buttons below:</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <a href="{approve_url}" style="background:#2e7d32;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Approve</a>
            <a href="{reject_url}" style="background:#c0392b;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Reject</a>
        </div>
    </div>
    """.strip()


def send_join_request_email(
    group: ThematicGroup,
    join_request_obj,
    requester_name: str,
) -> None:
    """Email disabled — join requests handled via in-app notifications only."""
    pass