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
)

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
]