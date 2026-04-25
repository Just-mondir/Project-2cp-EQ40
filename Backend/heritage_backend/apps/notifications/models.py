"""MongoEngine document for the Notification model."""

from __future__ import annotations

import mongoengine as me
from django.utils import timezone


class Notification(me.Document):
    """An in-app notification for a user."""

    recipient_id = me.StringField(required=True)
    actor_id = me.StringField(required=True)
    event_type = me.StringField(required=True)
    target_type = me.StringField(required=True)
    target_id = me.StringField(required=True)
    message = me.StringField(default="")
    is_read = me.BooleanField(default=False)
    extra = me.DictField(default=dict)
    created_at = me.DateTimeField()

    meta = {
        "collection": "notifications",
        "ordering": ["-created_at"],
        "indexes": [
            "recipient_id",
            "is_read",
            ("recipient_id", "is_read"),
        ],
    }

    def save(self, *args, **kwargs):
        if not self.created_at:
            self.created_at = timezone.now()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Notification({self.event_type}) for {self.recipient_id}"

