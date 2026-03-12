from django.urls import path
from .views import post_detail, global_search

urlpatterns = [
    path("post/<int:post_id>/", post_detail, name="post_detail"),
    path("search/", global_search, name="global_search"),
]