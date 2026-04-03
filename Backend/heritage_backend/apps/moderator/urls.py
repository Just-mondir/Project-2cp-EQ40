"""URL configuration for the posts app."""

from __future__ import annotations

from django.urls import path

from .views import (
    PlatformStatsView,
    UserListView,
    TrackVisitorView
    ,UserModerationView,
    UserRoleUpdateView,
)

urlpatterns = [
    # Statistics
    path("stats/", PlatformStatsView.as_view(), name="platform-stats"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<str:user_id>/role/", UserRoleUpdateView.as_view(), name="user-role-update"),
    path("users/<str:user_id>/moderate/", UserModerationView.as_view(), name="user-moderate"),
    path("visitors-track/", TrackVisitorView.as_view(), name="track-visitor")
]
