"""URL configuration for thematic groups."""

from __future__ import annotations

from django.urls import path

from .views import (
    GroupInvitationCreateView,
    GroupInvitationResponseView,
    GroupJoinRequestReviewView,
    GroupJoinRequestView,
    GroupMembersView,
    GroupPostListCreateView,
    GroupQuestionPostListView,
    GroupSectionPostCreateView,
    GroupUserPostListView,
    LeaveGroupView,
    MyGroupsView,
    PopularGroupsView,
    PublicGroupsPostsView,
    SuggestedGroupsView,
    ThematicGroupDetailView,
    ThematicGroupListCreateView,
)

urlpatterns = [
    path("groups/", ThematicGroupListCreateView.as_view(), name="groups-list-create"),
    path("groups/public-posts/", PublicGroupsPostsView.as_view(), name="public-groups-posts"),
    path("groups/popular/", PopularGroupsView.as_view(), name="popular-groups"),
    path("groups/my-groups/", MyGroupsView.as_view(), name="my-groups"),
    path("groups/suggested-groups/", SuggestedGroupsView.as_view(), name="suggested-groups"),
    path("groups/<str:group_id>/members/", GroupMembersView.as_view(), name="groups-members"),
    path("groups/<str:group_id>/posts/", GroupPostListCreateView.as_view(), name="groups-posts"),
    path("groups/<str:group_id>/posts/create/", GroupSectionPostCreateView.as_view(), name="groups-section-post-create"),
    path("groups/<str:group_id>/questions/", GroupQuestionPostListView.as_view(), name="groups-question-posts"),
    path("groups/<str:group_id>/my-posts/", GroupUserPostListView.as_view(), name="groups-user-posts"),
    path("groups/<str:group_id>/join/", GroupJoinRequestView.as_view(), name="groups-join"),
    path("groups/<str:group_id>/requests/<str:request_id>/review/", GroupJoinRequestReviewView.as_view(), name="groups-request-review"),
    path("groups/<str:group_id>/invite/", GroupInvitationCreateView.as_view(), name="groups-invite"),
    path("groups/invitations/<str:invitation_id>/respond/", GroupInvitationResponseView.as_view(), name="groups-invitation-respond"),
    path("groups/<str:group_id>/leave/", LeaveGroupView.as_view(), name="groups-leave"),
    path("groups/<str:group_id>/", ThematicGroupDetailView.as_view(), name="groups-detail"),
]
