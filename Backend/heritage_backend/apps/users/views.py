"""Views for authentication and user management."""

from __future__ import annotations

from django.http import Http404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework_simplejwt.views import TokenRefreshView
import os
from django.conf import settings
import uuid

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
    ForgotPasswordSerializer,
    VerifyResetOTPSerializer,
    ResetPasswordSerializer,
    GoogleAuthSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            status_code = 400
            if any(field in errors for field in ("email", "username")):
                status_code = 409
            return api_error(message="Registration failed.", errors=errors, status_code=status_code)
        user = serializer.save()
        return api_success(message="OTP sent to your email", data={"user_id": user.pk}, status_code=201)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = VerifyEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(message="Email verification failed.", errors=serializer.errors, status_code=400)
        token_data = serializer.save()
        return api_success(message="Email verified successfully.", data=token_data, status_code=200)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(message="Login failed.", errors=serializer.errors, status_code=401)
        user = serializer.save()
        return api_success(message="OTP sent to your email", data={"user_id": user.pk}, status_code=200)


class VerifyLoginOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = VerifyLoginOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(message="Login OTP verification failed.", errors=serializer.errors, status_code=400)
        token_data = serializer.save()
        return api_success(message="Login successful.", data=token_data, status_code=200)


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request: Request, *args, **kwargs) -> Response:
        response = super().post(request, *args, **kwargs)
        if response.status_code != 200:
            return api_error(message="Token refresh failed.", errors=response.data, status_code=response.status_code)
        return api_success(message="Token refreshed successfully.", data=response.data, status_code=200)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = LogoutSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(message="Logout failed.", errors=serializer.errors, status_code=400)
        try:
            serializer.save()
        except Exception:
            return api_error(message="Logout failed.", errors={"detail": "Invalid refresh token."}, status_code=400)
        return api_success(message="Logged out successfully.", data=None, status_code=200)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        serializer = UserProfileSerializer(request.user)
        return api_success(message=RESPONSE_SUCCESS_MESSAGE["profile_retrieved"], data=serializer.data, status_code=200)

    def patch(self, request: Request) -> Response:
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return api_error(message="Profile update failed.", errors=serializer.errors, status_code=400)
        serializer.save()
        profile_data = UserProfileSerializer(request.user).data
        return api_success(message=RESPONSE_SUCCESS_MESSAGE["profile_updated"], data=profile_data, status_code=200)

    def delete(self, request: Request) -> Response:
        serializer = DeactivateAccountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
        return api_success(message="Account deactivated successfully", data=None, status_code=200)


class PublicUserProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, username: str) -> Response:
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise Http404
        serializer = PublicUserProfileSerializer(user)
        return api_success(message="Profile retrieved successfully.", data=serializer.data, status_code=200)


class SearchUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        query = request.query_params.get("q", "").strip()
        users = User.objects(is_active=True)
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
        return api_success(message="Users retrieved successfully.", data=data, status_code=200)


class ProfilePictureUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request, *args, **kwargs) -> Response:
        image_file = request.FILES.get("profile_picture")
        if not image_file:
            return api_error(message="No image provided.", status_code=400)
        ext = os.path.splitext(image_file.name)[1]
        safe_name = f"profile_{request.user.id}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(settings.MEDIA_ROOT, "profile_pictures", safe_name)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb+") as f:
            for chunk in image_file.chunks():
                f.write(chunk)
        image_url = f"{settings.MEDIA_URL}profile_pictures/{safe_name}"
        user = User.objects.get(id=request.user.id)
        if user.profile_picture and user.profile_picture.startswith(settings.MEDIA_URL):
            old_path = os.path.join(settings.MEDIA_ROOT, user.profile_picture.lstrip(settings.MEDIA_URL))
            if os.path.exists(old_path):
                os.remove(old_path)
        user.profile_picture = image_url
        user.save()
        request.user.profile_picture = image_url
        return api_success(
            message="Profile picture uploaded successfully.",
            data={"profile_picture": image_url, "user": UserProfileSerializer(request.user).data},
            status_code=200,
        )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return api_success(message="If the email is registered, an OTP will be sent.", status_code=200)
        return api_error(message="Password reset initiation failed.", errors=serializer.errors, status_code=400)


class VerifyResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = VerifyResetOTPSerializer(data=request.data)
        if serializer.is_valid():
            return api_success(message="OTP is valid.", status_code=200)
        return api_error(message="OTP verification failed.", errors=serializer.errors, status_code=400)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return api_success(message="Password reset successfully. You can now log in.", status_code=200)
        return api_error(message="Password reset failed.", errors=serializer.errors, status_code=400)


class GoogleAuthView(APIView):
    """Exchange a Google id_token for internal JWT tokens."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(message="Google authentication failed.", errors=serializer.errors, status_code=400)
        token_data = serializer.save()
        return api_success(message="Google authentication successful.", data=token_data, status_code=200)
