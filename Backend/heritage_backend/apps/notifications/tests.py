from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from apps.notifications.views import NotificationListView, NotificationMarkReadView


class NotificationSerializerTests(SimpleTestCase):
    @patch("apps.notifications.serializers._get_user")
    def test_serializer_exposes_actor_fields(self, mock_get_user):
        mock_get_user.return_value = SimpleNamespace(
            display_name="Amina",
            username="amina",
            profile_picture="/media/amina.jpg",
            email="amina@example.com",
        )
        item = SimpleNamespace(
            id="abc123",
            recipient_id="user-1",
            actor_id="user-2",
            event_type="gem_on_post",
            target_type="post",
            target_id="post-1",
            message="Amina liked your post",
            is_read=False,
            created_at=timezone.now(),
        )
        serializer = NotificationSerializer(item)
        data = serializer.data
        self.assertEqual(data["actor_display_name"], "Amina")
        self.assertEqual(data["actor_username"], "amina")
        self.assertEqual(data["actor_profile_picture"], "/media/amina.jpg")
        self.assertEqual(data["event_label"], "liked your post")

    def test_serializer_labels_repost_notifications(self):
        item = SimpleNamespace(
            id="abc123",
            recipient_id="user-1",
            actor_id="user-2",
            event_type="repost_on_post",
            target_type="post",
            target_id="post-1",
            message="Amina reposted your post",
            is_read=False,
            created_at=timezone.now(),
        )

        serializer = NotificationSerializer(item)

        self.assertEqual(serializer.data["event_label"], "reposted your post")


class NotificationViewSmokeTests(SimpleTestCase):
    def setUp(self):
        Notification.objects.delete()
        self.factory = APIRequestFactory()
        self.user = SimpleNamespace(id="recipient-1", is_authenticated=True)

    def tearDown(self):
        Notification.objects.delete()

    def test_list_view_returns_user_notifications(self):
        Notification(
            recipient_id="recipient-1",
            actor_id="actor-1",
            event_type="gem_on_post",
            target_type="post",
            target_id="post-1",
            message="Someone liked your post",
            is_read=False,
        ).save()

        request = self.factory.get("/api/notifications/")
        force_authenticate(request, user=self.user)
        response = NotificationListView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["count"], 1)

    def test_mark_read_view_marks_notification(self):
        notification = Notification(
            recipient_id="recipient-1",
            actor_id="actor-1",
            event_type="gem_on_post",
            target_type="post",
            target_id="post-1",
            message="Someone liked your post",
            is_read=False,
        )
        notification.save()

        request = self.factory.patch(f"/api/notifications/{notification.id}/read/")
        force_authenticate(request, user=self.user)
        response = NotificationMarkReadView.as_view()(request, notification_id=str(notification.id))

        self.assertEqual(response.status_code, 200)
        reloaded = Notification.objects.get(id=notification.id)
        self.assertTrue(reloaded.is_read)
