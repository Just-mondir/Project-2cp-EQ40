from django.urls import path
from .views import PostFilterView, FilterChoicesView

urlpatterns = [
    path("posts/filter/", PostFilterView.as_view(), name="posts-filter"),
    path("posts/filter-choices/", FilterChoicesView.as_view(), name="posts-filter-choices"),
]