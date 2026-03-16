from django.contrib import admin
from .models import (
    UserProfile,
    Post,
    EventDetails,
    AlertDetails,
    PostImage,
    Gem,
    Save,
    Comment,
)

admin.site.register(UserProfile)
admin.site.register(Post)
admin.site.register(EventDetails)
admin.site.register(AlertDetails)
admin.site.register(PostImage)
admin.site.register(Gem)
admin.site.register(Save)
admin.site.register(Comment)
