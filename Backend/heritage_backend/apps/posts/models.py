"""Models for the posts feature."""

from __future__ import annotations

import mongoengine as me
from django.utils import timezone


class Post(me.Document):
    
    POST_TYPE_CHOICES = ("discovery", "visit", "question", "alert", "event")
    VISIBILITY_CHOICES = ("public", "groups")
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

    MONUMENT_TYPE_CHOICES = (
    "",
    "Civil",
    "Military",
    "Religious",
    "Funerary",
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
    author_id = me.StringField(required=True, db_field="author_id")
    title = me.StringField(max_length=300, required=True)
    content = me.StringField(required=True)
    post_type = me.StringField(choices=POST_TYPE_CHOICES, required=True)
    group_id = me.StringField(null=True, default=None)
    group_visibility = me.StringField(choices=("public", "group_only"), default="public")
    historical_period = me.StringField(choices=HISTORICAL_PERIOD_CHOICES, default="")
    monument_type = me.StringField(choices=MONUMENT_TYPE_CHOICES, default="")
    region = me.StringField(choices=REGION_CHOICES, default="")
    visibility = me.StringField(choices=VISIBILITY_CHOICES, default="public")
    location = me.StringField(max_length=255, default="")
    group_id = me.StringField(default="")
    group_visibility = me.StringField(default="")
    is_deleted = me.BooleanField(default=False)
    created_at = me.DateTimeField(default=timezone.now)
    updated_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "posts",
        "ordering": ["-created_at"],
        "indexes": ["author_id", "post_type", "is_deleted"],
    }

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        return super().save(*args, **kwargs)

    @property
    def gems_count(self) -> int:
        return Gem.objects(post=self, is_deleted=False).count()

    @property
    def comments_count(self) -> int:
        return Comment.objects(post=self, is_deleted=False).count()

    def __str__(self) -> str:
        return f"{self.title} ({self.post_type})"


class EventDetails(me.Document):
    post = me.ReferenceField(Post, required=True)
    starts_at = me.DateTimeField(required=True)
    ends_at = me.DateTimeField(null=True)
    is_deleted = me.BooleanField(default=False)

    meta = {"collection": "event_details"}


class AlertDetails(me.Document):
    URGENCE_CHOICES = ("low", "medium", "high", "critical")
    STATUS_CHOICES = ("restored", "under_intervention", "destroyed", "alert")

    post = me.ReferenceField(Post, required=True)
    urgence_level = me.StringField(choices=URGENCE_CHOICES, required=True)
    current_status = me.StringField(choices=STATUS_CHOICES, default="alert")
    is_deleted = me.BooleanField(default=False)

    meta = {"collection": "alert_details"}


class PostImage(me.Document):
    post = me.ReferenceField(Post, required=True)
    image = me.StringField(max_length=500, required=True)
    uploaded_at = me.DateTimeField(default=timezone.now)
    is_deleted = me.BooleanField(default=False)

    meta = {"collection": "post_images"}


class Gem(me.Document):
    post = me.ReferenceField(Post, required=True)
    user_id = me.StringField(required=True)
    created_at = me.DateTimeField(default=timezone.now)
    is_deleted = me.BooleanField(default=False)

    meta = {
        "collection": "gems",
        "indexes": [{"fields": ["post", "user_id"], "unique": True}],
    }


class Save(me.Document):
    post = me.ReferenceField(Post, required=True)
    user_id = me.StringField(required=True)
    created_at = me.DateTimeField(default=timezone.now)
    is_deleted = me.BooleanField(default=False)

    meta = {
        "collection": "saves",
        "indexes": [{"fields": ["post", "user_id"], "unique": True}],
    }


class Repost(me.Document):
    post = me.ReferenceField(Post, required=True)
    user_id = me.StringField(required=True)
    description = me.StringField(default="")
    created_at = me.DateTimeField(default=timezone.now)
    is_deleted = me.BooleanField(default=False)

    meta = {
        "collection": "reposts",
        "ordering": ["-created_at"],
        "indexes": [{"fields": ["post", "user_id"], "unique": True}, "user_id"],
    }


class Comment(me.Document):
    post = me.ReferenceField(Post, required=True)
    parent = me.ReferenceField("self", null=True, default=None)
    user_id = me.StringField(required=True)
    content = me.StringField(required=True)
    is_deleted = me.BooleanField(default=False)
    created_at = me.DateTimeField(default=timezone.now)
    updated_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "comments",
        "ordering": ["created_at"],
    }

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        return super().save(*args, **kwargs)

    @property
    def gems_count(self) -> int:
        return CommentGem.objects(comment=self, is_deleted=False).count()


class CommentGem(me.Document):
    comment = me.ReferenceField(Comment, required=True)
    user_id = me.StringField(required=True)
    created_at = me.DateTimeField(default=timezone.now)
    is_deleted = me.BooleanField(default=False)

    meta = {
        "collection": "comment_gems",
        "indexes": [{"fields": ["comment", "user_id"], "unique": True}],
    }

class Annotation(me.Document):
    class Status(me.StringField):
        PENDING = "pending"
        ACCEPTED = "accepted"
        REJECTED = "rejected"

    post = me.ReferenceField(Post, required=True)
    user_id = me.StringField(required=True)
    text = me.StringField(default="")
    image = me.StringField(default="")
    status = me.StringField(
        choices=["pending", "accepted", "rejected"],
        default="pending"
    )
    is_deleted = me.BooleanField(default=False)
    created_at = me.DateTimeField(default=timezone.now)
    updated_at = me.DateTimeField(default=timezone.now)
    validated_by_id = me.StringField(default="")
    validated_at = me.DateTimeField(null=True)

    meta = {"collection": "annotations"}


class MobilizationEvent(me.Document):
    post = me.ReferenceField(Post, required=False, null=True)
    author_id = me.StringField(required=True)
    description = me.StringField(default="")
    previous_status = me.StringField(default="")
    current_status = me.StringField(default="")
    images = me.ListField(me.StringField(), default=list)
    is_deleted = me.BooleanField(default=False)
    created_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "mobilization_events",
        "ordering": ["-created_at"],
    }
