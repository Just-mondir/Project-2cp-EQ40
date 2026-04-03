"""Badge request helpers."""

from __future__ import annotations

import os

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.signing import TimestampSigner

from apps.users.models import User

_BADGE_REVIEW_SIGNER = TimestampSigner(salt="badge-request-review")


def get_moderator_emails() -> list[str]:
    emails: list[str] = []
    for user in User.objects(is_active=True):
        if getattr(user, "role", None) in ("moderator", "admin") or getattr(user, "is_staff", False):
            if user.email:
                emails.append(user.email)
    return sorted(set(emails))


def build_badge_review_token(request_id: str, action: str) -> str:
        return _BADGE_REVIEW_SIGNER.sign(f"{request_id}:{action}")


def decode_badge_review_token(token: str, max_age_seconds: int = 60 * 60 * 24 * 7) -> tuple[str, str]:
        payload = _BADGE_REVIEW_SIGNER.unsign(token, max_age=max_age_seconds)
        request_id, action = payload.split(":", 1)
        return request_id, action


def build_badge_review_url(request_id: str, action: str) -> str:
        token = build_badge_review_token(request_id, action)
        return f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/api/badge-requests/email-review/{token}/"


def build_badge_request_html(subject_name: str, message: str, document_name: str, approve_url: str, reject_url: str) -> str:
        safe_message = message or "No additional message"
        return f"""
        <div style="font-family:Arial,sans-serif;background:#fff8e2;padding:24px;color:#432817;">
            <h2 style="margin:0 0 12px;">Badge request from {subject_name}</h2>
            <p style="margin:0 0 8px;">A new badge request was submitted.</p>
            <p style="margin:0 0 8px;"><strong>Message:</strong> {safe_message}</p>
            <p style="margin:0 0 16px;"><strong>Document:</strong> {document_name}</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <a href="{approve_url}" style="background:#2e7d32;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Approve</a>
                <a href="{reject_url}" style="background:#c0392b;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Reject</a>
            </div>
        </div>
        """.strip()


def send_badge_request_email(request_obj, uploader_name: str) -> None:
    recipients = get_moderator_emails()
    if not recipients:
        return

    subject_name = (uploader_name or "someone").strip() or "someone"
    subject = f"Badge request from {subject_name}"
    approve_url = build_badge_review_url(str(request_obj.id), "approved")
    reject_url = build_badge_review_url(str(request_obj.id), "rejected")
    body = (
        f"A new badge request was submitted by {subject_name}.\n\n"
        f"Message: {request_obj.message or 'No additional message'}\n"
        f"Status: {request_obj.status}\n"
        f"Document: {request_obj.document_name}\n"
        f"Approve: {approve_url}\n"
        f"Reject: {reject_url}"
    )
    email = EmailMultiAlternatives(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipients,
    )

    email.attach_alternative(
        build_badge_request_html(subject_name, request_obj.message, request_obj.document_name, approve_url, reject_url),
        "text/html",
    )

    file_path = request_obj.document_path
    if os.path.exists(file_path):
        with open(file_path, "rb") as document_file:
            email.attach(request_obj.document_name, document_file.read())

    email.send(fail_silently=True)
