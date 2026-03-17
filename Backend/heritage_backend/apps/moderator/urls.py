"""URL configuration for the posts app."""

from __future__ import annotations

from django.urls import path

from .views import (
    PlatformStatsView
)

urlpatterns = [
    # Statistics
    path("stats/", PlatformStatsView.as_view(), name="platform-stats"),

]
