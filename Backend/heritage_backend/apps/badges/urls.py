"""URL configuration for badge requests."""

from __future__ import annotations

from django.urls import path

from .views import BadgeRequestDetailView, BadgeRequestEmailReviewView, BadgeRequestListCreateView, BadgeRequestReviewView

urlpatterns = [
    path("badge-requests/", BadgeRequestListCreateView.as_view(), name="badge-requests-list-create"),
    path("badge-requests/<str:request_id>/", BadgeRequestDetailView.as_view(), name="badge-requests-detail"),
    path("badge-requests/<str:request_id>/review/", BadgeRequestReviewView.as_view(), name="badge-requests-review"),
    path("badge-requests/email-review/<str:token>/", BadgeRequestEmailReviewView.as_view(), name="badge-requests-email-review"),
]
