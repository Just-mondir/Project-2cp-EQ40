from django.urls import path
from .views import (
    home,
    SignUp,
    LogIn,
    LogOut,
    Profile,
    UpdateUserView,
    UpdatePublicDetails,
    UserPasswordChangeView,
    password_success,
    DeleteUser,
    Dashboard,
    HomeView, AddPostView, ProfileView,gem_post,save_post, EditPostView, DeletePostView
)
from .views import add_images, delete_image
urlpatterns = [
    path("", home, name="home"),
    path("register/", SignUp.as_view(), name="register"),
    path("login/", LogIn.as_view(), name="login"),
    path("logout/", LogOut.as_view(), name="logout"),
    path("profile/<str:user_name>/", Profile.as_view(), name="profile"),
    path("edit-user/", UpdateUserView.as_view(), name="edit_user_profile"),
    path("edit-profile/", UpdatePublicDetails.as_view(), name="edit_public_details"),
    path("password/", UserPasswordChangeView.as_view(), name="change_password"),
    path("password-success/", password_success, name="password_success"),
    path("delete-account/", DeleteUser.as_view(), name="delete_user"),
    path("dashboard/", Dashboard.as_view(), name="dashboard"),
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
