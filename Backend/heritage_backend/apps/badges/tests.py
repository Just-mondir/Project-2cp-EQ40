from __future__ import annotations

from django.test import SimpleTestCase

from apps.badges.serializers import BadgeRequestReviewSerializer


class BadgeRequestSerializerTests(SimpleTestCase):
    def test_review_serializer_accepts_known_state(self):
        serializer = BadgeRequestReviewSerializer(data={"status": "approved", "moderator_note": "looks good"})
        self.assertTrue(serializer.is_valid(), serializer.errors)
