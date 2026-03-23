"""DRF serializers for the posts app."""

from __future__ import annotations

from rest_framework import serializers

from apps.users.models import User
from .models import AlertDetails, Comment, CommentGem, EventDetails, Gem, Post, PostImage, Save


def _get_user_by_id(user_id: str):
    if not user_id:
        return None
    try:
        return User.objects.get(id=user_id)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Nested serializers
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Post serializers
# ---------------------------------------------------------------------------

class PostListSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField(source="author_id", read_only=True)
    user_display_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    title = serializers.CharField()
    post_type = serializers.CharField()
    content = serializers.CharField()
    historical_period = serializers.CharField()
    monument_type = serializers.CharField()
    region = serializers.CharField()
    visibility = serializers.CharField()
    location = serializers.CharField()
    gems_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
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

    def get_images(self, obj):
        images = PostImage.objects.filter(post=obj)
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

class PostDetailSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField(source="author_id", read_only=True)
    user_display_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    title = serializers.CharField()
    content = serializers.CharField()
    post_type = serializers.CharField()
    historical_period = serializers.CharField(required=False, default="", allow_blank=True)
    monument_type = serializers.CharField(required=False, default="", allow_blank=True)
    region = serializers.CharField(required=False, default="", allow_blank=True)
    visibility = serializers.CharField(required=False, default="public")
    location = serializers.CharField(required=False, default="", allow_blank=True)
    gems_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    images = serializers.SerializerMethodField()
    event_details = serializers.SerializerMethodField()
    alert_details = serializers.SerializerMethodField()
    is_deleted = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    # write-only nested fields
    starts_at = serializers.DateTimeField(write_only=True, required=False)
    ends_at = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    urgence_level = serializers.CharField(write_only=True, required=False)

    # NEW: uploaded image files
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    def get_user_display_name(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.display_name if user else ""

    def get_user_username(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.username if user else ""

    def get_images(self, obj):
        images = PostImage.objects.filter(post=obj)
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

    def validate(self, attrs):
        post_type = attrs.get("post_type") or (
            self.instance.post_type if self.instance else None
        )
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
        uploaded_images = validated_data.pop("uploaded_images", [])

        post = Post(**validated_data)
        post.save()

        if post.post_type == "event" and starts_at:
            EventDetails(post=post, starts_at=starts_at, ends_at=ends_at).save()

        if post.post_type == "alert" and urgence_level:
            AlertDetails(post=post, urgence_level=urgence_level).save()

        for image_file in uploaded_images:
            PostImage.objects.create(post=post, image=image_file)

        return post

    def update(self, instance, validated_data):
        starts_at = validated_data.pop("starts_at", None)
        ends_at = validated_data.pop("ends_at", None)
        urgence_level = validated_data.pop("urgence_level", None)
        uploaded_images = validated_data.pop("uploaded_images", [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
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
                details.save()
            except AlertDetails.DoesNotExist:
                AlertDetails(post=instance, urgence_level=urgence_level).save()

        for image_file in uploaded_images:
            PostImage.objects.create(post=instance, image=image_file)

        return instance
# ---------------------------------------------------------------------------
# Comment serializers
# ---------------------------------------------------------------------------

class CommentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    post = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
    parent = serializers.CharField(allow_null=True, required=False)
    user_display_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    content = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_user_display_name(self, obj):
        user = _get_user_by_id(obj.user_id)
        return user.display_name if user else ""

    def get_user_username(self, obj):
        user = _get_user_by_id(obj.user_id)
        return user.username if user else ""


class CommentGemSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    comment = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


# ---------------------------------------------------------------------------
# Gem / Save serializers
# ---------------------------------------------------------------------------

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