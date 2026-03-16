"""Root URL configuration for the Heritage Community Algeria backend."""

from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.posts.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.notifications.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

