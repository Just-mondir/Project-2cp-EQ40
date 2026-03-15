from django.contrib import admin
from .models import Annotation


@admin.register(Annotation)
class AnnotationAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("text", "user__username", "post__title")



from .models import (
    Post,
    Comment,
    Gem,
    Save,
    CommentGem,
    CommentReport
)

admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Gem)
admin.site.register(Save)
admin.site.register(CommentGem)
admin.site.register(CommentReport)