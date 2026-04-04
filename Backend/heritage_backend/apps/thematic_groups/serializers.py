"""Serializers for thematic groups."""

from __future__ import annotations

from rest_framework import serializers

from apps.users.models import User

from .models import GroupInvitation, GroupJoinRequest, GroupMembership, ThematicGroup
from .services import user_is_group_admin, user_is_group_member


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
    visibility = serializers.CharField(required=False, default="public")
    rules = serializers.CharField(allow_blank=True)

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
        return user_is_group_member(str(request.user.id), obj)

    def get_is_admin(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        return user_is_group_admin(str(request.user.id), obj)

class ThematicGroupWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    category = serializers.ChoiceField(choices=ThematicGroup.CATEGORY_CHOICES)
    description = serializers.CharField()
    profile_picture = serializers.CharField(required=False, allow_blank=True, default="")
    banner_image = serializers.CharField(required=False, allow_blank=True, default="")
    historical_period = serializers.ChoiceField(choices=ThematicGroup.HISTORICAL_PERIOD_CHOICES, required=False, allow_blank=True)
    region = serializers.ChoiceField(choices=ThematicGroup.REGION_CHOICES, required=False, allow_blank=True)
    visibility = serializers.ChoiceField(choices=ThematicGroup.VISIBILITY_CHOICES, default="public")
    rules = serializers.CharField(required=False, allow_blank=True, default="")

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
