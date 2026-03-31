"""URL configuration for the posts app."""

from __future__ import annotations

from django.urls import path

from .views import (
    PlatformStatsView,
    UserListView,
    TrackVisitorView
)

urlpatterns = [
    # Statistics
    path("stats/", PlatformStatsView.as_view(), name="platform-stats"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("visitors-track/", TrackVisitorView.as_view(), name="track-visitor")
]
