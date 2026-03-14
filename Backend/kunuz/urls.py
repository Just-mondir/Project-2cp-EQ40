from django.urls import path
from . import views

urlpatterns = [
    path("post/<int:pk>/", views.post_detail, name="post_detail"),
    path("comment/<int:comment_id>/gem/", views.gem_comment, name="gem_comment"),
    path("comment/<int:comment_id>/edit/", views.edit_comment, name="edit_comment"),
    path("comment/<int:comment_id>/delete/", views.delete_comment, name="delete_comment"),
    path("comment/<int:comment_id>/report/", views.report_comment, name="report_comment"),
]