"""MongoEngine documents for thematic groups and membership flows."""

from __future__ import annotations

from django.utils import timezone
import mongoengine as me


class ThematicGroup(me.Document):
    """A thematic group owned by a user."""
    HISTORICAL_PERIOD_CHOICES = (
    "",
    "Prehistory",
    "Protohistory",
    "Numidian period",
    "Punic (Carthaginian) period",
    "Roman period",
    "Vandal period",
    "Byzantine period",
    "Early Islamic period",
    "Rostamid dynasty",
    "Zirid dynasty",
    "Hammadid dynasty",
    "Almohad dynasty",
    "Zayyanid dynasty",
    "Ottoman period",
    "French colonization",
    "War of Independence",
    "Independent Algeria",
    "Contemporary period",
    )
    REGION_CHOICES = (
    "",
    "Kabylia",
    "Tuareg",
    "Chaoui",
    "Chleuh",
    "Medea",
    "Constantine",
    "Algiers",
    "Tlemcen",
    "Oran",
    "Tipaza",
    "Setif",
    "Batna",
    "Beni Mzab",
    "Ouled Nail",
    "Tassili n'Ajjer",
    )

    CATEGORY_CHOICES = (
    "",
    "Archaeology",
    "Ancient Civilizations",
    "Historical Sites",
    "World Heritage Sites",
    "Ruins",
    "Architectural Heritage",
    "Cultural Landmarks",
    "Monuments",
    "Castles",
    "Fortresses",
    "Religious Sites",
    "Museums",
    "Palaces",
    "Temples",
    "Historic Towns",
    "Prehistoric Sites",
    "Colonial Architecture",
    "Monument Preservation",
    "Intangible Heritage",
    "Heritage Restoration",
    "Cultural Experience",
    "Local History",
    )
    name = me.StringField(required=True, max_length=160)
    description = me.StringField(required=True,default="")
    profile_picture = me.StringField(default="")
    banner_image = me.StringField(default="")
    category = me.StringField(choices=CATEGORY_CHOICES, required=True)
    historical_period = me.StringField(choices=HISTORICAL_PERIOD_CHOICES,default="")
    region = me.StringField(choices=REGION_CHOICES,default="")
    rules = me.StringField(default="")
    tags       = me.ListField(me.StringField(), default=list)
    visibility = me.StringField(choices=("public", "private"), default="public")
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
        self.visibility = "public"
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


class GroupChatMessage(me.Document):
    """Chat message shared between accepted members of a thematic group."""

    group = me.ReferenceField(ThematicGroup, required=True)
    user_id = me.StringField(required=True)
    reply_to = me.ReferenceField("self", null=True, default=None)
    text = me.StringField(default="")
    image = me.StringField(default="")
    audio = me.StringField(default="")
    gem_user_ids = me.ListField(me.StringField(), default=list)
    pinned_by_id = me.StringField(default="")
    pinned_at = me.DateTimeField(null=True, default=None)
    is_deleted = me.BooleanField(default=False)
    edited_at = me.DateTimeField(null=True, default=None)
    created_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "group_chat_messages",
        "ordering": ["created_at"],
        "indexes": ["group", "user_id", "created_at"],
    }


class GroupChatMute(me.Document):
    """Notification mute setting for a user's group chat."""

    group = me.ReferenceField(ThematicGroup, required=True)
    user_id = me.StringField(required=True)
    muted_until = me.DateTimeField(null=True, default=None)
    muted_forever = me.BooleanField(default=False)
    updated_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "group_chat_mutes",
        "indexes": [{"fields": ["group", "user_id"], "unique": True}],
    }

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        return super().save(*args, **kwargs)
