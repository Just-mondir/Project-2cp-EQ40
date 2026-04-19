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
            title="Hidden post",
            content="Secret content",
            post_type="question",
            group_id="group-1",
            group_visibility="group_only",
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

    @patch("apps.posts.serializers.user_can_access_group", return_value=False)
    def test_unavailable_group_post_uses_placeholder(self, mock_can_access):
        serializer = PostListSerializer(self.post, context={"request": self.request})
        self.assertFalse(serializer.get_is_available(self.post))
        self.assertEqual(serializer.get_title(self.post), "Unavailable")
        self.assertEqual(serializer.get_content(self.post), "Rejoin the group to access this post.")

    @patch("apps.posts.serializers.user_can_access_group", return_value=True)
    def test_available_group_post_keeps_original_content(self, mock_can_access):
        serializer = PostDetailSerializer(self.post, context={"request": self.request})
        self.assertTrue(serializer.get_is_available(self.post))
        self.assertEqual(self.post.title, "Hidden post")
        self.assertEqual(self.post.content, "Secret content")

    @patch("apps.posts.serializers.user_can_access_group", return_value=True)
    def test_create_serializer_accepts_title_and_content_inputs(self, mock_can_access):
        serializer = PostDetailSerializer(
            data={
                "title": "New Post",
                "content": "New content",
                "post_type": "question",
                "group_id": "group-1",
                "group_visibility": "group_only",
                "visibility": "groups",
            },
            context={"request": self.request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    @patch("apps.posts.serializers._get_user_by_id")
    def test_post_serializer_includes_user_profile_picture(self, mock_get_user):
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
