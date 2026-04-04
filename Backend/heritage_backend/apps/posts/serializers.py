"""DRF serializers for the posts app."""

from __future__ import annotations

from rest_framework import serializers

from apps.users.models import User
from apps.thematic_groups.services import user_can_access_group
from .models import (
    AlertDetails,
    Annotation,
    Comment,
    CommentGem,
    EventDetails,
    Gem,
    Post,
    PostImage,
    Save,
    MobilizationEvent,
)


def _get_user_by_id(user_id: str):
    if not user_id:
        return None
    try:
        return User.objects.get(id=user_id)
    except Exception:
        return None


class PostImageSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    image = serializers.CharField()
    uploaded_at = serializers.DateTimeField(read_only=True)


class EventDetailsSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField(allow_null=True, required=False)


class AlertDetailsSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    urgence_level = serializers.CharField()
    current_status = serializers.CharField()


class PostListSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField(source="author_id", read_only=True)
    user_display_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    post_type = serializers.CharField()
    content = serializers.SerializerMethodField()
    group_id = serializers.CharField(allow_null=True, required=False)
    group_visibility = serializers.CharField(required=False)
    historical_period = serializers.CharField()
    monument_type = serializers.CharField()
    region = serializers.CharField()
    visibility = serializers.CharField()
    location = serializers.CharField()
    gems_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    accepted_annotations_count = serializers.SerializerMethodField()
    is_gemmed = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    access_message = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    alert_details = serializers.SerializerMethodField()
    event_details = serializers.SerializerMethodField()
    is_deleted = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_user_display_name(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.display_name if user else ""

    def get_user_username(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.username if user else ""

    def _is_available(self, obj) -> bool:
        request = self.context.get("request")
        group_id = getattr(obj, "group_id", None)
        group_visibility = getattr(obj, "group_visibility", "public")
        if not group_id or group_visibility != "group_only":
            return True
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return user_can_access_group(str(request.user.id), group_id)

    def get_title(self, obj):
        if not self._is_available(obj):
            return "Unavailable"
        return obj.title

    def get_content(self, obj):
        if not self._is_available(obj):
            return "Rejoin the group to access this post."
        return obj.content

    def get_images(self, obj):
        if not self._is_available(obj):
            return []
        images = PostImage.objects(post=obj)
        return PostImageSerializer(images, many=True).data

    def get_alert_details(self, obj):
        try:
            details = AlertDetails.objects.get(post=obj)
            return AlertDetailsSerializer(details).data
        except AlertDetails.DoesNotExist:
            return None

    def get_event_details(self, obj):
        try:
            details = EventDetails.objects.get(post=obj)
            return EventDetailsSerializer(details).data
        except EventDetails.DoesNotExist:
            return None

    def get_accepted_annotations_count(self, obj):
        if not self._is_available(obj):
            return 0
        return Annotation.objects(post=obj, status="accepted").count()

    def get_is_gemmed(self, obj):
        if not self._is_available(obj):
            return False
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return Gem.objects(post=obj, user_id=str(request.user.id)).first() is not None

    def get_is_saved(self, obj):
        if not self._is_available(obj):
            return False
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return Save.objects(post=obj, user_id=str(request.user.id)).first() is not None

    def get_is_available(self, obj):
        return self._is_available(obj)

    def get_access_message(self, obj):
        return "" if self._is_available(obj) else "Rejoin the group to access this post."


class PostDetailSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField(source="author_id", read_only=True)
    user_display_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    title = serializers.CharField()
    content = serializers.CharField(required=False, allow_blank=True)
    post_type = serializers.CharField()
    group_id = serializers.CharField(allow_null=True, required=False)
    group_visibility = serializers.CharField(required=False)
    historical_period = serializers.CharField(required=False, default="", allow_blank=True)
    monument_type = serializers.CharField(required=False, default="", allow_blank=True)
    region = serializers.CharField(required=False, default="", allow_blank=True)
    visibility = serializers.CharField(required=False, default="public")
    location = serializers.CharField(required=False, default="", allow_blank=True)
    gems_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    accepted_annotations_count = serializers.SerializerMethodField()
    is_gemmed = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    access_message = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    event_details = serializers.SerializerMethodField()
    alert_details = serializers.SerializerMethodField()
    is_deleted = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    starts_at = serializers.DateTimeField(write_only=True, required=False)
    ends_at = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    urgence_level = serializers.CharField(write_only=True, required=False)
    current_status = serializers.CharField(write_only=True, required=False)

    def _validate_group_access(self, attrs):
        group_id = attrs.get("group_id", getattr(self.instance, "group_id", None) if self.instance else None)
        group_visibility = attrs.get("group_visibility", getattr(self.instance, "group_visibility", "public") if self.instance else "public")
        request = self.context.get("request")

        if group_visibility == "group_only":
            if not group_id:
                raise serializers.ValidationError({"group_id": "group_id is required for group-only posts."})
            if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
                raise serializers.ValidationError({"group_id": "Authentication is required for group-only posts."})

        if group_id and group_visibility not in ("public", "group_only"):
            raise serializers.ValidationError({"group_visibility": "Invalid group visibility."})

        if group_id and request and getattr(request, "user", None) and request.user.is_authenticated:
            if not user_can_access_group(str(request.user.id), group_id):
                raise serializers.ValidationError({"group_id": "You are not a member of this group."})

        return group_id, group_visibility

    def get_user_display_name(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.display_name if user else ""

    def get_user_username(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.username if user else ""

    def _is_available(self, obj) -> bool:
        request = self.context.get("request")
        group_id = getattr(obj, "group_id", None)
        group_visibility = getattr(obj, "group_visibility", "public")
        if not group_id or group_visibility != "group_only":
            return True
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return user_can_access_group(str(request.user.id), group_id)

    def get_images(self, obj):
        if not self._is_available(obj):
            return []
        images = PostImage.objects(post=obj)
        return PostImageSerializer(images, many=True).data

    def get_event_details(self, obj):
        try:
            details = EventDetails.objects.get(post=obj)
            return EventDetailsSerializer(details).data
        except EventDetails.DoesNotExist:
            return None

    def get_alert_details(self, obj):
        try:
            details = AlertDetails.objects.get(post=obj)
            return AlertDetailsSerializer(details).data
        except AlertDetails.DoesNotExist:
            return None

    def get_accepted_annotations_count(self, obj):
        if not self._is_available(obj):
            return 0
        return Annotation.objects(post=obj, status="accepted").count()

    def get_is_gemmed(self, obj):
        if not self._is_available(obj):
            return False
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return Gem.objects(post=obj, user_id=str(request.user.id)).first() is not None

    def get_is_saved(self, obj):
        if not self._is_available(obj):
            return False
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return Save.objects(post=obj, user_id=str(request.user.id)).first() is not None

    def get_is_available(self, obj):
        return self._is_available(obj)

    def get_access_message(self, obj):
        return "" if self._is_available(obj) else "Rejoin the group to access this post."

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not self._is_available(instance):
            data["title"] = "Unavailable"
            data["content"] = "Rejoin the group to access this post."
            data["images"] = []
        return data

    def validate(self, attrs):
        post_type = attrs.get("post_type") or (self.instance.post_type if self.instance else None)
        self._validate_group_access(attrs)
        if post_type == "event" and not attrs.get("starts_at") and not self.instance:
            raise serializers.ValidationError(
                {"starts_at": "starts_at is required for Event posts."}
            )
        if post_type == "alert" and not attrs.get("urgence_level") and not self.instance:
            raise serializers.ValidationError(
                {"urgence_level": "urgence_level is required for Alert posts."}
            )
        return attrs

    def create(self, validated_data):
        starts_at = validated_data.pop("starts_at", None)
        ends_at = validated_data.pop("ends_at", None)
        urgence_level = validated_data.pop("urgence_level", None)
        current_status = validated_data.pop("current_status", None)

        post = Post(**validated_data)
        post.save()

        if post.post_type == "event" and starts_at:
            EventDetails(post=post, starts_at=starts_at, ends_at=ends_at).save()

        if post.post_type == "alert" and urgence_level:
            AlertDetails(
                post=post,
                urgence_level=urgence_level,
                current_status=current_status,
            ).save()

        return post

    def update(self, instance, validated_data):
        starts_at = validated_data.pop("starts_at", None)
        ends_at = validated_data.pop("ends_at", None)
        urgence_level = validated_data.pop("urgence_level", None)
        current_status = validated_data.pop("current_status", None)
        group_id = validated_data.pop("group_id", instance.group_id)
        group_visibility = validated_data.pop("group_visibility", instance.group_visibility)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.group_id = group_id
        instance.group_visibility = group_visibility
        instance.save()

        if instance.post_type == "event" and starts_at:
            try:
                details = EventDetails.objects.get(post=instance)
                details.starts_at = starts_at
                details.ends_at = ends_at
                details.save()
            except EventDetails.DoesNotExist:
                EventDetails(post=instance, starts_at=starts_at, ends_at=ends_at).save()

        if instance.post_type == "alert" and urgence_level:
            try:
                details = AlertDetails.objects.get(post=instance)
                details.urgence_level = urgence_level
                details.current_status = current_status
                details.save()
            except AlertDetails.DoesNotExist:
                AlertDetails(
                    post=instance,
                    urgence_level=urgence_level,
                    current_status=current_status,
                ).save()

        return instance


class CommentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    post = serializers.SerializerMethodField()
    user_id = serializers.CharField(read_only=True)
    parent = serializers.SerializerMethodField()
    parent_id = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    user_display_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    content = serializers.CharField()
    gems_count = serializers.SerializerMethodField()
    is_gemmed = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_post(self, obj):
        return str(obj.post.id) if getattr(obj, "post", None) else ""

    def get_parent(self, obj):
        if getattr(obj, "parent", None):
            return str(obj.parent.id)
        return None

    def get_user_display_name(self, obj):
        user = _get_user_by_id(obj.user_id)
        return user.display_name if user else ""

    def get_user_username(self, obj):
        user = _get_user_by_id(obj.user_id)
        return user.username if user else ""

    def get_gems_count(self, obj):
        return CommentGem.objects(comment=obj).count()

    def get_is_gemmed(self, obj):
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return CommentGem.objects(comment=obj, user_id=str(request.user.id)).first() is not None

    def validate_parent_id(self, value):
        if value in (None, "", "null"):
            return None
        try:
            return Comment.objects.get(id=value)
        except Comment.DoesNotExist:
            raise serializers.ValidationError("Parent comment not found.")
        except Exception:
            raise serializers.ValidationError("Invalid parent comment id.")

    def validate(self, attrs):
        parent_comment = attrs.get("parent_id")
        post = self.context.get("post")

        if parent_comment and post and str(parent_comment.post.id) != str(post.id):
            raise serializers.ValidationError(
                {"parent_id": "Parent comment must belong to the same post."}
            )

        return attrs


class CommentGemSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    comment = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class GemSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    post = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class SaveSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    post = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class AnnotationSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    post = serializers.SerializerMethodField()
    user_id = serializers.CharField(read_only=True)
    text = serializers.CharField(required=False, allow_blank=True)
    image = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    validated_by_id = serializers.CharField(read_only=True)
    validated_at = serializers.DateTimeField(read_only=True)

    def get_id(self, obj):
        return str(obj.id)

    def get_post(self, obj):
        return str(obj.post.id)

    def validate(self, attrs):
        if not attrs.get("text") and not attrs.get("image"):
            raise serializers.ValidationError("Annotation must contain text or image.")
        return attrs


class MobilizationEventSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    post = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    author_id = serializers.CharField(read_only=True)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    previous_status = serializers.CharField(required=False, allow_blank=True, default="")
    current_status = serializers.CharField(required=False, allow_blank=True, default="")
    images = serializers.ListField(child=serializers.CharField(), read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def validate_post(self, value):
        if not value:
            return None
        try:
            return Post.objects.get(id=value)
        except Post.DoesNotExist:
            raise serializers.ValidationError("Post not found.")

    def create(self, validated_data):
        event = MobilizationEvent(**validated_data)
        event.save()
        return event