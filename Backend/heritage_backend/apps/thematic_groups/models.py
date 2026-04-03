"""MongoEngine documents for thematic groups and membership flows."""

from __future__ import annotations

from django.utils import timezone
import mongoengine as me


class ThematicGroup(me.Document):
    """A thematic group owned by a user."""

    name = me.StringField(required=True, max_length=160)
    category = me.StringField(required=True, max_length=120)
    description = me.StringField(default="")
    profile_picture = me.StringField(default="")
    banner_image = me.StringField(default="")
    admin_id = me.StringField(required=True)
    created_at = me.DateTimeField(default=timezone.now)
    updated_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "thematic_groups",
        "ordering": ["-created_at"],
        "indexes": ["admin_id", "category", "name"],
    }

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        return super().save(*args, **kwargs)


class GroupMembership(me.Document):
    """Accepted membership for a thematic group."""

    group = me.ReferenceField(ThematicGroup, required=True)
    user_id = me.StringField(required=True)
    joined_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "group_memberships",
        "indexes": [{"fields": ["group", "user_id"], "unique": True}],
    }


class GroupJoinRequest(me.Document):
    """Pending join request sent by a user."""

    group = me.ReferenceField(ThematicGroup, required=True)
    requester_id = me.StringField(required=True)
    status = me.StringField(default="pending")
    created_at = me.DateTimeField(default=timezone.now)
    reviewed_by_id = me.StringField(default="")
    reviewed_at = me.DateTimeField(null=True, default=None)

    meta = {
        "collection": "group_join_requests",
        "indexes": [
            "requester_id",
            "status",
            {"fields": ["group", "requester_id", "status"], "unique": True},
        ],
    }


class GroupInvitation(me.Document):
    """Invitation sent from a group member to another user."""

    group = me.ReferenceField(ThematicGroup, required=True)
    sender_id = me.StringField(required=True)
    recipient_id = me.StringField(required=True)
    status = me.StringField(default="pending")
    created_at = me.DateTimeField(default=timezone.now)
    responded_at = me.DateTimeField(null=True, default=None)

    meta = {
        "collection": "group_invitations",
        "indexes": [
            "recipient_id",
            "status",
            {"fields": ["group", "recipient_id", "status"], "unique": True},
        ],
    }
