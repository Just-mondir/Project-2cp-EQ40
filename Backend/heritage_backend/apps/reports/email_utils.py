"""Email utilities for report notifications."""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def _build_report_html(
    reporter_name: str,
    target_type: str,
    target_description: str,
    reason: str,
    context_label: str,
) -> str:
    """Build an HTML email body for a report notification."""
    return f"""
    <div style="font-family:Arial,sans-serif;background:#fff8e2;padding:24px;color:#432817;">
        <h2 style="margin:0 0 12px;">Content Report — {context_label}</h2>
        <p style="margin:0 0 8px;"><strong>{reporter_name}</strong> reported a <strong>{target_type}</strong>.</p>
        <p style="margin:0 0 8px;"><strong>Target:</strong> {target_description}</p>
        <p style="margin:0 0 8px;"><strong>Reason:</strong> {reason}</p>
        <p style="margin:16px 0 0;color:#888;font-size:13px;">
            Please review this report in the Kunuz moderation dashboard.
        </p>
    </div>
    """.strip()


def send_report_notification_email(
    recipient_emails: list[str],
    reporter_name: str,
    target_type: str,
    target_description: str,
    reason: str,
    context_label: str = "Review Required",
) -> None:
    """Send an HTML report notification email to one or more recipients.

    Args:
        recipient_emails: List of email addresses to notify.
        reporter_name: Display name of the user who submitted the report.
        target_type: The type of content reported (e.g. "post", "comment", "group").
        target_description: A short description of the reported content.
        reason: The reason given by the reporter.
        context_label: A label shown in the email subject/heading (e.g. group name).
    """
    if not recipient_emails:
        return

    subject = f"Kunuz Report: {target_type} reported — {context_label}"
    body = (
        f"{reporter_name} reported a {target_type}.\n\n"
        f"Target: {target_description}\n"
        f"Reason: {reason}\n\n"
        f"Please review this report in the Kunuz moderation dashboard."
    )
    html_body = _build_report_html(
        reporter_name=reporter_name,
        target_type=target_type,
        target_description=target_description,
        reason=reason,
        context_label=context_label,
    )

    email = EmailMultiAlternatives(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipient_emails,
    )
    email.attach_alternative(html_body, "text/html")

    try:
        email.send(fail_silently=True)
    except Exception:
        logger.exception("Failed to send report notification email.")
