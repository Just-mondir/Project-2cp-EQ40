"""URL configuration for the posts app."""

from __future__ import annotations

from django.urls import path

from .views import (
    CommentDetailView,
    CommentListCreateView,
    GemToggleView,
    CommentGemToggleView,
    MySavedPostsView,
    PostDetailView,
    PostImageUploadView,
    PostListCreateView,
    SaveToggleView,
    MyGemedPostsView,
    UserEventsPostsView,
    UserAlertsPostsView,
    EventsView,
    UpcomingEventsView,
    UserPostsView,
    PostImageDeleteView,
    EventFilterView,
    GlobalSearchView,
    AnnotationListCreateView,
    AnnotationDetailView,
    AnnotationAcceptView,
    AnnotationRejectView,
    FilterChoicesView,
    PostFilterView,
)

urlpatterns = [
    # Feed
    path("posts/", PostListCreateView.as_view(), name="post-list-create"),
    path("posts/search/", GlobalSearchView.as_view(), name="global-search"),
    path("posts/filter-choices/", FilterChoicesView.as_view(), name="posts-filter-choices"),  # ← ICI en haut
    path("posts/filter/", PostFilterView.as_view(), name="posts-filter"),
    
    # Events Feed
    path("posts/events/", EventsView.as_view(), name="events"),
    path("posts/upcoming-events/", UpcomingEventsView.as_view(), name="upcoming-events"),
    path("posts/events/filter/", EventFilterView.as_view(), name="events-filter"),

    # Profile
    path("posts/saved/", MySavedPostsView.as_view(), name="saved-posts"),
    path("posts/gemed/", MyGemedPostsView.as_view(), name="gemed-posts"),
    path("posts/user/<str:username>/", UserPostsView.as_view(), name="user-posts"),
    path("posts/user/<str:username>/events/", UserEventsPostsView.as_view(), name="user-events"),
    path("posts/user/<str:username>/alerts/", UserAlertsPostsView.as_view(), name="user-alerts"),

    # Images
    path("posts/images/<str:pk>/", PostImageDeleteView.as_view(), name="post-image-delete"),
    path("posts/<str:pk>/images/", PostImageUploadView.as_view(), name="post-images"),

    # Reactions
    path("posts/<str:pk>/gem/", GemToggleView.as_view(), name="post-gem"),
    path("posts/<str:pk>/save/", SaveToggleView.as_view(), name="post-save"),

    # Comments
    path("posts/<str:pk>/comments/", CommentListCreateView.as_view(), name="post-comments"),
    path("posts/comments/<str:pk>/", CommentDetailView.as_view(), name="comment-detail"),
    path("posts/comments/<str:pk>/gem/", CommentGemToggleView.as_view(), name="comment-gem"),

    # Annotations
    path("posts/<str:post_id>/annotations/", AnnotationListCreateView.as_view(), name="post-annotations"),
    path("posts/<str:post_id>/annotations/<str:annotation_id>/", AnnotationDetailView.as_view(), name="annotation-detail"),
    path("posts/<str:post_id>/annotations/<str:annotation_id>/accept/", AnnotationAcceptView.as_view(), name="annotation-accept"),
    path("posts/<str:post_id>/annotations/<str:annotation_id>/reject/", AnnotationRejectView.as_view(), name="annotation-reject"),

    # Post detail 
    path("posts/<str:pk>/", PostDetailView.as_view(), name="post-detail"),
]