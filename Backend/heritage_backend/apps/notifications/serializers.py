"""Serializers for the notifications app."""

from __future__ import annotations
from rest_framework import serializers

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

    def get_id(self, obj) -> str:
        return str(obj.id)
