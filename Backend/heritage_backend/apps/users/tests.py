from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from apps.users.models import User
from apps.users.views import ProfilePictureUploadView


class UserModerationFieldTests(SimpleTestCase):
    def test_user_model_exposes_moderation_fields(self):
        user = User(moderation_status="suspended", moderation_reason="policy", is_active=False)
        self.assertTrue(user.is_moderated_out)
        self.assertEqual(user.moderation_reason, "policy")


class ProfilePictureUploadViewTests(SimpleTestCase):
    @patch("apps.users.views.UserProfileSerializer")
    @patch("apps.users.views.User.objects")
    @patch("apps.users.views.upload_to_cloudinary")
    def test_profile_picture_upload_uses_cloudinary(
        self,
        mock_upload_to_cloudinary,
        mock_user_objects,
        mock_user_profile_serializer,
    ):
        uploaded_file = object()
        cloudinary_url = "https://res.cloudinary.com/demo/image/upload/v1/profile_pictures/user.jpg"

        user = User(
            id="507f1f77bcf86cd799439011",
            email="user@example.com",
            username="amina",
            display_name="Amina",
            profile_picture="",
        )
        user.save = Mock()

        request = SimpleNamespace(
            FILES={"profile_picture": uploaded_file},
            user=SimpleNamespace(id=str(user.id), profile_picture=""),
        )

        mock_upload_to_cloudinary.return_value = cloudinary_url
        mock_user_objects.get.return_value = user
        mock_user_profile_serializer.return_value.data = {
            "profile_picture": cloudinary_url,
        }

        response = ProfilePictureUploadView().post(request)

        mock_upload_to_cloudinary.assert_called_once_with(
            uploaded_file,
            folder="profile_pictures",
        )
        self.assertEqual(user.profile_picture, cloudinary_url)
        self.assertEqual(request.user.profile_picture, cloudinary_url)
        user.save.assert_called_once()
        self.assertEqual(response.status_code, 200)
