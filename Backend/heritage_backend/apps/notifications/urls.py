"""URL configuration for the notifications app."""

from __future__ import annotations

from django.urls import path

from .views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    UnreadCountView,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/unread-count/", UnreadCountView.as_view(), name="notifications-unread-count"),
    path("notifications/read-all/", NotificationMarkAllReadView.as_view(), name="notifications-read-all"),
    path("notifications/<str:notification_id>/read/", NotificationMarkReadView.as_view(), name="notifications-mark-read"),
]
