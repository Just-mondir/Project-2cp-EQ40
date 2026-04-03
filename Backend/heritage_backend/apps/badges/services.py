"""Badge request helpers."""

from __future__ import annotations

import os

from django.conf import settings
from django.core.mail import EmailMessage

from apps.users.models import User


def get_moderator_emails() -> list[str]:
    emails: list[str] = []
    for user in User.objects(is_active=True):
        if getattr(user, "role", None) in ("moderator", "admin") or getattr(user, "is_staff", False):
            if user.email:
                emails.append(user.email)
    return sorted(set(emails))


def send_badge_request_email(request_obj, uploader_name: str) -> None:
    recipients = get_moderator_emails()
    if not recipients:
        return

    subject = f"Badge request from {uploader_name}"
    body = (
        f"A new badge request was submitted by {uploader_name}.\n\n"
        f"Message: {request_obj.message or 'No additional message'}\n"
        f"Status: {request_obj.status}\n"
        f"Document: {request_obj.document_name}"
    )
    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipients,
    )

    file_path = request_obj.document_path
    if os.path.exists(file_path):
        with open(file_path, "rb") as document_file:
            email.attach(request_obj.document_name, document_file.read())

    email.send(fail_silently=True)
