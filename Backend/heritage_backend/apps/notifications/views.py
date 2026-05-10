"""DRF views for the notifications app."""

from __future__ import annotations

from bson import ObjectId
from bson.errors import InvalidId
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardResultsSetPagination
from apps.core.responses import api_error, api_success

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    """GET /api/notifications/ — list my notifications (paginated)."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        recipient_id = str(request.user.id)
        qs = Notification.objects(recipient_id=recipient_id, is_deleted=False).order_by("-created_at")

        # Optional filter for unread only
        is_read_filter = request.query_params.get("is_read")
        if is_read_filter is not None:
            if is_read_filter.lower() == "false":
                qs = qs.filter(is_read=False)
            elif is_read_filter.lower() == "true":
                qs = qs.filter(is_read=True)

        paginator = StandardResultsSetPagination()
        page_size = paginator.get_page_size(request)
        page_number = int(request.query_params.get(paginator.page_query_param, 1))
        start = (page_number - 1) * page_size
        end = start + page_size
        total = qs.count()
        page_items = list(qs[start:end])

        serializer = NotificationSerializer(page_items, many=True)

        return Response(
            {
                "success": True,
                "message": "Notifications retrieved successfully.",
                "data": {
                    "count": total,
                    "next": None,  # Simplified for manual MongoEngine pagination
                    "previous": None,
                    "results": serializer.data,
                },
            }
        )


class UnreadCountView(APIView):
    """GET /api/notifications/unread-count/ — lightweight endpoint for polling."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        recipient_id = str(request.user.id)
        count = Notification.objects(recipient_id=recipient_id, is_read=False, is_deleted=False).count()
        return api_success(
            "Unread count retrieved.",
            {"unread_count": count},
        )


class NotificationMarkReadView(APIView):
    """PATCH /api/notifications/<id>/read/ — mark a single notification as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request: Request, notification_id: str) -> Response:
        recipient_id = str(request.user.id)
        try:
            notification = Notification.objects.get(id=ObjectId(notification_id), recipient_id=recipient_id, is_deleted=False)
        except (Notification.DoesNotExist, InvalidId):
            return api_error("Notification not found.", status_code=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()

        return api_success(
            "Notification marked as read.",
            NotificationSerializer(notification).data,
        )


class NotificationMarkAllReadView(APIView):
    """PATCH /api/notifications/read-all/ — mark all unread notifications as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request: Request) -> Response:
        recipient_id = str(request.user.id)
        Notification.objects(recipient_id=recipient_id, is_read=False, is_deleted=False).update(set__is_read=True)
        return api_success("All notifications marked as read.", data=None)
