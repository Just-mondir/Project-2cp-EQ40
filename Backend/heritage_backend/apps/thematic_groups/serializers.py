"""Serializers for thematic groups."""

from __future__ import annotations

from rest_framework import serializers

import bleach


def _sanitize_plain(value: str) -> str:
    if not value:
        return value
    return bleach.clean(value, tags=[], strip=True).strip()

from apps.posts.serializers import PostDetailSerializer, PostListSerializer
from apps.users.models import User

from .models import GroupInvitation, GroupJoinRequest, GroupMembership, ThematicGroup
from .services import user_can_access_group, user_is_group_admin, user_is_group_member


def _get_user(user_id: str) -> User | None:
    try:
        return User.objects.get(id=user_id)
    except Exception:
        return None


class GroupMemberSerializer(serializers.Serializer):
    id = serializers.CharField()
    username = serializers.CharField()
    display_name = serializers.CharField()
    profile_picture = serializers.CharField()
    badge = serializers.CharField()
    is_admin = serializers.BooleanField(default=False)
    role = serializers.CharField(default="member")
    can_remove = serializers.BooleanField(default=False)


class GroupPostListSerializer(PostListSerializer):
    """Group post serializer that hides internal visibility fields."""

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop("visibility", None)
        data.pop("group_visibility", None)
        return data


class GroupPostDetailSerializer(PostDetailSerializer):
    """Group post serializer for public group posts."""

    def validate(self, attrs):
        attrs["visibility"] = "groups"
        return super().validate(attrs)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop("visibility", None)
        data.pop("group_visibility", None)
        return data


class ThematicGroupSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    name = serializers.CharField()
    category = serializers.CharField()
    description = serializers.CharField()
    profile_picture = serializers.CharField(allow_blank=True)
    banner_image = serializers.CharField(allow_blank=True)
    admin_id = serializers.CharField()
    member_count = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    historical_period = serializers.CharField(allow_blank=True)
    region = serializers.CharField(allow_blank=True)
    rules = serializers.SerializerMethodField()
    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_member_count(self, obj) -> int:
        return GroupMembership.objects(group=obj).count()

    def get_post_count(self, obj) -> int:
        from apps.posts.models import Post
        return Post.objects(group_id=str(obj.id), is_deleted=False).count()

    def get_is_member(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return user_can_access_group(str(request.user.id), obj)

    def get_is_admin(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return user_is_group_admin(str(request.user.id), obj)

    def get_rules(self, obj) -> str:
        rules = getattr(obj, "rules", "")
        if isinstance(rules, list):
            return "\n".join(rule for rule in rules if rule).strip()
        return rules or ""

class ThematicGroupWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    category = serializers.ChoiceField(choices=ThematicGroup.CATEGORY_CHOICES)
    description = serializers.CharField()
    profile_picture = serializers.CharField(required=False, allow_blank=True, default="")
    banner_image = serializers.CharField(required=False, allow_blank=True, default="")
    historical_period = serializers.ChoiceField(choices=ThematicGroup.HISTORICAL_PERIOD_CHOICES, required=False, allow_blank=True)
    region = serializers.ChoiceField(choices=ThematicGroup.REGION_CHOICES, required=False, allow_blank=True)
    rules = serializers.CharField(required=False, allow_blank=True, default="")


    def validate(self, attrs):
        # --- XSS sanitization ---
        if "name" in attrs:
            attrs["name"] = _sanitize_plain(attrs["name"])
        if "description" in attrs:
            attrs["description"] = _sanitize_plain(attrs["description"])
        if "rules" in attrs:
            attrs["rules"] = _sanitize_plain(attrs["rules"])
        # --- end sanitization ---
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        group = ThematicGroup(
            admin_id=str(request.user.id),
            **validated_data,
        )
        group.save()
        GroupMembership(group=group, user_id=str(request.user.id)).save()
        return group

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
    
class GroupJoinRequestSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()
    requester_id = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    reviewed_by_id = serializers.CharField()
    reviewed_at = serializers.DateTimeField(allow_null=True)

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_group_id(self, obj) -> str:
        return str(obj.group.id)


class GroupInvitationSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()
    sender_id = serializers.CharField()
    recipient_id = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    responded_at = serializers.DateTimeField(allow_null=True)

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_group_id(self, obj) -> str:
        return str(obj.group.id)


class GroupActionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("approved", "rejected"))
    note = serializers.CharField(required=False, allow_blank=True, default="")


class GroupInvitationResponseSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("accepted", "refused"))


class GroupAboutSerializer(serializers.Serializer):
    id                = serializers.SerializerMethodField()
    name              = serializers.CharField()
    description       = serializers.CharField(default="")
    category          = serializers.CharField(default="")
    historical_period = serializers.CharField(allow_blank=True)
    region            = serializers.CharField(allow_blank=True)
    profile_picture   = serializers.CharField(allow_blank=True)
    banner_image      = serializers.CharField(allow_blank=True)
    rules             = serializers.SerializerMethodField()
    member_count      = serializers.SerializerMethodField()
    post_count        = serializers.SerializerMethodField()
    managed_by        = serializers.SerializerMethodField()
    active_since      = serializers.SerializerMethodField()

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_member_count(self, obj) -> int:
        return GroupMembership.objects(group=obj).count()

    def get_post_count(self, obj) -> int:
        from apps.posts.models import Post
        return Post.objects(group_id=str(obj.id), is_deleted=False).count()

    def get_rules(self, obj) -> str:
        rules = getattr(obj, "rules", "")
        if isinstance(rules, list):
            return "\n".join(rule for rule in rules if rule).strip()
        return rules or ""

    def get_managed_by(self, obj) -> dict | None:
        try:
            user = User.objects.get(id=obj.admin_id)
            return {
                "id":              str(user.id),
                "username":        user.username,
                "display_name":    getattr(user, "display_name", user.username),
                "profile_picture": getattr(user, "profile_picture", None),
            }
        except Exception:
            return None

    def get_active_since(self, obj) -> str | None:
        created_at = getattr(obj, "created_at", None)
        if created_at:
            return created_at.strftime("%d/%m/%Y")
        return None
