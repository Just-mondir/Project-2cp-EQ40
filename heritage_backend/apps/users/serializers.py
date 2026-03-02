"""Serializers for authentication and user management."""

from __future__ import annotations

from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.responses import RESPONSE_CONFLICT_MESSAGE
from .models import ExpertiseChoices, OTPCode, OTPPurposeChoices, User
from .utils import create_hashed_otp, send_otp_email, verify_otp_code


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for exposing user profile information."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "display_name",
            "bio",
            "expertise",
            "speciality",
            "profile_picture",
            "badge",
            "is_verified",
            "role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "username",
            "badge",
            "is_verified",
            "role",
            "created_at",
            "updated_at",
        ]


class PublicUserProfileSerializer(serializers.ModelSerializer):
    """Serializer for public user profile by username."""

    class Meta:
        model = User
        fields = [
            "username",
            "display_name",
            "bio",
            "expertise",
            "speciality",
            "profile_picture",
            "badge",
            "role",
            "created_at",
        ]


class RegisterSerializer(serializers.Serializer):
    """Handle user registration and email OTP creation."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(max_length=100)
    display_name = serializers.CharField(max_length=100)
    expertise = serializers.ChoiceField(choices=ExpertiseChoices.choices)

    def validate(self, attrs):
        """Validate uniqueness and expertise."""
        email = attrs.get("email")
        username = attrs.get("username")
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                {"email": RESPONSE_CONFLICT_MESSAGE["email_exists"]}
            )
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError(
                {"username": RESPONSE_CONFLICT_MESSAGE["username_exists"]}
            )
        return attrs

    def create(self, validated_data):
        """Create user and associated email verification OTP."""
        password = validated_data.pop("password")
        user = User.objects.create_user(
            password=password,
            is_verified=False,
            **validated_data,
        )

        _, plain_otp = create_hashed_otp(user, OTPPurposeChoices.EMAIL_VERIFICATION)
        send_otp_email(user.email, plain_otp)
        return user


class VerifyEmailSerializer(serializers.Serializer):
    """Verify email using OTP and issue JWT tokens."""

    user_id = serializers.IntegerField(required=False)
    email = serializers.EmailField(required=False)
    otp_code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        """Validate OTP correctness and expiry."""
        user_id = attrs.get("user_id")
        email = attrs.get("email")
        otp_code = attrs.get("otp_code")

        if not user_id and not email:
            raise serializers.ValidationError(
                {"user": "Either user_id or email must be provided."}
            )

        try:
            if user_id:
                user = User.objects.get(id=user_id)
            else:
                user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user": "User not found."})

        try:
            otp = (
                OTPCode.objects.filter(
                    user=user,
                    purpose=OTPPurposeChoices.EMAIL_VERIFICATION,
                )
                .order_by("-created_at")
                .first()
            )
        except OTPCode.DoesNotExist:
            otp = None

        if otp is None:
            raise serializers.ValidationError({"otp_code": "Invalid OTP."})

        if otp.is_used:
            raise serializers.ValidationError({"otp_code": "OTP already used."})

        if otp.expires_at <= timezone.now():
            raise serializers.ValidationError(
                {"otp_code": "OTP expired. Please request a new one."}
            )

        if not verify_otp_code(otp, otp_code):
            raise serializers.ValidationError({"otp_code": "Invalid OTP."})

        attrs["user"] = user
        attrs["otp"] = otp
        return attrs

    def save(self, **kwargs):
        """Mark OTP as used, verify user, and issue JWT tokens."""
        user = self.validated_data["user"]
        otp = self.validated_data["otp"]
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        user.is_verified = True
        user.save(update_fields=["is_verified"])

        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserProfileSerializer(user).data,
        }


class LoginSerializer(serializers.Serializer):
    """Validate credentials and trigger OTP for login."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Validate credentials and verification status."""
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError({"detail": "Invalid credentials."})
        if not user.is_verified:
            raise serializers.ValidationError(
                {"detail": "Email is not verified. Please verify your email first."}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Account is deactivated or banned."}
            )
        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        """Generate login OTP and send via email."""
        user = validated_data["user"]
        _, plain_otp = create_hashed_otp(user, OTPPurposeChoices.LOGIN)
        send_otp_email(user.email, plain_otp)
        return user


class VerifyLoginOTPSerializer(serializers.Serializer):
    """Verify login OTP and issue JWT tokens."""

    user_id = serializers.IntegerField(required=False)
    email = serializers.EmailField(required=False)
    otp_code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        """Validate OTP correctness for login."""
        user_id = attrs.get("user_id")
        email = attrs.get("email")
        otp_code = attrs.get("otp_code")

        if not user_id and not email:
            raise serializers.ValidationError(
                {"user": "Either user_id or email must be provided."}
            )

        try:
            if user_id:
                user = User.objects.get(id=user_id)
            else:
                user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user": "User not found."})

        try:
            otp = (
                OTPCode.objects.filter(
                    user=user,
                    purpose=OTPPurposeChoices.LOGIN,
                )
                .order_by("-created_at")
                .first()
            )
        except OTPCode.DoesNotExist:
            otp = None

        if otp is None:
            raise serializers.ValidationError({"otp_code": "Invalid OTP."})

        if otp.is_used:
            raise serializers.ValidationError({"otp_code": "OTP already used."})

        if otp.expires_at <= timezone.now():
            raise serializers.ValidationError(
                {"otp_code": "OTP expired. Please request a new one."}
            )

        if not verify_otp_code(otp, otp_code):
            raise serializers.ValidationError({"otp_code": "Invalid OTP."})

        attrs["user"] = user
        attrs["otp"] = otp
        return attrs

    def save(self, **kwargs):
        """Mark OTP as used and issue JWT tokens."""
        user = self.validated_data["user"]
        otp = self.validated_data["otp"]
        otp.is_used = True
        otp.save(update_fields=["is_used"])

        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserProfileSerializer(user).data,
        }


class UserUpdateSerializer(serializers.ModelSerializer):
    """Update serializer for editable profile fields."""

    class Meta:
        model = User
        fields = [
            "display_name",
            "bio",
            "expertise",
            "speciality",
            "profile_picture",
        ]


class LogoutSerializer(serializers.Serializer):
    """Serializer for logout by blacklisting refresh token."""

    refresh = serializers.CharField()

    def save(self, **kwargs):
        """Blacklist the provided refresh token."""
        from rest_framework_simplejwt.tokens import RefreshToken  # local import

        refresh_token = self.validated_data["refresh"]
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as exc:  # pragma: no cover - defensive
            raise serializers.ValidationError(
                {"detail": "Invalid refresh token."}
            ) from exc


class DeactivateAccountSerializer(serializers.Serializer):
    """Serializer to handle account deactivation and token blacklisting."""

    refresh = serializers.CharField(required=False, allow_blank=True)

    def save(self, user: User, **kwargs):
        """Soft delete the user and optionally blacklist the refresh token."""
        from rest_framework_simplejwt.tokens import RefreshToken  # local import

        user.is_active = False
        user.save(update_fields=["is_active"])

        refresh_token = self.validated_data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:  # pragma: no cover - defensive
                # We intentionally ignore token errors during deactivation.
                pass


