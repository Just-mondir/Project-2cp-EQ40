"""Event registry pattern for notifications."""

from __future__ import annotations

import logging
from .models import Notification

logger = logging.getLogger(__name__)

EVENT_REGISTRY = {
    "gem_on_post": "{actor} liked your post \"{post_title}\"",
    "comment_on_post": "{actor} commented on your post \"{post_title}\"",
    "reply_to_comment": "{actor} replied to your comment",
    "gem_on_comment": "{actor} liked your comment",
    "group_invite_received": "{actor} invited you to join {group_name}",
    "group_join_request_approved": "Your request to join {group_name} was approved",
    "group_join_request_rejected": "Your request to join {group_name} was rejected",
    "badge_request_reviewed": "Your badge request was reviewed",
    "user_banned": "A moderator banned your account",
    "user_suspended": "A moderator suspended your account",
}

def notify(
    event_type: str,
    actor_id: str,
    actor_name: str,
    recipient_id: str,
    target_type: str,
    target_id: str,
    **context
) -> Notification | None:
    """Create a notification based on the event registry template."""
    if not recipient_id or str(recipient_id) == str(actor_id):
        return None  # No self-notifications

    template = EVENT_REGISTRY.get(event_type)
    if not template:
        logger.warning(f"Unknown event type: {event_type}")
        template = "You have a new notification."

    message = template.format(actor=actor_name, **context)

    try:
        report = Notification(
            recipient_id=str(recipient_id),
            actor_id=str(actor_id),
            event_type=event_type,
            target_type=target_type,
            target_id=str(target_id),
            message=message,
        )
        report.save()
        return report
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        return None
