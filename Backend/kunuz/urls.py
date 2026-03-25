from django.urls import path
from .views import PostFilterView, FilterChoicesView
from . import views

urlpatterns = [
    path("posts/filter/", PostFilterView.as_view(), name="posts-filter"),
    path("posts/filter-choices/", FilterChoicesView.as_view(), name="posts-filter-choices"),

    path("post/<int:pk>/", views.post_detail, name="post_detail"),
    path("comment/<int:comment_id>/gem/", views.gem_comment, name="gem_comment"),
    path("comment/<int:comment_id>/edit/", views.edit_comment, name="edit_comment"),
    path("comment/<int:comment_id>/delete/", views.delete_comment, name="delete_comment"),
    path("comment/<int:comment_id>/report/", views.report_comment, name="report_comment"),
]