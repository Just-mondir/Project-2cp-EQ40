from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # your app urls
    path("", include("kunuz.urls")),

    # Django built-in auth URLs:
    # /login/ /logout/ /password_reset/ /password_reset_done/ /reset/<uidb64>/<token>/ /reset/done/
    path("", include("django.contrib.auth.urls")),
]