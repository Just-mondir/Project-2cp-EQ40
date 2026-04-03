from __future__ import annotations

from django.test import SimpleTestCase

from apps.users.models import User


class UserModerationFieldTests(SimpleTestCase):
    def test_user_model_exposes_moderation_fields(self):
        user = User(moderation_status="suspended", moderation_reason="policy", is_active=False)
        self.assertTrue(user.is_moderated_out)
        self.assertEqual(user.moderation_reason, "policy")
