from __future__ import annotations

from django.test import SimpleTestCase

from apps.thematic_groups.serializers import GroupActionSerializer, GroupInvitationResponseSerializer


class ThematicGroupSerializerTests(SimpleTestCase):
    def test_join_request_action_serializer_valid(self):
        serializer = GroupActionSerializer(data={"status": "approved", "note": "ok"})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invitation_response_serializer_valid(self):
        serializer = GroupInvitationResponseSerializer(data={"status": "accepted"})
        self.assertTrue(serializer.is_valid(), serializer.errors)
