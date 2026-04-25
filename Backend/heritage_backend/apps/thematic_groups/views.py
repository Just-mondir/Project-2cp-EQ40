""""Views for thematic groups."""

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
    GroupPostDetailSerializer,
    GroupPostListSerializer,
    ThematicGroupSerializer,
    ThematicGroupWriteSerializer,
)
from .services import (
    get_group_by_id,
    user_can_access_group,
    user_is_group_admin,
    user_is_group_member,
    send_join_request_email,
    decode_join_review_token,
)


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


def _search_query(query: str, fields: list[str]) -> dict:
    """Build a case-insensitive Mongo regex OR query."""
    return {
        "$or": [
            {field: {"$regex": query, "$options": "i"}}
            for field in fields
        ]
    }


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


class GroupSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        query = request.query_params.get("q", "").strip()
        groups = ThematicGroup.objects.all()
        if query:
            groups = groups.filter(
                __raw__=_search_query(
                    query,
                    ["name", "description", "historical_period", "region", "category"],
                )
            )
        groups = groups.order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(groups, request)
        serializer = ThematicGroupSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class GroupUserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        query = request.query_params.get("q", "").strip()
        users = User.objects(is_active=True)
        if query:
            users = users.filter(
                __raw__=_search_query(query, ["username", "display_name"])
            )
        users = users.order_by("display_name", "username")

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(users, request)
        data = [
            {
                "id": str(user.id),
                "username": user.username,
                "display_name": getattr(user, "display_name", user.username),
                "profile_picture": getattr(user, "profile_picture", ""),
            }
            for user in page
        ]
        return paginator.get_paginated_response(data)


class ThematicGroupDetailView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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

        data = request.data.copy()

        profile_picture_file = request.FILES.get("profile_picture")
        if profile_picture_file:
            data["profile_picture"] = upload_to_cloudinary(profile_picture_file, folder="groups")

        banner_image_file = request.FILES.get("banner_image")
        if banner_image_file:
            data["banner_image"] = upload_to_cloudinary(banner_image_file, folder="groups")

        serializer = ThematicGroupWriteSerializer(group, data=data, partial=True, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        group = serializer.save()
        return api_success("Group updated successfully.", ThematicGroupSerializer(group, context={"request": request}).data)

    def delete(self, request: Request, group_id: str) -> Response:
        group = self._get_group(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not request.user.is_authenticated or not user_is_group_admin(str(request.user.id), group):
            return api_error("Only the group admin can delete this group.", status_code=status.HTTP_403_FORBIDDEN)

        GroupMembership.objects(group=group).delete()
        GroupJoinRequest.objects(group=group).delete()
        GroupInvitation.objects(group=group).delete()
        group.delete()

        return api_success("Group deleted successfully.", data=None, status_code=status.HTTP_204_NO_CONTENT)


class GroupMembersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        requester_is_admin = bool(
            request.user.is_authenticated and user_is_group_admin(str(request.user.id), group)
        )
        members = GroupMembership.objects(group=group)
        users = []
        for membership in members:
            try:
                user = User.objects.get(id=membership.user_id)
            except Exception:
                continue
            is_admin = str(user.id) == str(group.admin_id)
            users.append({
                "id": str(user.id),
                "username": user.username,
                "display_name": getattr(user, "display_name", user.username),
                "profile_picture": getattr(user, "profile_picture", ""),
                "badge": getattr(user, "badge", ""),
                "is_admin": is_admin,
                "role": "admin" if is_admin else "member",
                "can_remove": requester_is_admin and not is_admin,
            })
        users.sort(
            key=lambda user: (
                not user["is_admin"],
                user["display_name"].strip().lower(),
                user["username"].strip().lower(),
            )
        )
        serializer = GroupMemberSerializer(users, many=True)
        return api_success("Members retrieved successfully.", serializer.data)


class GroupMemberRemoveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, group_id: str, member_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not user_is_group_admin(str(request.user.id), group):
            return api_error("Only the group admin can remove members.", status_code=status.HTTP_403_FORBIDDEN)
        if str(member_id) == str(group.admin_id):
            return api_error("The group admin cannot be removed.", status_code=status.HTTP_400_BAD_REQUEST)

        membership = GroupMembership.objects(group=group, user_id=str(member_id)).first()
        if not membership:
            return api_error("Member not found.", status_code=status.HTTP_404_NOT_FOUND)

        membership.delete()
        return api_success("Member removed successfully.", data=None)


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

        # Send email to admin
        try:
            requester_name = getattr(request.user, "display_name", "") or getattr(request.user, "username", "Someone")
            send_join_request_email(group, join_request, requester_name=requester_name)
        except Exception:
            pass

        # Send in-app notification to admin
        try:
            requester_name = getattr(request.user, "display_name", "") or getattr(request.user, "username", "Someone")
            notify(
                event_type="group_join_request",
                actor_id=user_id,
                actor_name=requester_name,
                recipient_id=str(group.admin_id),
                target_type="group",
                target_id=str(group.id),
                group_name=group.name,
                request_id=str(join_request.id),
                invitation_id=str(invitation.id),
            )
        except Exception:
            pass

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
            # Notify user their request was approved
            try:
                notify(
                    event_type="group_join_request_approved",
                    actor_id=str(request.user.id),
                    actor_name=group.name,
                    recipient_id=join_request.requester_id,
                    target_type="group",
                    target_id=str(group.id),
                    group_name=group.name,
                )
            except Exception:
                pass
        elif status_value == "rejected":
            # Notify user their request was rejected
            try:
                notify(
                    event_type="group_join_request_rejected",
                    actor_id=str(request.user.id),
                    actor_name=group.name,
                    recipient_id=join_request.requester_id,
                    target_type="group",
                    target_id=str(group.id),
                    group_name=group.name,
                )
            except Exception:
                pass
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
    invitation_id=str(invitation.id),
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
                new_request = GroupJoinRequest(group=invitation.group, requester_id=str(request.user.id))
                new_request.save()
                # Notify admin that invited user accepted and is waiting for approval
                try:
                    requester_name = getattr(request.user, "display_name", "") or getattr(request.user, "username", "Someone")
                    notify(
                        event_type="group_join_request",
                        actor_id=str(request.user.id),
                        actor_name=requester_name,
                        recipient_id=str(invitation.group.admin_id),
                        target_type="group",
                        target_id=str(invitation.group.id),
                        group_name=invitation.group.name,
                        request_id=str(new_request.id),
                    )
                except Exception:
                    pass
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

    def _get_group(self, group_id: str):
        return get_group_by_id(group_id)

    def get(self, request: Request, group_id: str) -> Response:
        group = self._get_group(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        posts = Post.objects(group_id=str(group.id), is_deleted=False)
        posts = posts.order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = GroupPostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request: Request, group_id: str) -> Response:
        group = self._get_group(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not user_can_access_group(str(request.user.id), group):
            return api_error("You do not have access to this group.", status_code=status.HTTP_403_FORBIDDEN)

        payload = request.data.copy()
        payload["group_id"] = str(group.id)

        serializer = GroupPostDetailSerializer(data=payload, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        post = serializer.save(author_id=str(request.user.id))
        image_files = request.FILES.getlist("uploaded_images")
        if image_files:
            _save_group_section_post_images(post, image_files)

        response_data = GroupPostDetailSerializer(post, context={"request": request}).data
        return api_success("Group section post created successfully.", response_data, status_code=status.HTTP_201_CREATED)


class GroupPostSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)

        query = request.query_params.get("q", "").strip()
        posts = Post.objects(group_id=str(group.id), is_deleted=False)

        if query:
            posts = posts.filter(__raw__=_search_query(query, ["title", "content"]))

        posts = posts.order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = GroupPostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


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
        posts = posts.order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = GroupPostListSerializer(page, many=True, context={"request": request})
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
        serializer = GroupPostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class GroupsPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        posts = Post.objects(group_id__ne="", is_deleted=False)
        posts = posts.order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = GroupPostListSerializer(page, many=True, context={"request": request})
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


class GroupJoinRequestEmailReviewView(APIView):
    """Handle approve/reject of join requests via signed email links."""
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request: Request, group_id: str, token: str) -> Response:
        from django.utils.html import escape

        try:
            request_id, action = decode_join_review_token(token)
        except Exception:
            return api_error("Invalid or expired review link.", status_code=status.HTTP_400_BAD_REQUEST)

        if action not in {"approved", "rejected"}:
            return api_error("Invalid review action.", status_code=status.HTTP_400_BAD_REQUEST)

        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)

        try:
            join_request = GroupJoinRequest.objects.get(id=ObjectId(request_id), group=group)
        except (GroupJoinRequest.DoesNotExist, InvalidId):
            return api_error("Join request not found.", status_code=status.HTTP_404_NOT_FOUND)

        if join_request.status != "pending":
            return api_success(f"Join request was already {escape(join_request.status)}.")

        join_request.status = action
        join_request.reviewed_by_id = "email-link"
        join_request.reviewed_at = timezone.now()
        join_request.save()

        if action == "approved":
            existing = GroupMembership.objects(group=group, user_id=join_request.requester_id).first()
            if not existing:
                GroupMembership(group=group, user_id=join_request.requester_id).save()

        event_type = f"group_join_request_{action}"
        notify(
            event_type=event_type,
            actor_id=str(group.admin_id),
            actor_name=group.name,
            recipient_id=join_request.requester_id,
            target_type="group",
            target_id=str(group.id),
            group_name=group.name,
        )

        return Response(
            {
                "success": True,
                "message": f"Join request {escape(action)} successfully.",
                "data": GroupJoinRequestSerializer(join_request).data,
            }
        )


class GroupAboutView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, group_id: str) -> Response:
        group = get_group_by_id(group_id)
        if not group:
            return api_error("Group not found.", status_code=status.HTTP_404_NOT_FOUND)
        from .serializers import GroupAboutSerializer
        data = GroupAboutSerializer(group, context={"request": request}).data
        return api_success("Group about retrieved successfully.", data)