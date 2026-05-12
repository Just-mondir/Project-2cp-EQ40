from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from apps.core.responses import api_error, api_success
from apps.users.models import User
from apps.posts.models import Post
from apps.thematic_groups.models import ThematicGroup
from apps.notifications.registry import notify
from .models import Visitor, PlatformSnapshot
from .permissions import IsModeratorOrAdmin
from .serializers import (
    AnalyticsSnapshotSerializer,
    ModeratorActionSerializer,
    ModeratorRoleUpdateSerializer,
    ModeratorUserSerializer,
)
from django.utils import timezone

class PlatformStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        stats = {
            "members": User.objects(is_deleted=False).count(),
            "groups": ThematicGroup.objects(is_deleted=False).count(),
            "visitors": Visitor.objects(is_deleted=False).count(),
            "posts": Post.objects(is_deleted=False).count(),
        }
        return api_success("Platform stats retrieved.", stats)


class AnalyticsView(APIView):
    permission_classes = [IsModeratorOrAdmin]

    def get(self, request: Request) -> Response:
        range_param = request.query_params.get("range", "30d").lower()
        allowed_ranges = {"7d": 7, "30d": 30, "90d": 90}
        days = allowed_ranges.get(range_param, 30)
        end_date = timezone.now().replace(hour=23, minute=59, second=59, microsecond=999999)
        start_date = end_date - timedelta(days=days - 1)

        snapshots = PlatformSnapshot.objects(date__gte=start_date, is_deleted=False).order_by("date")
        serializer = AnalyticsSnapshotSerializer(snapshots, many=True)
        return api_success("Analytics snapshots retrieved.", serializer.data)


class TrackVisitorView(APIView):
    authentication_classes = []
    permission_classes = []
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
    def post(self, request):
        ip = self.get_client_ip(request)
        today = timezone.now().replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )
        visitor = Visitor.objects(ip_address=ip, date=today, is_deleted=False).first()
        if not visitor:
            Visitor(
                ip_address=ip,
                date=today,
            ).save()
        return Response(
            {"message": "Visitor tracked successfully."},
            status=status.HTTP_200_OK,
        )
    
class UserPagination(PageNumberPagination):
    page_size = 20


class UserListView(APIView):
    permission_classes = [IsModeratorOrAdmin]
    def get(self, request: Request) -> Response:
        query = request.query_params.get("q", "").strip()
        users = User.objects(
            __raw__={
                "$or": [
                    {"is_active": True},
                    {"moderation_status": {"$in": ["suspended", "banned"]}},
                ]
            }
        )
        if query:
            users = users.filter(
                __raw__={
                    "$or": [
                        {"username": {"$regex": query, "$options": "i"}},
                        {"display_name": {"$regex": query, "$options": "i"}},
                    ]
                }
            )
        paginator = UserPagination()
        page = paginator.paginate_queryset(users, request)
        users_data = []
        for user in page:
            post_count = Post.objects(author_id=str(user.id), is_deleted=False).count()
            users_data.append({
                "id": str(user.id),
                "display_name": user.display_name,
                "username": user.username,
                "expertise": user.expertise,
                "profile_picture": user.profile_picture,
                "role": user.role,
                "moderation_status": getattr(user, "moderation_status", "active"),
                "moderation_reason": getattr(user, "moderation_reason", ""),
                "suspended_until": getattr(user, "suspended_until", None),
                "created_at": user.created_at,
                "post_count": post_count,
            })
        serializer = ModeratorUserSerializer(
            users_data, many=True, context={"request": request}
        )
        return paginator.get_paginated_response(serializer.data)


class UserRoleUpdateView(APIView):
    permission_classes = [IsModeratorOrAdmin]

    def patch(self, request: Request, user_id: str) -> Response:
        user = User.objects(id=user_id).first()
        if not user:
            return api_error("User not found.", status_code=status.HTTP_404_NOT_FOUND)

        serializer = ModeratorRoleUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        user.role = serializer.validated_data["role"]
        user.is_staff = user.role in ("moderator", "admin")
        if user.role == "user":
            user.is_staff = False
        user.save()
        return api_success("User role updated successfully.", {"id": str(user.id), "role": user.role, "is_staff": user.is_staff})


class UserModerationView(APIView):
    permission_classes = [IsModeratorOrAdmin]

    def patch(self, request: Request, user_id: str) -> Response:
        user = User.objects(id=user_id).first()
        if not user:
            return api_error("User not found.", status_code=status.HTTP_404_NOT_FOUND)

        serializer = ModeratorActionSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        action = serializer.validated_data["action"]
        reason = serializer.validated_data.get("reason", "")
        suspended_until = serializer.validated_data.get("suspended_until")

        if action == "ban":
            user.moderation_status = "banned"
            user.is_active = False
            user.suspended_until = None
        elif action == "suspend":
            user.moderation_status = "suspended"
            user.is_active = True
            user.suspended_until = suspended_until
        elif action in {"unsuspend", "unban", "reactivate"}:
            user.moderation_status = "active"
            user.is_active = True
            user.suspended_until = None
        else:
            return api_error("Invalid moderation action.", status_code=status.HTTP_400_BAD_REQUEST)

        user.moderation_reason = reason
        user.save()

        notify(
            event_type=f"user_{action}",
            actor_id=str(request.user.id),
            actor_name=getattr(request.user, "display_name", "Moderator"),
            recipient_id=str(user.id),
            target_type="user",
            target_id=str(user.id),
        )

        return api_success(
            "User moderation updated successfully.",
            {
                "id": str(user.id),
                "moderation_status": user.moderation_status,
                "moderation_reason": user.moderation_reason,
                "is_active": user.is_active,
                "suspended_until": user.suspended_until,
            },
        )
