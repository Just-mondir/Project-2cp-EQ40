"""Admin configuration for the users app."""

from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import OTPCode, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Custom admin for the User model."""

    model = User
    list_display = ("id", "email", "username", "display_name", "role", "is_verified")
    list_filter = ("role", "is_active", "is_verified", "expertise")
    search_fields = ("email", "username", "display_name")
    ordering = ("id",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal info",
            {
                "fields": (
                    "username",
                    "display_name",
                    "bio",
                    "expertise",
                    "speciality",
                    "profile_picture",
                    "badge",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_verified",
                    "is_staff",
                    "is_superuser",
                    "role",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "display_name",
                    "expertise",
                    "password1",
                    "password2",
                ),
            },
        ),
    )


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    """Admin configuration for OTP codes."""

    list_display = ("id", "user", "purpose", "is_used", "expires_at")
    list_filter = ("purpose", "is_used")
    search_fields = ("user__email", "user__username")

