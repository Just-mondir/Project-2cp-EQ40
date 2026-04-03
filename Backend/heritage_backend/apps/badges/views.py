"""Views for badge requests."""

from __future__ import annotations

import os
import uuid

from bson import ObjectId
from bson.errors import InvalidId
from django.conf import settings
from django.utils import timezone
from django.utils.html import escape
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardResultsSetPagination
from apps.core.responses import api_error, api_success
from apps.users.models import User

from .models import BadgeRequest
from .permissions import IsModeratorOrAdmin
from .serializers import BadgeRequestReviewSerializer, BadgeRequestSerializer
from .services import decode_badge_review_token, send_badge_request_email


def _badge_file_path(filename: str) -> str:
    safe_name = f"badge_{uuid.uuid4().hex[:12]}_{filename}"
    path = os.path.join(settings.MEDIA_ROOT, "badge_requests", safe_name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


class BadgeRequestListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request: Request) -> Response:
        if getattr(request.user, "role", None) in ("moderator", "admin") or getattr(request.user, "is_staff", False):
            qs = BadgeRequest.objects.all()
        else:
            qs = BadgeRequest.objects(user_id=str(request.user.id))
        qs = qs.order_by("-created_at")

        paginator = StandardResultsSetPagination()
        page_size = paginator.get_page_size(request)
        page_number = int(request.query_params.get(paginator.page_query_param, 1))
        start = (page_number - 1) * page_size
        end = start + page_size
        total = qs.count()
        page_items = list(qs[start:end])

        serializer = BadgeRequestSerializer(page_items, many=True)
        return Response(
            {
                "success": True,
                "message": "Results retrieved successfully.",
                "data": {"count": total, "next": None, "previous": None, "results": serializer.data},
            }
        )

    def post(self, request: Request) -> Response:
        document = request.FILES.get("document")
        if not document:
            return api_error("A document is required.", status_code=status.HTTP_400_BAD_REQUEST)

        file_path = _badge_file_path(document.name)
        with open(file_path, "wb+") as destination:
            for chunk in document.chunks():
                destination.write(chunk)

        badge_request = BadgeRequest(
            user_id=str(request.user.id),
            document_path=file_path,
            document_name=document.name,
            message=str(request.data.get("message", "")).strip(),
        )
        badge_request.save()

        try:
            uploader_name = getattr(request.user, "display_name", "Someone") or getattr(request.user, "username", "Someone")
            send_badge_request_email(badge_request, uploader_name=uploader_name)
        except Exception:
            pass

        return api_success(
            "Badge request submitted successfully.",
            BadgeRequestSerializer(badge_request).data,
            status_code=status.HTTP_201_CREATED,
        )


class BadgeRequestDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, request_id: str) -> Response:
        try:
            badge_request = BadgeRequest.objects.get(id=ObjectId(request_id))
        except (BadgeRequest.DoesNotExist, InvalidId):
            return api_error("Badge request not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not (getattr(request.user, "role", None) in ("moderator", "admin") or getattr(request.user, "is_staff", False)) and badge_request.user_id != str(request.user.id):
            return api_error("Not allowed.", status_code=status.HTTP_403_FORBIDDEN)
        return api_success("Badge request retrieved successfully.", BadgeRequestSerializer(badge_request).data)


class BadgeRequestReviewView(APIView):
    permission_classes = [IsModeratorOrAdmin]

    def patch(self, request: Request, request_id: str) -> Response:
        try:
            badge_request = BadgeRequest.objects.get(id=ObjectId(request_id))
        except (BadgeRequest.DoesNotExist, InvalidId):
            return api_error("Badge request not found.", status_code=status.HTTP_404_NOT_FOUND)

        serializer = BadgeRequestReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        badge_request.status = serializer.validated_data["status"]
        badge_request.moderator_note = serializer.validated_data.get("moderator_note", "")
        badge_request.reviewed_by_id = str(request.user.id)
        badge_request.reviewed_at = timezone.now()
        badge_request.save()

        return api_success("Badge request reviewed successfully.", BadgeRequestSerializer(badge_request).data)


class BadgeRequestEmailReviewView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request: Request, token: str) -> Response:
        try:
            request_id, action = decode_badge_review_token(token)
        except Exception:
            return api_error("Invalid or expired review link.", status_code=status.HTTP_400_BAD_REQUEST)

        if action not in {"approved", "rejected"}:
            return api_error("Invalid review action.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            badge_request = BadgeRequest.objects.get(id=ObjectId(request_id))
        except (BadgeRequest.DoesNotExist, InvalidId):
            return api_error("Badge request not found.", status_code=status.HTTP_404_NOT_FOUND)

        badge_request.status = action
        badge_request.moderator_note = f"Reviewed via email link: {action}"
        badge_request.reviewed_by_id = "email-link"
        badge_request.reviewed_at = timezone.now()
        badge_request.save()

        return Response(
            {
                "success": True,
                "message": f"Badge request {escape(action)} successfully.",
                "data": BadgeRequestSerializer(badge_request).data,
            }
        )
