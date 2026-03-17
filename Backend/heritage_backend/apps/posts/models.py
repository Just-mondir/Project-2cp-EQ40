"""Models for the posts feature."""

from __future__ import annotations

import mongoengine as me
from django.utils import timezone


class Post(me.Document):
    
    POST_TYPE_CHOICES = ("discovery", "visit", "question", "alert", "event")
    VISIBILITY_CHOICES = ("public", "groups")
    HISTORICAL_PERIOD_CHOICES = ("", "prehistory", "roman", "islamic", "ottoman", "contemporary")
    MONUMENT_TYPE_CHOICES = ("", "civil", "military", "religious", "funerary")
    REGION_CHOICES = ("", "algiers", "oran", "constantine", "tlemcen")
    author_id = me.StringField(required=True, db_field="author_id")
    title = me.StringField(max_length=300, required=True)
    content = me.StringField(required=True)
    post_type = me.StringField(choices=POST_TYPE_CHOICES, required=True)
    historical_period = me.StringField(choices=HISTORICAL_PERIOD_CHOICES, default="")
    monument_type = me.StringField(choices=MONUMENT_TYPE_CHOICES, default="")
    region = me.StringField(choices=REGION_CHOICES, default="")
    visibility = me.StringField(choices=VISIBILITY_CHOICES, default="public")
    location = me.StringField(max_length=255, default="")
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
        return Gem.objects.filter(post=self).count()

    @property
    def comments_count(self) -> int:
        return Comment.objects.filter(post=self).count()

    def __str__(self) -> str:
        return f"{self.title} ({self.post_type})"


class EventDetails(me.Document):
    post = me.ReferenceField(Post, required=True)
    starts_at = me.DateTimeField(required=True)
    ends_at = me.DateTimeField(null=True)

    meta = {"collection": "event_details"}


class AlertDetails(me.Document):
    URGENCE_CHOICES = ("low", "medium", "high", "critical")
    STATUS_CHOICES = ("restored", "under_intervention", "destroyed", "alert")

    post = me.ReferenceField(Post, required=True)
    urgence_level = me.StringField(choices=URGENCE_CHOICES, required=True)
    current_status = me.StringField(choices=STATUS_CHOICES, default="alert")

    meta = {"collection": "alert_details"}


class PostImage(me.Document):
    post = me.ReferenceField(Post, required=True)
    image = me.StringField(max_length=500, required=True)
    uploaded_at = me.DateTimeField(default=timezone.now)

    meta = {"collection": "post_images"}


class Gem(me.Document):
    post = me.ReferenceField(Post, required=True)
    user_id = me.StringField(required=True)
    created_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "gems",
        "indexes": [{"fields": ["post", "user_id"], "unique": True}],
    }


class Save(me.Document):
    post = me.ReferenceField(Post, required=True)
    user_id = me.StringField(required=True)
    created_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "saves",
        "indexes": [{"fields": ["post", "user_id"], "unique": True}],
    }


class Comment(me.Document):
    post = me.ReferenceField(Post, required=True)
    parent = me.ReferenceField("self", null=True, default=None)
    user_id = me.StringField(required=True)
    content = me.StringField(required=True)
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
        return CommentGem.objects(comment=self).count()


class CommentGem(me.Document):
    comment = me.ReferenceField(Comment, required=True)
    user_id = me.StringField(required=True)
    created_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "comment_gems",
        "indexes": [{"fields": ["comment", "user_id"], "unique": True}],
    }