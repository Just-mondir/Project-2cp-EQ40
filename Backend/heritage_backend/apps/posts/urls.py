"""URL configuration for the posts app."""
from __future__ import annotations
from django.urls import path
from .views import (
    CommentDetailView,
    CommentListCreateView,
    GemToggleView,
    CommentGemToggleView,
    MySavedPostsView,
    PostGemUsersView,
    PostRepostUsersView,
    MyRepostedPostsView,
    PostDetailView,
    PostAIInsightView,
    PostQuizView,
    PostImageUploadView,
    PostListCreateView,
    SaveToggleView,
    RepostToggleView,
    MyGemedPostsView,
    UserEventsPostsView,
    UserAlertsPostsView,
    EventsView,
    UpcomingEventsView,
    UserPostsView,
    UserRepostedPostsView,
    PostImageDeleteView,
    EventFilterView,
    GlobalSearchView,
    AnnotationListCreateView,
    AnnotationDetailView,
    AnnotationAcceptView,
    AnnotationRejectView,
    FilterChoicesView,
    PostFilterView,
    MonumentsView,
    CriticalView,
    MonumentsInDangerView,
    MobilizationEventCreateView
)
urlpatterns = [
    # Home
    path("posts/", PostListCreateView.as_view(), name="post-list-create"),
    path("posts/search/", GlobalSearchView.as_view(), name="global-search"),
    path("posts/filter-choices/", FilterChoicesView.as_view(), name="posts-filter-choices"),
    path("posts/filter/", PostFilterView.as_view(), name="posts-filter"),

    # Events
    path("posts/events/", EventsView.as_view(), name="events"),
    path("posts/upcoming-events/", UpcomingEventsView.as_view(), name="upcoming-events"),
    path("posts/events/filter/", EventFilterView.as_view(), name="events-filter"),

    # Alerts
    path("posts/alerts/", MonumentsView.as_view(), name="alerts"),
    path("posts/critical/", CriticalView.as_view(), name="critical"),
    path("posts/monuments-danger/", MonumentsInDangerView.as_view(), name="monuments-danger"),
    path("posts/mobilization-event/", MobilizationEventCreateView.as_view(), name="mobilization-event"),
    

    # Profile
    path("posts/saved/", MySavedPostsView.as_view(), name="saved-posts"),
    path("posts/reposts/", MyRepostedPostsView.as_view(), name="reposted-posts"),
    path("posts/gemed/", MyGemedPostsView.as_view(), name="gemed-posts"),
    path("posts/user/<str:username>/", UserPostsView.as_view(), name="user-posts"),
    path("posts/user/<str:username>/reposts/", UserRepostedPostsView.as_view(), name="user-reposts"),
    path("posts/user/<str:username>/events/", UserEventsPostsView.as_view(), name="user-events"),
    path("posts/user/<str:username>/alerts/", UserAlertsPostsView.as_view(), name="user-alerts"),

    path("posts/images/<str:pk>/", PostImageDeleteView.as_view(), name="post-image-delete"),
    path("posts/comments/<str:pk>/", CommentDetailView.as_view(), name="comment-detail"),
    path("posts/comments/<str:pk>/gem/", CommentGemToggleView.as_view(), name="comment-gem"),

    path("posts/<str:pk>/images/", PostImageUploadView.as_view(), name="post-images"),
    path("posts/<str:pk>/ai-insight/", PostAIInsightView.as_view(), name="post-ai-insight"),
    path("posts/<str:pk>/quiz/", PostQuizView.as_view(), name="post-quiz"),
    path("posts/<str:pk>/gems/", PostGemUsersView.as_view(), name="post-gem-users"),
    path("posts/<str:pk>/reposts/users/", PostRepostUsersView.as_view(), name="post-repost-users"),
    path("posts/<str:pk>/gem/", GemToggleView.as_view(), name="post-gem"),
    path("posts/<str:pk>/save/", SaveToggleView.as_view(), name="post-save"),
    path("posts/<str:pk>/repost/", RepostToggleView.as_view(), name="post-repost"),
    path("posts/<str:pk>/comments/", CommentListCreateView.as_view(), name="post-comments"),

    path("posts/<str:post_id>/annotations/", AnnotationListCreateView.as_view(), name="post-annotations"),
    path("posts/<str:post_id>/annotations/<str:annotation_id>/", AnnotationDetailView.as_view(), name="annotation-detail"),
    path("posts/<str:post_id>/annotations/<str:annotation_id>/accept/", AnnotationAcceptView.as_view(), name="annotation-accept"),
    path("posts/<str:post_id>/annotations/<str:annotation_id>/reject/", AnnotationRejectView.as_view(), name="annotation-reject"),

    path("posts/<str:pk>/", PostDetailView.as_view(), name="post-detail"),
]
