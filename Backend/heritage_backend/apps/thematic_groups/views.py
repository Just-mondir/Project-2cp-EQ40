"""Views for thematic groups."""

from __future__ import annotations

from collections import defaultdict

from bson import ObjectId
from bson.errors import InvalidId
from django.utils import timezone
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardResultsSetPagination
from apps.core.responses import api_error, api_success
from apps.posts.models import Post, PostImage
from apps.posts.serializers import PostDetailSerializer, PostListSerializer
from apps.posts.utils import upload_to_cloudinary
from apps.notifications.registry import notify
from apps.users.models import User
from django.conf import settings
import os

from .models import GroupInvitation, GroupJoinRequest, GroupMembership, ThematicGroup
from .serializers import (
    GroupActionSerializer,
    GroupInvitationResponseSerializer,
    GroupInvitationSerializer,
    GroupJoinRequestSerializer,
    GroupMemberSerializer,
    ThematicGroupSerializer,
    ThematicGroupWriteSerializer,
)
from .services import get_group_by_id, user_can_access_group, user_is_group_admin, user_is_group_member


def _paginate(queryset, request: Request, serializer_cls):
    paginator = StandardResultsSetPagination()
    page_size = paginator.get_page_size(request)
    page_number = int(request.query_params.get(paginator.page_query_param, 1))
    start = (page_number - 1) * page_size
    end = start + page_size
    total = queryset.count()
    items = list(queryset[start:end])
    serializer = serializer_cls(items, many=True, context={"request": request})
    return Response(
        {
            "success": True,
            "message": "Results retrieved successfully.",
            "data": {"count": total, "next": None, "previous": None, "results": serializer.data},
        }
    )


def _group_member_counts() -> dict[str, int]:
    """Return a mapping of group id to membership count."""
    counts = defaultdict(int)
    pipeline = [
        {"$group": {"_id": "$group", "count": {"$sum": 1}}},
    ]
    for row in GroupMembership.objects.aggregate(pipeline):
        group_id = row.get("_id")
        if group_id is not None:
            counts[str(group_id)] = row.get("count", 0)
    return dict(counts)


def _filter_public_group_posts(posts):
    """Return only publicly visible group posts."""
    return posts.filter(group_visibility__ne="group_only")


def _save_group_section_post_images(post: Post, image_files) -> None:
    existing_count = PostImage.objects(post=post).count()
    allowed = 5 - existing_count
    for image in list(image_files)[:allowed]:
        url = upload_to_cloudinary(image, folder="posts")
        PostImage(post=post, image=url).save()


class ThematicGroupListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        qs = ThematicGroup.objects.all()
        category = request.query_params.get("category", "").strip()
        if category:
            qs = qs.filter(category=category)
        return _paginate(qs.order_by("-created_at"), request, ThematicGroupSerializer)

    def post(self, request: Request) -> Response:
        if not request.user.is_authenticated:
            return api_error("Authentication required.", status_code=status.HTTP_401_UNAUTHORIZED)
        serializer = ThematicGroupWriteSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        group = serializer.save()
        return api_success("Group created successfully.", ThematicGroupSerializer(group, context={"request": request}).data, status_code=status.HTTP_201_CREATED)


class ThematicGroupDetailView(APIView):
    permission_classes = [AllowAny]

    def _get_group(self, group_id: str):
        try:
            return ThematicGroup.objects.get(id=ObjectId(group_id))
        except (ThematicGroup.DoesNotExist, InvalidId):
            return None

    def get(self, request: Request, group_id: str) -> Response:
        group = self._get_group(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        return api_success("Group retrieved successfully.", ThematicGroupSerializer(group, context={"request": request}).data)

    def patch(self, request: Request, group_id: str) -> Response:
        group = self._get_group(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not request.user.is_authenticated or not user_is_group_admin(str(request.user.id), group):
            return api_error("Only the group admin can update this group.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = ThematicGroupWriteSerializer(group, data=request.data, partial=True, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        group = serializer.save()
        return api_success("Group updated successfully.", ThematicGroupSerializer(group, context={"request": request}).data)


class GroupMembersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        members = GroupMembership.objects(group=group)
        users = []
        for membership in members:
            try:
                user = User.objects.get(id=membership.user_id)
            except Exception:
                continue
            users.append({
                "id": str(user.id),
                "username": user.username,
                "display_name": user.display_name,
                "profile_picture": user.profile_picture,
                "badge": user.badge,
            })
        serializer = GroupMemberSerializer(users, many=True)
        return api_success("Members retrieved successfully.", serializer.data)


class GroupJoinRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        user_id = str(request.user.id)
        if user_can_access_group(user_id, group):
            return api_error("You are already a member of this group.", status_code=status.HTTP_409_CONFLICT)
        if GroupJoinRequest.objects(group=group, requester_id=user_id, status="pending").count() > 0:
            return api_error("You already have a pending request for this group.", status_code=status.HTTP_409_CONFLICT)
        join_request = GroupJoinRequest(group=group, requester_id=user_id)
        join_request.save()
        return api_success("Join request submitted.", GroupJoinRequestSerializer(join_request).data, status_code=status.HTTP_201_CREATED)


class GroupJoinRequestReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request: Request, group_id: str, request_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not user_is_group_admin(str(request.user.id), group):
            return api_error("Only the group admin can review requests.", status_code=status.HTTP_403_FORBIDDEN)
        try:
            join_request = GroupJoinRequest.objects.get(id=ObjectId(request_id), group=group)
        except (GroupJoinRequest.DoesNotExist, InvalidId):
            return api_error("Join request not found.", status_code=status.HTTP_404_NOT_FOUND)
        serializer = GroupActionSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        status_value = serializer.validated_data["status"]
        join_request.status = status_value
        join_request.reviewed_by_id = str(request.user.id)
        join_request.reviewed_at = timezone.now()
        join_request.save()
        if status_value == "approved":
            existing_membership = GroupMembership.objects(group=group, user_id=join_request.requester_id).first()
            if not existing_membership:
                GroupMembership(group=group, user_id=join_request.requester_id).save()
        return api_success("Join request reviewed successfully.", GroupJoinRequestSerializer(join_request).data)


class GroupInvitationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not user_can_access_group(str(request.user.id), group):
            return api_error("Only members can invite users.", status_code=status.HTTP_403_FORBIDDEN)
        recipient_id = str(request.data.get("recipient_id", "")).strip()
        if not recipient_id:
            return api_error("recipient_id is required.", status_code=status.HTTP_400_BAD_REQUEST)
        if recipient_id == str(request.user.id):
            return api_error("You cannot invite yourself.", status_code=status.HTTP_400_BAD_REQUEST)
        invitation = GroupInvitation(group=group, sender_id=str(request.user.id), recipient_id=recipient_id)
        invitation.save()
        notify(
            event_type="group_invite_received",
            actor_id=str(request.user.id),
            actor_name=getattr(request.user, "display_name", "Someone"),
            recipient_id=recipient_id,
            target_type="group",
            target_id=str(group.id),
            group_name=group.name,
        )
        return api_success("Invitation sent successfully.", GroupInvitationSerializer(invitation).data, status_code=status.HTTP_201_CREATED)


class GroupInvitationResponseView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request: Request, invitation_id: str) -> Response:
        try:
            invitation = GroupInvitation.objects.get(id=ObjectId(invitation_id), recipient_id=str(request.user.id))
        except (GroupInvitation.DoesNotExist, InvalidId):
            return api_error("Invitation not found.", status_code=status.HTTP_404_NOT_FOUND)
        serializer = GroupInvitationResponseSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        status_value = serializer.validated_data["status"]
        invitation.status = status_value
        invitation.responded_at = timezone.now()
        invitation.save()
        if status_value == "accepted":
            pending_request = GroupJoinRequest.objects(group=invitation.group, requester_id=str(request.user.id), status="pending").first()
            if not pending_request:
                GroupJoinRequest(group=invitation.group, requester_id=str(request.user.id)).save()
        return api_success("Invitation updated successfully.", GroupInvitationSerializer(invitation).data)


class LeaveGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        membership = GroupMembership.objects(group=group, user_id=str(request.user.id)).first()
        if not membership:
            return api_error("You are not a member of this group.", status_code=status.HTTP_400_BAD_REQUEST)
        if user_is_group_admin(str(request.user.id), group):
            return api_error("The admin cannot leave the group without transferring ownership.", status_code=status.HTTP_400_BAD_REQUEST)
        membership.delete()
        return api_success("You left the group successfully.", data=None)


class GroupPostListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _save_post_images(self, post: Post, image_files) -> None:
        existing_count = PostImage.objects(post=post).count()
        allowed = 5 - existing_count
        for image in list(image_files)[:allowed]:
            safe_name = f"{post.id}_{image.name}"
            file_path = os.path.join(settings.MEDIA_ROOT, "post_images", safe_name)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "wb+") as output_file:
                for chunk in image.chunks():
                    output_file.write(chunk)
            image_url = f"{settings.MEDIA_URL}post_images/{safe_name}"
            PostImage(post=post, image=image_url).save()

    def _get_group(self, group_id: str):
        return get_group_by_id(group_id)

    def get(self, request: Request, group_id: str) -> Response:
        group = self._get_group(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        posts = Post.objects(group_id=str(group.id), is_deleted=False)
        posts = _filter_public_group_posts(posts).order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class GroupSectionPostCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not user_can_access_group(str(request.user.id), group):
            return api_error("You do not have access to this group.", status_code=status.HTTP_403_FORBIDDEN)

        payload = request.data.copy()
        requested_visibility = str(payload.get("visibility", "public")).strip().lower()
        if requested_visibility not in {"public", "private_to_group"}:
            return api_error(
                "Validation failed.",
                {"visibility": "Visibility must be either 'public' or 'private_to_group'."},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        payload["group_id"] = str(group.id)
        payload["visibility"] = "groups"
        payload["group_visibility"] = "group_only" if requested_visibility == "private_to_group" else "public"

        serializer = PostDetailSerializer(data=payload, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        post = serializer.save(author_id=str(request.user.id))
        image_files = request.FILES.getlist("uploaded_images")
        if image_files:
            _save_group_section_post_images(post, image_files)

        response_data = PostDetailSerializer(post, context={"request": request}).data
        response_data["visibility"] = requested_visibility
        return api_success("Group section post created successfully.", response_data, status_code=status.HTTP_201_CREATED)


class GroupQuestionPostListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)

        posts = Post.objects(
            group_id=str(group.id),
            post_type="question",
            is_deleted=False,
        )
        posts = _filter_public_group_posts(posts).order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class GroupUserPostListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)

        posts = Post.objects(
            group_id=str(group.id),
            author_id=str(request.user.id),
            is_deleted=False,
        ).order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class PublicGroupsPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        posts = Post.objects(group_id__ne="", is_deleted=False)
        posts = _filter_public_group_posts(posts).order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class PopularGroupsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        groups = list(ThematicGroup.objects.all())
        member_counts = _group_member_counts()
        groups.sort(
            key=lambda group: (
                -member_counts.get(str(group.id), 0),
                -(group.created_at.timestamp() if getattr(group, "created_at", None) else 0),
            )
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(groups, request)
        serializer = ThematicGroupSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MyGroupsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request: Request) -> Response:
        memberships = GroupMembership.objects(user_id=str(request.user.id))
        group_ids = []
        for membership in memberships:
            try:
                group = membership.group
            except Exception:
                continue
            if group is not None:
                group_ids.append(group.id)
        groups = ThematicGroup.objects(id__in=group_ids).order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(groups, request)
        serializer = ThematicGroupSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)
    
class SuggestedGroupsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        memberships = GroupMembership.objects(user_id=str(request.user.id))
        joined_group_ids = []
        joined_groups = []
        for membership in memberships:
            try:
                group = membership.group
            except Exception:
                continue
            if group is None:
                continue
            joined_group_ids.append(group.id)
            joined_groups.append(group)

        categories = {group.category for group in joined_groups if getattr(group, "category", "")}
        if not categories:
            return api_success("Suggested groups retrieved successfully.", [])

        suggested_groups = ThematicGroup.objects(category__in=list(categories), id__nin=joined_group_ids)
        suggested_groups = list(suggested_groups)
        member_counts = _group_member_counts()
        suggested_groups.sort(
            key=lambda group: (
                -member_counts.get(str(group.id), 0),
                -(group.created_at.timestamp() if getattr(group, "created_at", None) else 0),
            )
        )
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(suggested_groups, request)
        serializer = ThematicGroupSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

