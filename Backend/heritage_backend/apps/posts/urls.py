"""URL configuration for the posts app."""

from __future__ import annotations

from django.urls import path

from .views import (
    CommentDetailView,
    CommentListCreateView,
    GemToggleView,
    MyPostsView,
    MySavedPostsView,
    PostDetailView,
    PostImageUploadView,
    PostListCreateView,
    SaveToggleView,
)

urlpatterns = [
    # Feed
    path("posts/", PostListCreateView.as_view(), name="post-list-create"),
    path("posts/me/", MyPostsView.as_view(), name="my-posts"),
    path("posts/saved/", MySavedPostsView.as_view(), name="saved-posts"),

    # Post detail
    path("posts/<int:pk>/", PostDetailView.as_view(), name="post-detail"),

    # Images
    path("posts/<int:pk>/images/", PostImageUploadView.as_view(), name="post-images"),

    # Reactions
    path("posts/<int:pk>/gem/", GemToggleView.as_view(), name="post-gem"),
    path("posts/<int:pk>/save/", SaveToggleView.as_view(), name="post-save"),

    # Comments
    path("posts/<int:pk>/comments/", CommentListCreateView.as_view(), name="post-comments"),
    path("posts/comments/<int:pk>/", CommentDetailView.as_view(), name="comment-detail"),
]
