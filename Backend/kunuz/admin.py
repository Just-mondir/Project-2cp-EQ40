from django.contrib import admin
from .models import (
    Post,
    EventDetails,
    AlertDetails,
    PostImage,
    Gem,
    Save,
    Comment,
    CommentGem,
    CommentReport,
    UserProfile,
)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "user",
        "post_type",
        "region",
        "historical_period",
        "monument_type",
        "visibility",
        "created_at",
    )
    list_filter = (
        "post_type",
        "region",
        "historical_period",
        "monument_type",
        "visibility",
    )
    search_fields = ("title", "content", "location", "user__username")
    ordering = ("-created_at",)


@admin.register(EventDetails)
class EventDetailsAdmin(admin.ModelAdmin):
    list_display = ("post", "starts_at", "ends_at")


@admin.register(AlertDetails)
class AlertDetailsAdmin(admin.ModelAdmin):
    list_display = ("post", "urgence_level", "current_status")
    list_filter = ("urgence_level", "current_status")


@admin.register(PostImage)
class PostImageAdmin(admin.ModelAdmin):
    list_display = ("post", "uploaded_at")


@admin.register(Gem)
class GemAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "created_at")


@admin.register(Save)
class SaveAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "created_at")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "created_at")
    search_fields = ("content", "user__username")


@admin.register(CommentGem)
class CommentGemAdmin(admin.ModelAdmin):
    list_display = ("comment", "user", "created_at")


@admin.register(CommentReport)
class CommentReportAdmin(admin.ModelAdmin):
    list_display = ("comment", "reporter", "reason", "resolved", "created_at")
    list_filter = ("reason", "resolved")
    search_fields = ("description", "reporter__username")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "expertise", "speciality")