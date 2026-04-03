from __future__ import annotations

import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from datetime import datetime, timezone as dt_timezone

from django.test import RequestFactory, SimpleTestCase

from apps.badges.models import BadgeRequest
from apps.badges.serializers import BadgeRequestReviewSerializer
from apps.badges.services import build_badge_review_token, send_badge_request_email
from apps.badges.views import BadgeRequestEmailReviewView


class BadgeRequestSerializerTests(SimpleTestCase):
    def test_review_serializer_accepts_known_state(self):
        serializer = BadgeRequestReviewSerializer(data={"status": "approved", "moderator_note": "looks good"})
        self.assertTrue(serializer.is_valid(), serializer.errors)


class BadgeRequestEmailServiceTests(SimpleTestCase):
    def test_send_badge_request_email_attaches_document(self):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(b"fake-document-bytes")
            tmp_path = tmp.name

        request_obj = SimpleNamespace(
            id="request-1",
            message="Please review my expertise",
            status="pending",
            document_name="proof.pdf",
            document_path=tmp_path,
        )

        try:
            with patch("apps.badges.services.get_moderator_emails", return_value=["mod1@example.com", "mod2@example.com"]), patch(
                "apps.badges.services.build_badge_review_url",
                side_effect=["https://example.com/approve", "https://example.com/reject"],
            ), patch("apps.badges.services.EmailMultiAlternatives") as email_message_cls:
                email_instance = email_message_cls.return_value
                send_badge_request_email(request_obj, uploader_name="Tester")

                email_message_cls.assert_called_once()
                kwargs = email_message_cls.call_args.kwargs
                self.assertEqual(kwargs["to"], ["mod1@example.com", "mod2@example.com"])
                email_instance.attach.assert_called_once()
                email_instance.attach_alternative.assert_called_once()
                attach_args = email_instance.attach.call_args.args
                self.assertEqual(attach_args[0], "proof.pdf")
                self.assertEqual(attach_args[1], b"fake-document-bytes")
                email_instance.send.assert_called_once_with(fail_silently=True)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_send_badge_request_email_falls_back_to_someone(self):
        request_obj = SimpleNamespace(
            id="request-2",
            message="",
            status="pending",
            document_name="proof.pdf",
            document_path="/tmp/missing.pdf",
        )

        with patch("apps.badges.services.get_moderator_emails", return_value=["mod@example.com"]), patch(
            "apps.badges.services.build_badge_review_url", return_value="https://example.com/review"
        ), patch("apps.badges.services.EmailMultiAlternatives") as email_message_cls:
            send_badge_request_email(request_obj, uploader_name="")
            subject = email_message_cls.call_args.kwargs["subject"]
            self.assertIn("someone", subject.lower())


class BadgeRequestEmailReviewViewTests(SimpleTestCase):
    def test_email_review_view_approves_request(self):
        request_factory = RequestFactory()
        request_id = "507f1f77bcf86cd799439011"
        token = build_badge_review_token(request_id, "approved")
        request = request_factory.get(f"/api/badge-requests/email-review/{token}/")

        fake_request = SimpleNamespace(
            id=request_id,
            user_id="user-1",
            document_path="/tmp/proof.pdf",
            document_name="proof.pdf",
            message="",
            status="pending",
            moderator_note="",
            reviewed_by_id="",
            created_at=datetime.now(dt_timezone.utc),
            reviewed_at=None,
        )

        fake_request.save = lambda *args, **kwargs: None

        with patch("apps.badges.views.decode_badge_review_token", return_value=(request_id, "approved")), patch(
            "apps.badges.views.BadgeRequest.objects"
        ) as objects_mock:
            objects_mock.get.return_value = fake_request
            response = BadgeRequestEmailReviewView.as_view()(request, token=token)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(fake_request.status, "approved")
        self.assertEqual(fake_request.reviewed_by_id, "email-link")

    def test_email_review_view_rejects_invalid_token(self):
        request_factory = RequestFactory()
        request = request_factory.get("/api/badge-requests/email-review/bad-token/")

        response = BadgeRequestEmailReviewView.as_view()(request, token="bad-token")
        self.assertEqual(response.status_code, 400)
