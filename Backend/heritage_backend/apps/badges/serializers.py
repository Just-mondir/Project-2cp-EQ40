"""Serializers for badge requests."""

from __future__ import annotations

from rest_framework import serializers


class BadgeRequestSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    user_id = serializers.CharField()
    document_path = serializers.CharField()
    document_name = serializers.CharField()
    message = serializers.CharField(allow_blank=True)
    status = serializers.CharField()
    moderator_note = serializers.CharField(allow_blank=True)
    reviewed_by_id = serializers.CharField(allow_blank=True)
    created_at = serializers.DateTimeField()
    reviewed_at = serializers.DateTimeField(allow_null=True)

    def get_id(self, obj) -> str:
        return str(obj.id)


class BadgeRequestReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("approved", "rejected"))
    moderator_note = serializers.CharField(required=False, allow_blank=True, default="")
