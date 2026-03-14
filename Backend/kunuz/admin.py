from django.contrib import admin
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