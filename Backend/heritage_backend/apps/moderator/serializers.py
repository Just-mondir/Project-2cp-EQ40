from __future__ import annotations

from rest_framework import serializers

from apps.users.models import MODERATION_STATUS_CHOICES, ROLE_CHOICES


class ModeratorUserSerializer(serializers.Serializer):
    id = serializers.CharField()
    display_name = serializers.CharField()
    username = serializers.CharField(allow_null=True)
    expertise = serializers.CharField()
    profile_picture = serializers.CharField()
    role = serializers.CharField()
    moderation_status = serializers.CharField()
    moderation_reason = serializers.CharField()
    suspended_until = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
    post_count = serializers.IntegerField()


class AnalyticsSnapshotSerializer(serializers.Serializer):
    date = serializers.DateTimeField()
    members = serializers.IntegerField()
    groups = serializers.IntegerField()
    visitors = serializers.IntegerField()
    posts = serializers.IntegerField()


class ModeratorRoleUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=[choice[0] for choice in ROLE_CHOICES])


class ModeratorActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=("ban", "suspend", "unsuspend", "unban", "reactivate"))
    reason = serializers.CharField(required=False, allow_blank=True, default="")
    suspended_until = serializers.DateTimeField(required=False, allow_null=True)

    def validate(self, attrs):
        action = attrs.get("action")
        if action == "suspend" and not attrs.get("suspended_until"):
            raise serializers.ValidationError({"suspended_until": "suspended_until is required when suspending a user."})
        return attrs
