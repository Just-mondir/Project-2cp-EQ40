"""DRF views for the reports app."""

from __future__ import annotations

from bson import ObjectId
from bson.errors import InvalidId
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardResultsSetPagination
from apps.core.responses import api_error, api_success

from .models import Report
from .permissions import IsModeratorOrAdmin
from .serializers import ReportCreateSerializer, ReportResolveSerializer, ReportSerializer


# ---------------------------------------------------------------------------
# POST /api/reports/  (auth)  +  GET /api/reports/  (mod)
# ---------------------------------------------------------------------------


class ReportListCreateView(APIView):
    """POST — submit a report (any authenticated user).
    GET  — list all reports with optional filters (moderator/admin only).
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsModeratorOrAdmin()]
        return [IsAuthenticated()]

    # ----- Moderator: list all reports -----
    def get(self, request: Request) -> Response:
        qs = Report.objects.all()

        # Optional filters
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        target_type_filter = request.query_params.get("target_type")
        if target_type_filter:
            qs = qs.filter(target_type=target_type_filter)

        qs = qs.order_by("-created_at")

        # Manual pagination (MongoEngine queryset is not a Django queryset)
        paginator = StandardResultsSetPagination()
        page_size = paginator.get_page_size(request)
        page_number = int(request.query_params.get(paginator.page_query_param, 1))
        start = (page_number - 1) * page_size
        end = start + page_size
        total = qs.count()
        page_items = list(qs[start:end])

        serializer = ReportSerializer(page_items, many=True)

        return Response(
            {
                "success": True,
                "message": "Results retrieved successfully.",
                "data": {
                    "count": total,
                    "next": None,
                    "previous": None,
                    "results": serializer.data,
                },
            }
        )

    # ----- Authenticated user: submit a report -----
    def post(self, request: Request) -> Response:
        reporter_id = str(request.user.id)
        serializer = ReportCreateSerializer(
            data=request.data,
            context={"reporter_id": reporter_id},
        )
        if not serializer.is_valid():
            # Check for the duplicate-pending 409 case
            errors = serializer.errors
            non_field = errors.get("non_field_errors")
            if non_field:
                # non_field could be a list or a string
                msgs = non_field if isinstance(non_field, list) else [non_field]
                for msg in msgs:
                    if "pending report" in str(msg).lower():
                        return api_error(
                            str(msg),
                            errors,
                            status_code=status.HTTP_409_CONFLICT,
                        )
            return api_error("Validation failed.", errors, status_code=status.HTTP_400_BAD_REQUEST)

        report = serializer.save()
        return api_success(
            "Report submitted successfully.",
            ReportSerializer(report).data,
            status_code=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# GET /api/reports/mine/  (auth)
# ---------------------------------------------------------------------------


class MyReportsView(APIView):
    """GET — list reports submitted by the requesting user."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        reporter_id = str(request.user.id)
        qs = Report.objects(reporter_id=reporter_id).order_by("-created_at")

        paginator = StandardResultsSetPagination()
        page_size = paginator.get_page_size(request)
        page_number = int(request.query_params.get(paginator.page_query_param, 1))
        start = (page_number - 1) * page_size
        end = start + page_size
        total = qs.count()
        page_items = list(qs[start:end])

        serializer = ReportSerializer(page_items, many=True)

        return Response(
            {
                "success": True,
                "message": "Results retrieved successfully.",
                "data": {
                    "count": total,
                    "next": None,
                    "previous": None,
                    "results": serializer.data,
                },
            }
        )


# ---------------------------------------------------------------------------
# GET /api/reports/<report_id>/  (mod)
# ---------------------------------------------------------------------------


class ReportDetailView(APIView):
    """GET — retrieve a single report by its MongoDB ObjectId."""

    permission_classes = [IsModeratorOrAdmin]

    def get(self, request: Request, report_id: str) -> Response:
        try:
            report = Report.objects.get(id=ObjectId(report_id))
        except (Report.DoesNotExist, InvalidId):
            return api_error("Report not found.", status_code=status.HTTP_404_NOT_FOUND)

        return api_success(
            "Report retrieved successfully.",
            ReportSerializer(report).data,
        )


# ---------------------------------------------------------------------------
# PATCH /api/reports/<report_id>/resolve/  (mod)
# ---------------------------------------------------------------------------


class ReportResolveView(APIView):
    """PATCH — resolve a pending report (moderator/admin only)."""

    permission_classes = [IsModeratorOrAdmin]

    def patch(self, request: Request, report_id: str) -> Response:
        try:
            report = Report.objects.get(id=ObjectId(report_id))
        except (Report.DoesNotExist, InvalidId):
            return api_error("Report not found.", status_code=status.HTTP_404_NOT_FOUND)

        serializer = ReportResolveSerializer(
            data=request.data,
            context={"report": report},
        )
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        report.status = serializer.validated_data["status"]
        report.moderator_note = serializer.validated_data.get("moderator_note", "")
        report.resolved_by = str(request.user.id)
        report.resolved_at = timezone.now()
        report.save()

        return api_success(
            "Report resolved successfully.",
            ReportSerializer(report).data,
        )
