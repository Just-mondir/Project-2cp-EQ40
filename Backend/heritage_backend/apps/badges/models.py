"""MongoEngine document for badge requests."""

from __future__ import annotations

from django.utils import timezone
import mongoengine as me


class BadgeRequest(me.Document):
    """A user request for a badge, backed by an uploaded document."""

    user_id = me.StringField(required=True)
    document_path = me.StringField(required=True)
    document_name = me.StringField(required=True)
    message = me.StringField(default="")
    status = me.StringField(default="pending")
    moderator_note = me.StringField(default="")
    reviewed_by_id = me.StringField(default="")
    created_at = me.DateTimeField(default=timezone.now)
    reviewed_at = me.DateTimeField(null=True, default=None)

    meta = {
        "collection": "badge_requests",
        "ordering": ["-created_at"],
        "indexes": ["user_id", "status"],
    }
