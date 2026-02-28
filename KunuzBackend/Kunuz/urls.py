from django.urls import path
from .views import HomeView, AddPostView, ProfileView,gem_post,save_post, EditPostView, DeletePostView
from .views import add_images, delete_image
urlpatterns = [
    path('',HomeView.as_view(),name='home'),
    path('profile',ProfileView.as_view(),name='profile'),
    path('add-post/',AddPostView.as_view(),name='add-post'),
    path("gem/<int:pk>/", gem_post, name="gem-post"),
    path("save/<int:pk>/", save_post, name="save-post"),
    path("post/<int:pk>/edit/", EditPostView.as_view(), name="edit-post"),
    path("post/<int:pk>/delete/", DeletePostView.as_view(), name="delete-post"),
    path("post/<int:pk>/edit/", EditPostView.as_view(), name="edit-post"),
    path("post/<int:pk>/images/add/", add_images, name="add-images"),
    path("images/<int:image_id>/delete/", delete_image, name="delete-image"),
]
