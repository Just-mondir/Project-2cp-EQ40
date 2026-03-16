"""Serializers for the reports app."""

from __future__ import annotations

import logging

from rest_framework import serializers

from apps.posts.models import Comment, Post
from apps.users.models import User

from .models import Report

logger = logging.getLogger(__name__)

ALLOWED_TARGET_TYPES = {"post", "comment", "user", "event"}


# ---------------------------------------------------------------------------
# Read serializer (output)
# ---------------------------------------------------------------------------


class ReportSerializer(serializers.Serializer):
    """Read-only representation of a Report document."""

    id = serializers.SerializerMethodField()
    reporter_id = serializers.CharField()
    target_type = serializers.CharField()
    target_id = serializers.CharField()
    reason = serializers.CharField()
    status = serializers.CharField()
    moderator_note = serializers.CharField()
    resolved_by = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()
    resolved_at = serializers.DateTimeField(allow_null=True)

    def get_id(self, obj) -> str:
        return str(obj.id)


# ---------------------------------------------------------------------------
# Create serializer (input + validation)
# ---------------------------------------------------------------------------


class ReportCreateSerializer(serializers.Serializer):
    """Validate and create a new Report."""

    target_type = serializers.CharField()
    target_id = serializers.CharField()
    reason = serializers.CharField()

    def validate(self, attrs):
        target_type = attrs.get("target_type", "").strip()
        target_id = attrs.get("target_id", "").strip()
        reason = attrs.get("reason", "")
        reporter_id = self.context["reporter_id"]

        # 1. target_type check
        if target_type not in ALLOWED_TARGET_TYPES:
            raise serializers.ValidationError(
                {"target_type": "target_type must be one of: post, comment, user, event."}
            )

        # 2. reason length
        if len(reason) < 10:
            raise serializers.ValidationError(
                {"reason": "Reason must be at least 10 characters."}
            )

        # 3. target_id non-empty
        if not target_id:
            raise serializers.ValidationError(
                {"target_id": "target_id is required."}
            )

        # 4. user target
        if target_type == "user":
            if target_id == reporter_id:
                raise serializers.ValidationError(
                    {"target_id": "You cannot report yourself."}
                )
            try:
                User.objects.get(id=target_id)
            except (User.DoesNotExist, Exception):
                raise serializers.ValidationError(
                    {"target_id": "User not found."}
                )

        # 5. post target
        elif target_type == "post":
            try:
                post_pk = int(target_id)
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    {"target_id": "target_id must be a valid integer for post targets."}
                )
            if not Post.objects.filter(id=post_pk, is_deleted=False).exists():
                raise serializers.ValidationError(
                    {"target_id": "Post not found."}
                )

        # 6. comment target
        elif target_type == "comment":
            try:
                comment_pk = int(target_id)
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    {"target_id": "target_id must be a valid integer for comment targets."}
                )
            if not Comment.objects.filter(id=comment_pk).exists():
                raise serializers.ValidationError(
                    {"target_id": "Comment not found."}
                )

        # 7. event target — skip existence check
        elif target_type == "event":
            logger.info("Event existence check skipped (events app not built yet).")

        # 8. duplicate-pending check
        if Report.objects(
            reporter_id=reporter_id,
            target_type=target_type,
            target_id=target_id,
            status="pending",
        ).count() > 0:
            raise serializers.ValidationError(
                {"non_field_errors": "You already have a pending report for this target."}
            )

        attrs["target_type"] = target_type
        attrs["target_id"] = target_id
        return attrs

    def create(self, validated_data):
        reporter_id = self.context["reporter_id"]
        report = Report(
            reporter_id=reporter_id,
            target_type=validated_data["target_type"],
            target_id=validated_data["target_id"],
            reason=validated_data["reason"],
        )
        report.save()
        return report


# ---------------------------------------------------------------------------
# Resolve serializer (moderator action)
# ---------------------------------------------------------------------------


class ReportResolveSerializer(serializers.Serializer):
    """Validate and apply resolution to a Report."""

    status = serializers.CharField()
    moderator_note = serializers.CharField(required=False, default="", allow_blank=True)

    def validate(self, attrs):
        new_status = attrs.get("status", "").strip()
        report = self.context["report"]

        # 1. status in {reviewed, rejected}
        if new_status not in ("reviewed", "rejected"):
            raise serializers.ValidationError(
                {"status": "status must be 'reviewed' or 'rejected'."}
            )

        # 2. report must still be pending
        if report.status != "pending":
            raise serializers.ValidationError(
                {"status": "This report has already been resolved."}
            )

        attrs["status"] = new_status
        return attrs
