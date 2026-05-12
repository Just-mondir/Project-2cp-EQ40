"""MongoEngine documents for the reports app."""

from __future__ import annotations

import mongoengine as me
from django.utils import timezone

from apps.posts.models import Post


class Report(me.Document):
    """A user-submitted report on a post, comment, user, or event."""

    reporter_id = me.StringField(required=True)
    target_type = me.StringField(required=True)
    target_id = me.StringField(required=True)
    reason = me.StringField(required=True)
    description = me.StringField(default="")
    status = me.StringField(default="pending")

    moderator_note = me.StringField(default="")
    resolved_by = me.StringField(null=True, default=None)
    created_at = me.DateTimeField()
    resolved_at = me.DateTimeField(null=True, default=None)
    is_deleted = me.BooleanField(default=False)

    meta = {
        "collection": "reports",
        "indexes": [
            "reporter_id",
            "target_type",
            "status",
            {"fields": ["reporter_id", "target_type", "target_id", "status"]},
        ],
    }

    def save(self, *args, **kwargs):
        if not self.created_at:
            self.created_at = timezone.now()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Report({self.target_type}:{self.target_id}) by {self.reporter_id}"


class MobilizationReport(me.Document):
    """A mobilization report linked to an alert post."""

    STATUS_CHOICES = (
        "restored",
        "under_intervention",
        "destroyed",
        "alert",
    )

    post = me.ReferenceField(Post, required=True)
    reason = me.StringField(required=False, default="")
    description = me.StringField(required=True)
    images = me.ListField(me.StringField(), default=list)
    previous_status = me.StringField(required=True, choices=STATUS_CHOICES)
    requested_status = me.StringField(required=True, choices=STATUS_CHOICES)
    status = me.StringField(default="pending")
    created_by = me.StringField(required=True)
    created_at = me.DateTimeField()
    updated_at = me.DateTimeField()
    is_deleted = me.BooleanField(default=False)

    meta = {
        "collection": "mobilization_reports",
        "indexes": [
            "created_by",
            "previous_status",
            "requested_status",
            "created_at",
            {"fields": ["post", "created_at"]},
        ],
    }

    def clean(self):
        if self.previous_status == self.requested_status:
            raise me.ValidationError(
                "previous_status and requested_status cannot be the same."
            )

        if len(self.images or []) > 4:
            raise me.ValidationError("A mobilization report can have at most 4 images.")

    def save(self, *args, **kwargs):
        now = timezone.now()
        if not self.created_at:
            self.created_at = now
        self.updated_at = now
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"MobilizationReport(post={self.post.id}, requested={self.requested_status})"