"""MongoEngine document for the Report model."""

from __future__ import annotations

import mongoengine as me
from django.utils import timezone


class Report(me.Document):
    """A user-submitted report on a post, comment, user, or event."""

    reporter_id = me.StringField(required=True)
    target_type = me.StringField(required=True)
    target_id = me.StringField(required=True)
    reason = me.StringField(required=True)
    status = me.StringField(default="pending")
    moderator_note = me.StringField(default="")
    resolved_by = me.StringField(null=True, default=None)
    created_at = me.DateTimeField()
    resolved_at = me.DateTimeField(null=True, default=None)

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
