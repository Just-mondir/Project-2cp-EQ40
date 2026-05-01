"""Serializers for the notifications app."""

from __future__ import annotations

from rest_framework import serializers

from apps.users.models import User


def _get_user(user_id: str):
    try:
        return User.objects.get(id=user_id)
    except Exception:
        return None

class NotificationSerializer(serializers.Serializer):
    """Read-only representation of a Notification document."""

    id = serializers.SerializerMethodField()
    recipient_id = serializers.CharField()
    actor_id = serializers.CharField()
    event_type = serializers.CharField()
    target_type = serializers.CharField()
    target_id = serializers.CharField()
    message = serializers.CharField()
    is_read = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    actor_display_name = serializers.SerializerMethodField()
    actor_username = serializers.SerializerMethodField()
    actor_profile_picture = serializers.SerializerMethodField()
    event_label = serializers.SerializerMethodField()
    extra = serializers.DictField(default=dict)

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_actor_display_name(self, obj) -> str:
        user = _get_user(obj.actor_id)
        if not user:
            return "Someone"
        return user.display_name or user.username or user.email

    def get_actor_username(self, obj) -> str:
        user = _get_user(obj.actor_id)
        return user.username if user else ""

    def get_actor_profile_picture(self, obj) -> str:
        user = _get_user(obj.actor_id)
        return user.profile_picture if user else ""

    def get_event_label(self, obj) -> str:
        labels = {
            "gem_on_post": "liked your post",
            "repost_on_post": "reposted your post",
            "comment_on_post": "commented on your post",
            "reply_to_comment": "replied to your comment",
            "gem_on_comment": "liked your comment",
            "group_invite_received": "invited you to a group",
            "group_join_request_approved": "approved your group request",
            "group_join_request_rejected": "rejected your group request",
            "group_join_request": "wants to join your group",  # ← ADD HERE
            "group_chat_message": "sent a message in a group",
            "group_chat_message_reported": "reported a message in your group",
            "badge_request_reviewed": "reviewed your badge request",
            "user_banned": "banned your account",
            "user_suspended": "suspended your account",
        }
        return labels.get(getattr(obj, "event_type", ""), getattr(obj, "message", ""))
