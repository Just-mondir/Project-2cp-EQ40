"""Serializers for the reports app."""

from __future__ import annotations

import logging

from rest_framework import serializers

from apps.posts.models import Annotation, Comment, Post
from apps.thematic_groups.models import GroupChatMessage
from apps.users.models import User

from .models import MobilizationReport, Report

logger = logging.getLogger(__name__)

ALLOWED_TARGET_TYPES = {"post", "comment", "annotation", "user", "event", "group_chat_message"}


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


class ReportCreateSerializer(serializers.Serializer):
    """Validate and create a new Report."""

    target_type = serializers.CharField()
    target_id = serializers.CharField()
    reason = serializers.CharField()

    def validate(self, attrs):
        target_type = attrs.get("target_type", "").strip()
        target_id = attrs.get("target_id", "").strip()
        reason = attrs.get("reason", "").strip()
        reporter_id = self.context["reporter_id"]

        if target_type not in ALLOWED_TARGET_TYPES:
            raise serializers.ValidationError(
                {
                    "target_type": (
                        "target_type must be one of: "
                        "post, comment, annotation, user, event, group_chat_message."
                    )
                }
            )

        if len(reason) < 10:
            raise serializers.ValidationError(
                {"reason": "Reason must be at least 10 characters."}
            )

        if not target_id:
            raise serializers.ValidationError(
                {"target_id": "target_id is required."}
            )

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

        elif target_type == "annotation":
            try:
                Annotation.objects.get(id=target_id)
            except Annotation.DoesNotExist:
                raise serializers.ValidationError(
                    {"target_id": "Annotation not found."}
                )
            except Exception:
                raise serializers.ValidationError(
                    {"target_id": "Invalid annotation id."}
                )

        elif target_type == "event":
            logger.info("Event existence check skipped (events app not built yet).")

        elif target_type == "group_chat_message":
            try:
                GroupChatMessage.objects.get(id=target_id, is_deleted=False)
            except Exception:
                raise serializers.ValidationError(
                    {"target_id": "Group chat message not found."}
                )

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
        attrs["reason"] = reason
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


class ReportResolveSerializer(serializers.Serializer):
    """Validate and apply resolution to a Report."""

    status = serializers.CharField()
    moderator_note = serializers.CharField(required=False, default="", allow_blank=True)

    def validate(self, attrs):
        new_status = attrs.get("status", "").strip()
        report = self.context["report"]

        if new_status not in ("reviewed", "rejected"):
            raise serializers.ValidationError(
                {"status": "status must be 'reviewed' or 'rejected'."}
            )

        if report.status != "pending":
            raise serializers.ValidationError(
                {"status": "This report has already been resolved."}
            )

        attrs["status"] = new_status
        return attrs
    
MOBILIZATION_STATUS_CHOICES = {
    "restored",
    "under_intervention",
    "destroyed",
    "alert",
}


class MobilizationReportSerializer(serializers.Serializer):
    """Read-only representation of a MobilizationReport document."""

    id = serializers.SerializerMethodField()
    post_id = serializers.SerializerMethodField()
    description = serializers.CharField()
    images = serializers.ListField(child=serializers.CharField(), required=False)
    previous_status = serializers.CharField()
    requested_status = serializers.CharField()
    created_by = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_post_id(self, obj) -> str:
        return str(obj.post.id)


class MobilizationReportCreateSerializer(serializers.Serializer):
    """Validate and create a new MobilizationReport."""

    post_id = serializers.CharField()
    description = serializers.CharField()
    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )
    previous_status = serializers.CharField()
    requested_status = serializers.CharField()

    def validate(self, attrs):
        post_id = attrs.get("post_id", "").strip()
        description = attrs.get("description", "").strip()
        images = attrs.get("images") or []
        previous_status = attrs.get("previous_status", "").strip()
        requested_status = attrs.get("requested_status", "").strip()

        if not post_id:
            raise serializers.ValidationError({"post_id": "post_id is required."})

        try:
            post = Post.objects.get(id=post_id, is_deleted=False)
        except Post.DoesNotExist:
            raise serializers.ValidationError({"post_id": "Post not found."})
        except Exception:
            raise serializers.ValidationError({"post_id": "Invalid post id."})

        if post.post_type != "alert":
            raise serializers.ValidationError(
                {"post_id": "Mobilization reports can only target alert posts."}
            )

        if not description:
            raise serializers.ValidationError(
                {"description": "description is required."}
            )

        if previous_status not in MOBILIZATION_STATUS_CHOICES:
            raise serializers.ValidationError(
                {
                    "previous_status": (
                        "previous_status must be one of: "
                        "restored, under_intervention, destroyed, alert."
                    )
                }
            )

        if requested_status not in MOBILIZATION_STATUS_CHOICES:
            raise serializers.ValidationError(
                {
                    "requested_status": (
                        "requested_status must be one of: "
                        "restored, under_intervention, destroyed, alert."
                    )
                }
            )

        if previous_status == requested_status:
            raise serializers.ValidationError(
                {
                    "requested_status": (
                        "requested_status must be different from previous_status."
                    )
                }
            )

        if len(images) > 4:
            raise serializers.ValidationError(
                {"images": "A mobilization report can have at most 4 images."}
            )

        attrs["post"] = post
        attrs["post_id"] = post_id
        attrs["description"] = description
        attrs["images"] = images
        attrs["previous_status"] = previous_status
        attrs["requested_status"] = requested_status
        return attrs

    def create(self, validated_data):
        created_by = self.context["created_by"]

        mobilization_report = MobilizationReport(
            post=validated_data["post"],
            description=validated_data["description"],
            images=validated_data.get("images", []),
            previous_status=validated_data["previous_status"],
            requested_status=validated_data["requested_status"],
            created_by=created_by,
        )
        mobilization_report.save()
        return mobilization_report


class MobilizationReportUpdateSerializer(serializers.Serializer):
    """Validate updates for an existing MobilizationReport."""

    description = serializers.CharField(required=False)
    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
    )
    previous_status = serializers.CharField(required=False)
    requested_status = serializers.CharField(required=False)

    def validate(self, attrs):
        report = self.context["report"]

        description = attrs.get("description", report.description)
        images = attrs.get("images", report.images or [])
        previous_status = attrs.get("previous_status", report.previous_status)
        requested_status = attrs.get("requested_status", report.requested_status)

        if isinstance(description, str):
            description = description.strip()

        if not description:
            raise serializers.ValidationError(
                {"description": "description cannot be empty."}
            )

        if previous_status not in MOBILIZATION_STATUS_CHOICES:
            raise serializers.ValidationError(
                {
                    "previous_status": (
                        "previous_status must be one of: "
                        "restored, under_intervention, destroyed, alert."
                    )
                }
            )

        if requested_status not in MOBILIZATION_STATUS_CHOICES:
            raise serializers.ValidationError(
                {
                    "requested_status": (
                        "requested_status must be one of: "
                        "restored, under_intervention, destroyed, alert."
                    )
                }
            )

        if previous_status == requested_status:
            raise serializers.ValidationError(
                {
                    "requested_status": (
                        "requested_status must be different from previous_status."
                    )
                }
            )

        if len(images) > 4:
            raise serializers.ValidationError(
                {"images": "A mobilization report can have at most 4 images."}
            )

        attrs["description"] = description
        attrs["images"] = images
        attrs["previous_status"] = previous_status
        attrs["requested_status"] = requested_status
        return attrs
