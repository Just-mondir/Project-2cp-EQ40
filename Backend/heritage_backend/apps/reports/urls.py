"""URL configuration for the reports app."""

from __future__ import annotations

from django.urls import path

from .views import (
    MobilizationReportDetailView,
    MobilizationReportListCreateView,
    MyReportsView,
    ReportDetailView,
    ReportListCreateView,
    ReportResolveView,
)

urlpatterns = [
    path("reports/", ReportListCreateView.as_view(), name="reports-list-create"),
    path("reports/mine/", MyReportsView.as_view(), name="reports-mine"),

    path(
        "mobilization-reports/",
        MobilizationReportListCreateView.as_view(),
        name="mobilization-report-list-create",
    ),
    path(
        "mobilization-reports/<str:report_id>/",
        MobilizationReportDetailView.as_view(),
        name="mobilization-report-detail",
    ),

    path("reports/<str:report_id>/", ReportDetailView.as_view(), name="reports-detail"),
    path(
        "reports/<str:report_id>/resolve/",
        ReportResolveView.as_view(),
        name="reports-resolve",
    ),
]