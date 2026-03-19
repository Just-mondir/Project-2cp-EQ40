"""URL configuration for the posts app."""

from __future__ import annotations

from django.urls import path

from .views import (
    CommentDetailView,
    CommentListCreateView,
    GemToggleView,
    CommentGemToggleView,
    MyPostsView,
    MySavedPostsView,
    PostDetailView,
    PostImageUploadView,
    PostListCreateView,
    SaveToggleView,
    MyGemedPostsView,
    MyEventsPostsView,
    MyAlertsPostsView,
    EventsView,
    UpcomingEventsView
)

urlpatterns = [
    # Feed
    path("posts/", PostListCreateView.as_view(), name="post-list-create"),

    # Events Feed
    path("posts/events/", EventsView.as_view(), name="events"),
    path("posts/upcoming-events/", UpcomingEventsView.as_view(), name="upcoming-events"),

    # Profile
    path("posts/me/", MyPostsView.as_view(), name="my-posts"),
    path("posts/saved/", MySavedPostsView.as_view(), name="saved-posts"),
    path("posts/gemed/", MyGemedPostsView.as_view(), name="gemed-posts"),
    path("posts/myevents/", MyEventsPostsView.as_view(), name="myevents"),
    path("posts/myalerts/", MyAlertsPostsView.as_view(), name="myalerts"),

    # Post detail
    path("posts/<str:pk>/", PostDetailView.as_view(), name="post-detail"),

    # Images
    path("posts/<str:pk>/images/", PostImageUploadView.as_view(), name="post-images"),

    # Reactions
    path("posts/<str:pk>/gem/", GemToggleView.as_view(), name="post-gem"),
    path("posts/<str:pk>/save/", SaveToggleView.as_view(), name="post-save"),

    # Comments
    path("posts/<str:pk>/comments/", CommentListCreateView.as_view(), name="post-comments"),
    path("posts/comments/<str:pk>/", CommentDetailView.as_view(), name="comment-detail"),
    path("posts/comments/<str:pk>/gem/", CommentGemToggleView.as_view(), name="comment-gem"),
]
