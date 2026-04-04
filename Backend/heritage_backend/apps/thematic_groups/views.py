"""Views for thematic groups."""

from __future__ import annotations

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
        if not user_can_access_group(str(request.user.id), group):
            return api_error("You do not have access to this group.", status_code=status.HTTP_403_FORBIDDEN)
        posts = Post.objects(group_id=str(group.id), is_deleted=False).order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request: Request, group_id: str) -> Response:
        group = self._get_group(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not user_can_access_group(str(request.user.id), group):
            return api_error("You do not have access to this group.", status_code=status.HTTP_403_FORBIDDEN)

        payload = request.data.copy()
        payload["group_id"] = str(group.id)
        payload.setdefault("visibility", "groups")
        payload.setdefault("group_visibility", "group_only")

        serializer = PostDetailSerializer(data=payload, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        post = serializer.save(author_id=str(request.user.id))
        image_files = request.FILES.getlist("uploaded_images")
        if image_files:
            self._save_post_images(post, image_files)
        return api_success("Group post created successfully.", PostDetailSerializer(post, context={"request": request}).data, status_code=status.HTTP_201_CREATED)

class PublicGroupsPostsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        posts = Post.objects.filter(group__visibility="public",is_deleted=False).order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)
    
class MyGroupsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request: Request) -> Response:
        memberships = GroupMembership.objects.filter(user_id=request.user.id)
        group_ids = [membership.group_id for membership in memberships]
        groups = ThematicGroup.objects.filter(id__in=group_ids)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(groups, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)
    
class SuggestedGroupsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        memberships = GroupMembership.objects.filter(user_id=request.user.id)
        group_ids = [membership.group_id for membership in memberships]
        groups = ThematicGroup.objects.filter(id__in=group_ids)
        categories = set(group.category for group in groups)
        suggested_groups = ThematicGroup.objects.filter(category__in=categories).exclude(id__in=group_ids)
        suggested_groups = suggested_groups.order_by('-members_count')
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(suggested_groups, request)
        serializer = ThematicGroupSerializer(page, many=True, context={"request": request})
        return api_success("Suggested groups retrieved successfully.", serializer.data)    