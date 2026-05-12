from __future__ import annotations

from types import SimpleNamespace

from django.test import SimpleTestCase

from apps.moderator.permissions import IsModeratorOrAdmin
from apps.moderator.serializers import ModeratorActionSerializer, ModeratorRoleUpdateSerializer


class ModeratorPermissionTests(SimpleTestCase):
    def test_allows_moderator_role(self):
        permission = IsModeratorOrAdmin()
        request = SimpleNamespace(user=SimpleNamespace(is_authenticated=True, role="moderator", is_staff=False))
        self.assertTrue(permission.has_permission(request, None))

    def test_denies_regular_user(self):
        permission = IsModeratorOrAdmin()
        request = SimpleNamespace(user=SimpleNamespace(is_authenticated=True, role="user", is_staff=False))
        self.assertFalse(permission.has_permission(request, None))


class ModeratorSerializerTests(SimpleTestCase):
    def test_role_serializer_accepts_known_role(self):
        serializer = ModeratorRoleUpdateSerializer(data={"role": "admin"})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_suspend_requires_date(self):
        serializer = ModeratorActionSerializer(data={"action": "suspend", "reason": "test"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("suspended_until", serializer.errors)
