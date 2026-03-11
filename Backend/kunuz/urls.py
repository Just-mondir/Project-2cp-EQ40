from django.urls import path
from . import views

urlpatterns = [
    path("posts/<int:pk>/", views.post_detail, name="post_detail"),
]