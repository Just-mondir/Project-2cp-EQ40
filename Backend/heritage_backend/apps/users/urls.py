"""URL configuration for the users app."""
from __future__ import annotations
from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    MeView,
    PublicUserProfileView,
    RefreshTokenView,
    RegisterView,
    VerifyEmailView,
    VerifyLoginOTPView,
    SearchUserView,
    ProfilePictureUploadView,
    ForgotPasswordView,
    VerifyResetOTPView,
    ResetPasswordView,
)
urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/verify-email/", VerifyEmailView.as_view(), name="auth-verify-email"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/verify-login-otp/", VerifyLoginOTPView.as_view(), name="auth-verify-login-otp"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("auth/verify-reset-otp/", VerifyResetOTPView.as_view(), name="auth-verify-reset-otp"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/profile-picture/", ProfilePictureUploadView.as_view(), name="users-profile-picture"),
    path("users/search/", SearchUserView.as_view(), name="users-search"),
    path("users/<str:username>/", PublicUserProfileView.as_view(), name="users-public"),
]
