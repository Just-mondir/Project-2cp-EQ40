from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase

from apps.thematic_groups.serializers import (
    GroupActionSerializer,
    GroupInvitationResponseSerializer,
    GroupPostDetailSerializer,
    GroupPostListSerializer,
)


class ThematicGroupSerializerTests(SimpleTestCase):
    def test_join_request_action_serializer_valid(self):
        serializer = GroupActionSerializer(data={"status": "approved", "note": "ok"})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invitation_response_serializer_valid(self):
        serializer = GroupInvitationResponseSerializer(data={"status": "accepted"})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    @patch("apps.posts.serializers.PostListSerializer.get_alert_details", return_value=None)
    @patch("apps.posts.serializers.PostListSerializer.get_event_details", return_value=None)
    @patch("apps.posts.serializers.PostListSerializer.get_images", return_value=[])
    @patch("apps.posts.serializers.PostListSerializer.get_is_saved", return_value=False)
    @patch("apps.posts.serializers.PostListSerializer.get_is_gemmed", return_value=False)
    @patch("apps.posts.serializers.PostListSerializer.get_accepted_annotations_count", return_value=0)
    @patch("apps.posts.serializers._get_user_by_id", return_value=None)
    def test_group_post_list_serializer_hides_visibility_fields(
        self,
        mock_get_user,
        mock_annotations,
        mock_is_gemmed,
        mock_is_saved,
        mock_images,
        mock_event_details,
        mock_alert_details,
    ):
        post = SimpleNamespace(
            id="post-1",
            author_id="user-1",
            title="Group post",
            content="Visible content",
            post_type="question",
            group_id="group-1",
            group_visibility="public",
            historical_period="",
            monument_type="",
            region="",
            visibility="groups",
            location="",
            gems_count=0,
            comments_count=0,
            is_deleted=False,
            created_at=None,
            updated_at=None,
        )
        request = SimpleNamespace(user=SimpleNamespace(is_authenticated=True, id="viewer-1"))

        data = GroupPostListSerializer(post, context={"request": request}).data

        self.assertNotIn("visibility", data)
        self.assertNotIn("group_visibility", data)

    def test_group_post_detail_serializer_does_not_require_visibility(self):
        request = SimpleNamespace(user=SimpleNamespace(is_authenticated=True, id="viewer-1"))

        serializer = GroupPostDetailSerializer(
            data={
                "title": "New group post",
                "content": "Body",
                "post_type": "question",
                "group_id": "group-1",
            },
            context={"request": request},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
