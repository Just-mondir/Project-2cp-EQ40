"""Serializers for authentication and user management (MongoEngine-compatible)."""

from __future__ import annotations

from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.responses import RESPONSE_CONFLICT_MESSAGE
from .models import BlacklistedToken, ExpertiseChoices, OTPCode, OTPPurposeChoices, User
from .utils import create_hashed_otp, is_otp_expired, send_otp_email, verify_otp_code


class UserProfileSerializer(serializers.Serializer):
    """Serializer for full user profile information."""

    id = serializers.SerializerMethodField()
    email = serializers.EmailField(read_only=True)
    username = serializers.CharField(read_only=True)
    display_name = serializers.CharField()
    bio = serializers.CharField()
    expertise = serializers.CharField()
    speciality = serializers.CharField()
    profile_picture = serializers.CharField()
    badge = serializers.CharField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    role = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_id(self, obj) -> str:
        return str(obj.id)


class PublicUserProfileSerializer(serializers.Serializer):
    """Serializer for public user profile by username."""

    username = serializers.CharField()
    display_name = serializers.CharField()
    bio = serializers.CharField()
    expertise = serializers.CharField()
    speciality = serializers.CharField()
    profile_picture = serializers.CharField()
    badge = serializers.CharField()
    role = serializers.CharField()
    created_at = serializers.DateTimeField()


class RegisterSerializer(serializers.Serializer):
    """Handle user registration and email OTP creation."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(max_length=100)
    display_name = serializers.CharField(max_length=100)
    expertise = serializers.ChoiceField(choices=ExpertiseChoices.choices)

    def validate(self, attrs):
        email = attrs.get("email")
        username = attrs.get("username")
        if User.objects(email=email.strip().lower()).count() > 0:
            raise serializers.ValidationError(
                {"email": RESPONSE_CONFLICT_MESSAGE["email_exists"]}
            )
        if User.objects(username=username).count() > 0:
            raise serializers.ValidationError(
                {"username": RESPONSE_CONFLICT_MESSAGE["username_exists"]}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.create_user(
            password=password,
            is_verified=False,
            **validated_data,
        )
        _, plain_otp = create_hashed_otp(user, OTPPurposeChoices.EMAIL_VERIFICATION)
        send_otp_email(user.email, plain_otp)
        return user


class VerifyEmailSerializer(serializers.Serializer):
    """Verify email using OTP and issue JWT tokens."""

    user_id = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    otp_code = serializers.CharField(max_length=6)

    def validate(self, attrs):
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
        except (User.DoesNotExist, Exception):
            raise serializers.ValidationError({"user": "User not found."})

        otp = (
            OTPCode.objects(user=user, purpose=OTPPurposeChoices.EMAIL_VERIFICATION)
            .order_by("-created_at")
            .first()
        )

        if otp is None:
            raise serializers.ValidationError({"otp_code": "Invalid OTP."})
        if otp.is_used:
            raise serializers.ValidationError({"otp_code": "OTP already used."})
        if is_otp_expired(otp.expires_at):
            raise serializers.ValidationError(
                {"otp_code": "OTP expired. Please request a new one."}
            )
        if not verify_otp_code(otp, otp_code):
            raise serializers.ValidationError({"otp_code": "Invalid OTP."})

        attrs["user"] = user
        attrs["otp"] = otp
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        otp = self.validated_data["otp"]
        OTPCode.objects(id=otp.id).update_one(set__is_used=True)
        User.objects(id=user.id).update_one(set__is_verified=True)
        user.is_verified = True  # reflect locally for serializer
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
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(request=None, username=email, password=password)
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
        user = validated_data["user"]
        _, plain_otp = create_hashed_otp(user, OTPPurposeChoices.LOGIN)
        send_otp_email(user.email, plain_otp)
        return user


class VerifyLoginOTPSerializer(serializers.Serializer):
    """Verify login OTP and issue JWT tokens."""

    user_id = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    otp_code = serializers.CharField(max_length=6)

    def validate(self, attrs):
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
        except (User.DoesNotExist, Exception):
            raise serializers.ValidationError({"user": "User not found."})

        otp = (
            OTPCode.objects(user=user, purpose=OTPPurposeChoices.LOGIN)
            .order_by("-created_at")
            .first()
        )

        if otp is None:
            raise serializers.ValidationError({"otp_code": "Invalid OTP."})
        if otp.is_used:
            raise serializers.ValidationError({"otp_code": "OTP already used."})
        if is_otp_expired(otp.expires_at):
            raise serializers.ValidationError(
                {"otp_code": "OTP expired. Please request a new one."}
            )
        if not verify_otp_code(otp, otp_code):
            raise serializers.ValidationError({"otp_code": "Invalid OTP."})

        attrs["user"] = user
        attrs["otp"] = otp
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        otp = self.validated_data["otp"]
        OTPCode.objects(id=otp.id).update_one(set__is_used=True)
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserProfileSerializer(user).data,
        }


class UserUpdateSerializer(serializers.Serializer):
    """Update serializer for editable profile fields."""

    display_name = serializers.CharField(max_length=100, required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    expertise = serializers.ChoiceField(choices=ExpertiseChoices.choices, required=False)
    speciality = serializers.CharField(max_length=100, required=False, allow_blank=True)
    profile_picture = serializers.URLField(max_length=500, required=False, allow_blank=True)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class LogoutSerializer(serializers.Serializer):
    """Serializer for logout by blacklisting the refresh token JTI in MongoDB."""

    refresh = serializers.CharField()

    def save(self, **kwargs):
        refresh_token_str = self.validated_data["refresh"]
        try:
            token = RefreshToken(refresh_token_str)
            jti = token.get("jti")
            if jti and BlacklistedToken.objects(jti=jti).count() == 0:
                BlacklistedToken(jti=jti).save()
        except Exception as exc:
            raise serializers.ValidationError(
                {"detail": "Invalid refresh token."}
            ) from exc


class DeactivateAccountSerializer(serializers.Serializer):
    """Handle account soft-deletion and optional token blacklisting."""

    refresh = serializers.CharField(required=False, allow_blank=True)

    def save(self, user: User, **kwargs):
        User.objects(id=user.id).update_one(set__is_active=False)
        user.is_active = False

        refresh_token_str = self.validated_data.get("refresh")
        if refresh_token_str:
            try:
                token = RefreshToken(refresh_token_str)
                jti = token.get("jti")
                if jti and BlacklistedToken.objects(jti=jti).count() == 0:
                    BlacklistedToken(jti=jti).save()
            except Exception:
                pass
