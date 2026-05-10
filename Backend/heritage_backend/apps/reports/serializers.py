"""Serializers for the reports app."""

from __future__ import annotations

import logging

from rest_framework import serializers

from apps.posts.models import Annotation, Comment, Post
from apps.thematic_groups.models import GroupChatMessage
from apps.users.models import User

from .models import MobilizationReport, Report

logger = logging.getLogger(__name__)

ALLOWED_TARGET_TYPES = {"post", "comment", "annotation", "user", "event", "group_chat_message", "group"}


def _get_user_by_id(user_id: str):
    if not user_id:
        return None
    try:
        return User.objects.get(id=user_id)
    except Exception:
        return None


class ReportSerializer(serializers.Serializer):
    """Read-only representation of a Report document."""

    id = serializers.SerializerMethodField()
    reporter_id = serializers.CharField()
    target_type = serializers.CharField()
    target_id = serializers.CharField()
    reason = serializers.CharField()
    description = serializers.CharField(required=False, default="")
    status = serializers.CharField()

    moderator_note = serializers.CharField()
    resolved_by = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()
    resolved_at = serializers.DateTimeField(allow_null=True)

    reporter_details = serializers.SerializerMethodField()
    target_details = serializers.SerializerMethodField()

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_reporter_details(self, obj):
        user = _get_user_by_id(obj.reporter_id)
        if not user:
            return None
        return {
            "id": str(user.id),
            "display_name": user.display_name,
            "username": user.username,
            "profile_picture": user.profile_picture,
        }

    def get_target_details(self, obj):
        from apps.posts.models import Post, Comment, Annotation
        from apps.thematic_groups.models import GroupChatMessage
        from apps.users.models import User
        
        try:
            if obj.target_type == "user":
                target = User.objects.get(id=obj.target_id)
                return {
                    "author_name": target.display_name,
                    "author_username": target.username,
                    "author_avatar": target.profile_picture,
                    "content": f"User profile: {target.display_name}",
                    "type": "user"
                }

            elif obj.target_type == "post":
                target = Post.objects.get(id=obj.target_id)
                author = _get_user_by_id(target.author_id)
                return {
                    "id": str(target.id),
                    "author_name": author.display_name if author else "Unknown",
                    "author_username": author.username if author else "",
                    "author_avatar": author.profile_picture if author else "",
                    "content": target.title or (target.content[:200] + "..." if len(target.content) > 200 else target.content),
                    "type": "post",
                    "post_type": target.post_type,
                    "target_user_id": str(author.id) if author else None,
                    "group_id": str(target.group_id) if target.group_id and str(target.group_id) != "None" else None
                }

            elif obj.target_type == "comment":
                target = Comment.objects.get(id=obj.target_id)
                author = _get_user_by_id(target.user_id)
                post = target.post
                return {
                    "id": str(target.id),
                    "author_name": author.display_name if author else "Unknown",
                    "author_username": author.username if author else "",
                    "author_avatar": author.profile_picture if author else "",
                    "content": target.content,
                    "type": "comment",
                    "post_id": str(post.id) if post else None,
                    "target_user_id": str(author.id) if author else None,
                    "group_id": str(post.group_id) if post and post.group_id and str(post.group_id) != "None" else None
                }

            elif obj.target_type == "group_chat_message":
                target = GroupChatMessage.objects.get(id=obj.target_id)
                author = _get_user_by_id(target.author_id)
                return {
                    "id": str(target.id),
                    "author_name": author.display_name if author else "Unknown",
                    "author_username": author.username if author else "",
                    "author_avatar": author.profile_picture if author else "",
                    "content": target.content,
                    "type": "chat_message",
                    "target_user_id": str(author.id) if author else None,
                    "group_id": str(target.group.id) if target.group and str(target.group.id) != "None" else None
                }

            elif obj.target_type == "group":
                from apps.thematic_groups.models import ThematicGroup
                target = ThematicGroup.objects.get(id=obj.target_id)
                admin = _get_user_by_id(str(target.admin_id))
                return {
                    "id": str(target.id),
                    "author_name": admin.display_name if admin else "Unknown",
                    "author_username": admin.username if admin else "",
                    "author_avatar": admin.profile_picture if admin else "",
                    "content": target.name,
                    "type": "group",
                    "target_user_id": str(admin.id) if admin else None,
                    "group_id": str(target.id),
                }

        except Exception as e:
            logger.error(f"Error fetching report target details: {e}")
            return None
        return None


class ReportCreateSerializer(serializers.Serializer):
    """Validate and create a new Report."""

    target_type = serializers.CharField()
    target_id = serializers.CharField()
    reason = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True, default="")

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
                        "post, comment, annotation, user, event, group_chat_message, group."
                    )
                }
            )

        if len(reason) < 4:
            raise serializers.ValidationError(
                {"reason": "Reason must be at least 4 characters."}
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
            from bson.errors import InvalidId
            try:
                if Post.objects(id=target_id, is_deleted=False).count() == 0:
                    raise serializers.ValidationError(
                        {"target_id": "Post not found."}
                    )
            except InvalidId:
                raise serializers.ValidationError(
                    {"target_id": "Invalid post ID format."}
                )

        elif target_type == "comment":
            from bson.errors import InvalidId
            try:
                if Comment.objects(id=target_id, is_deleted=False).count() == 0:
                    raise serializers.ValidationError(
                        {"target_id": "Comment not found."}
                    )
            except InvalidId:
                raise serializers.ValidationError(
                    {"target_id": "Invalid comment ID format."}
                )

        elif target_type == "annotation":
            try:
                Annotation.objects.get(id=target_id, is_deleted=False)
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

        elif target_type == "group":
            from apps.thematic_groups.models import ThematicGroup
            try:
                ThematicGroup.objects.get(id=target_id, is_deleted=False)
            except Exception:
                raise serializers.ValidationError(
                    {"target_id": "Group not found."}
                )

        if Report.objects(
            reporter_id=reporter_id,
            target_type=target_type,
            target_id=target_id,
            status="pending",
            is_deleted=False,
        ).count() > 0:
            raise serializers.ValidationError(
                {"non_field_errors": "You already have a pending report for this target."}
            )

        attrs["target_type"] = target_type
        attrs["target_id"] = target_id
        attrs["reason"] = reason
        attrs["description"] = attrs.get("description", "").strip()
        return attrs


    def create(self, validated_data):
        reporter_id = self.context["reporter_id"]
        report = Report(
            reporter_id=reporter_id,
            target_type=validated_data["target_type"],
            target_id=validated_data["target_id"],
            reason=validated_data["reason"],
            description=validated_data.get("description", ""),
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
