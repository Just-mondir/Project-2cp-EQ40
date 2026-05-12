from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch
from django.test import SimpleTestCase

from apps.posts.serializers import PostDetailSerializer, PostListSerializer
from apps.users.models import User


class PostSerializerAccessTests(SimpleTestCase):
    def setUp(self):
        self.post = SimpleNamespace(
            id="post-1",
            author_id="user-1",
            title="Group post",
            content="Visible content",
            post_type="question",
            group_id="group-1",
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
        self.request = SimpleNamespace(user=SimpleNamespace(is_authenticated=True, id="viewer-1"))

    @patch("apps.posts.serializers.PostListSerializer.get_alert_details", return_value=None)
    @patch("apps.posts.serializers.PostListSerializer.get_event_details", return_value=None)
    @patch("apps.posts.serializers.PostListSerializer.get_images", return_value=[])
    @patch("apps.posts.serializers.PostListSerializer.get_is_saved", return_value=False)
    @patch("apps.posts.serializers.PostListSerializer.get_is_gemmed", return_value=False)
    @patch("apps.posts.serializers.PostListSerializer.get_accepted_annotations_count", return_value=0)
    @patch("apps.posts.serializers._get_user_by_id", return_value=None)
    def test_group_post_is_always_available_in_list_serializer(
        self,
        mock_get_user,
        mock_annotations,
        mock_is_gemmed,
        mock_is_saved,
        mock_images,
        mock_event_details,
        mock_alert_details,
    ):
        serializer = PostListSerializer(self.post, context={"request": self.request})
        self.assertTrue(serializer.get_is_available(self.post))
        self.assertEqual(serializer.get_title(self.post), "Group post")
        self.assertEqual(serializer.data["content"], "Visible content")

    def test_group_post_detail_serializer_keeps_original_content(self):
        serializer = PostDetailSerializer(self.post, context={"request": self.request})
        self.assertTrue(serializer.get_is_available(self.post))
        self.assertEqual(self.post.title, "Group post")
        self.assertEqual(self.post.content, "Visible content")

    def test_create_serializer_accepts_title_and_content_inputs(self):
        serializer = PostDetailSerializer(
            data={
                "title": "New Post",
                "content": "New content",
                "post_type": "question",
                "group_id": "group-1",
                "visibility": "groups",
            },
            context={"request": self.request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_post_serializer_includes_user_profile_picture(self):
        with patch("apps.posts.serializers._get_user_by_id") as mock_get_user:
            mock_get_user.return_value = User(
                id="user-1",
                email="user@example.com",
                username="amina",
                display_name="Amina",
                profile_picture="/media/profile_pictures/amina.jpg",
            )

            serializer = PostListSerializer(self.post, context={"request": self.request})

            self.assertEqual(
                serializer.get_user_profile_picture(self.post),
                "/media/profile_pictures/amina.jpg",
            )
