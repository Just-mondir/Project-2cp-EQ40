"""Views for authentication and user management."""

from __future__ import annotations

from django.http import Http404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.core.responses import (
    RESPONSE_CONFLICT_MESSAGE,
    RESPONSE_SUCCESS_MESSAGE,
    api_error,
    api_success,
)
from .models import User
from .permissions import IsSelf
from .serializers import (
    LoginSerializer,
    LogoutSerializer,
    PublicUserProfileSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    DeactivateAccountSerializer,
    VerifyEmailSerializer,
    VerifyLoginOTPSerializer,
)


class RegisterView(APIView):
    """Handle registration of new users."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Register a new user and send email verification OTP."""
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            status_code = 400
            if any(
                field in errors
                for field in ("email", "username")
            ):
                status_code = 409
            return api_error(
                message="Registration failed.",
                errors=errors,
                status_code=status_code,
            )
        user = serializer.save()
        return api_success(
            message="OTP sent to your email",
            data={"user_id": user.pk},
            status_code=201,
        )


class VerifyEmailView(APIView):
    """Verify email address using OTP."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Verify OTP and issue JWT tokens."""
        serializer = VerifyEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                message="Email verification failed.",
                errors=serializer.errors,
                status_code=400,
            )
        token_data = serializer.save()
        return api_success(
            message="Email verified successfully.",
            data=token_data,
            status_code=200,
        )


class LoginView(APIView):
    """Authenticate user and send login OTP."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Validate credentials and send OTP."""
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                message="Login failed.",
                errors=serializer.errors,
                status_code=401,
            )
        user = serializer.save()
        return api_success(
            message="OTP sent to your email",
            data={"user_id": user.pk},
            status_code=200,
        )


class VerifyLoginOTPView(APIView):
    """Verify login OTP and issue JWT tokens."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Verify login OTP and return tokens."""
        serializer = VerifyLoginOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                message="Login OTP verification failed.",
                errors=serializer.errors,
                status_code=400,
            )
        token_data = serializer.save()
        return api_success(
            message="Login successful.",
            data=token_data,
            status_code=200,
        )


class RefreshTokenView(TokenRefreshView):
    """Wrap SimpleJWT token refresh in standardized response format."""

    permission_classes = [AllowAny]

    def post(self, request: Request, *args, **kwargs) -> Response:
        """Refresh JWT access token."""
        response = super().post(request, *args, **kwargs)
        if response.status_code != 200:
            return api_error(
                message="Token refresh failed.",
                errors=response.data,
                status_code=response.status_code,
            )
        return api_success(
            message="Token refreshed successfully.",
            data=response.data,
            status_code=200,
        )


class LogoutView(APIView):
    """Logout user by blacklisting refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Blacklist provided refresh token."""
        serializer = LogoutSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                message="Logout failed.",
                errors=serializer.errors,
                status_code=400,
            )
        try:
            serializer.save()
        except Exception:
            return api_error(
                message="Logout failed.",
                errors={"detail": "Invalid refresh token."},
                status_code=400,
            )
        return api_success(
            message="Logged out successfully.",
            data=None,
            status_code=200,
        )


class MeView(APIView):
    """Retrieve, update, or soft-delete the authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Return current user's profile."""
        serializer = UserProfileSerializer(request.user)
        return api_success(
            message=RESPONSE_SUCCESS_MESSAGE["profile_retrieved"],
            data=serializer.data,
            status_code=200,
        )

    def patch(self, request: Request) -> Response:
        """Update allowed fields on the current user's profile."""
        serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return api_error(
                message="Profile update failed.",
                errors=serializer.errors,
                status_code=400,
            )
        serializer.save()
        profile_data = UserProfileSerializer(request.user).data
        return api_success(
            message=RESPONSE_SUCCESS_MESSAGE["profile_updated"],
            data=profile_data,
            status_code=200,
        )

    def delete(self, request: Request) -> Response:
        """Soft delete the current user's account."""
        serializer = DeactivateAccountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
        return api_success(
            message="Account deactivated successfully",
            data=None,
            status_code=200,
        )


class PublicUserProfileView(APIView):
    """Retrieve public profile by username."""

    permission_classes = [AllowAny]

    def get(self, request: Request, username: str) -> Response:
        """Return public profile for the given username."""
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise Http404
        serializer = PublicUserProfileSerializer(user)
        return api_success(
            message="Profile retrieved successfully.",
            data=serializer.data,
            status_code=200,
        )

class SearchUserView(APIView):
    """Search users by username or display_name."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        query = request.query_params.get("q", "").strip()

        users = User.objects.filter(is_active=True)

        if query:
            users = users.filter(
                __raw__={
                    "$or": [
                        {"username": {"$regex": query, "$options": "i"}},
                        {"display_name": {"$regex": query, "$options": "i"}},
                    ]
                }
            )

        data = [
            {
                "id": str(user.id),
                "username": user.username,
                "display_name": user.display_name,
                "profile_picture": user.profile_picture,
            }
            for user in users
        ]

        return api_success(
            message="Users retrieved successfully.",
            data=data,
            status_code=200,
        )
    
