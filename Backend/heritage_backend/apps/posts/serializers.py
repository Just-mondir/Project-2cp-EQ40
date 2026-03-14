"""DRF serializers for the posts app."""

from __future__ import annotations

from rest_framework import serializers

from apps.users.models import User
from .models import AlertDetails, Comment, EventDetails, Gem, Post, PostImage, Save


# ---------------------------------------------------------------------------
# Nested serializers
# ---------------------------------------------------------------------------


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ["id", "image", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class EventDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventDetails
        fields = ["id", "starts_at", "ends_at"]
        read_only_fields = ["id"]


class AlertDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertDetails
        fields = ["id", "urgence_level", "current_status"]
        read_only_fields = ["id"]


# ---------------------------------------------------------------------------
# Post serializers
# ---------------------------------------------------------------------------


def _get_user_by_id(user_id: str):
    if not user_id:
        return None
    try:
        return User.objects.get(id=user_id)
    except Exception:
        return None


class PostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer used in list views."""

    user_id = serializers.CharField(source="author_id", read_only=True)
    user_display_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    gems_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)

    def get_user_display_name(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.display_name if user else ""

    def get_user_username(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.username if user else ""

    class Meta:
        model = Post
        fields = [
            "id",
            "user_id",
            "user_display_name",
            "user_username",
            "title",
            "post_type",
            "historical_period",
            "monument_type",
            "region",
            "visibility",
            "location",
            "gems_count",
            "comments_count",
            "images",
            "is_deleted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user_id", "created_at", "updated_at", "is_deleted"]


class PostDetailSerializer(serializers.ModelSerializer):
    """Full serializer used in retrieve / create / update views."""

    user_id = serializers.CharField(source="author_id", read_only=True)
    user_display_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    gems_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    countdown_seconds = serializers.IntegerField(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    event_details = EventDetailsSerializer(read_only=True)
    alert_details = AlertDetailsSerializer(read_only=True)

    # Write-only fields for creating event/alert details inline
    starts_at = serializers.DateTimeField(write_only=True, required=False)
    ends_at = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    urgence_level = serializers.ChoiceField(
        choices=AlertDetails.UrgenceLevel.choices, write_only=True, required=False
    )

    def get_user_display_name(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.display_name if user else ""

    def get_user_username(self, obj):
        user = _get_user_by_id(obj.author_id)
        return user.username if user else ""

    class Meta:
        model = Post
        fields = [
            "id",
            "user_id",
            "user_display_name",
            "user_username",
            "title",
            "content",
            "post_type",
            "historical_period",
            "monument_type",
            "region",
            "visibility",
            "location",
            "gems_count",
            "comments_count",
            "countdown_seconds",
            "images",
            "event_details",
            "alert_details",
            # write-only nested creation
            "starts_at",
            "ends_at",
            "urgence_level",
            "is_deleted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user_id", "created_at", "updated_at", "is_deleted"]

    def validate(self, attrs: dict) -> dict:
        post_type = attrs.get("post_type") or (
            self.instance.post_type if self.instance else None
        )
        if post_type == Post.PostType.EVENT and not attrs.get("starts_at"):
            raise serializers.ValidationError(
                {"starts_at": "starts_at is required for Event posts."}
            )
        if post_type == Post.PostType.ALERT and not attrs.get("urgence_level"):
            raise serializers.ValidationError(
                {"urgence_level": "urgence_level is required for Alert posts."}
            )
        return attrs

    def create(self, validated_data: dict) -> Post:
        starts_at = validated_data.pop("starts_at", None)
        ends_at = validated_data.pop("ends_at", None)
        urgence_level = validated_data.pop("urgence_level", None)

        post = Post.objects.create(**validated_data)

        if post.post_type == Post.PostType.EVENT and starts_at:
            EventDetails.objects.create(post=post, starts_at=starts_at, ends_at=ends_at)

        if post.post_type == Post.PostType.ALERT and urgence_level:
            AlertDetails.objects.create(post=post, urgence_level=urgence_level)

        return post

    def update(self, instance: Post, validated_data: dict) -> Post:
        starts_at = validated_data.pop("starts_at", None)
        ends_at = validated_data.pop("ends_at", None)
        urgence_level = validated_data.pop("urgence_level", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if instance.post_type == Post.PostType.EVENT and starts_at:
            EventDetails.objects.update_or_create(
                post=instance,
                defaults={"starts_at": starts_at, "ends_at": ends_at},
            )

        if instance.post_type == Post.PostType.ALERT and urgence_level:
            AlertDetails.objects.update_or_create(
                post=instance,
                defaults={"urgence_level": urgence_level},
            )

        return instance


# ---------------------------------------------------------------------------
# Comment serializer
# ---------------------------------------------------------------------------


class CommentSerializer(serializers.ModelSerializer):
    user_display_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    user_id = serializers.CharField(read_only=True)

    def get_user_display_name(self, obj):
        user = _get_user_by_id(obj.user_id)
        return user.display_name if user else ""

    def get_user_username(self, obj):
        user = _get_user_by_id(obj.user_id)
        return user.username if user else ""

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "user_id",
            "user_display_name",
            "user_username",
            "content",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "post", "user_id", "created_at", "updated_at"]


# ---------------------------------------------------------------------------
# Gem / Save serializers
# ---------------------------------------------------------------------------


class GemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gem
        fields = ["id", "post", "user_id", "created_at"]
        read_only_fields = ["id", "post", "user_id", "created_at"]


class SaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Save
        fields = ["id", "post", "user_id", "created_at"]
        read_only_fields = ["id", "post", "user_id", "created_at"]
