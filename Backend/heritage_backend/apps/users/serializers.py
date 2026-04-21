"""Serializers for authentication and user management (MongoEngine-compatible)."""

from __future__ import annotations

from django.conf import settings
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

import bleach


def _sanitize_plain(value: str) -> str:
    """Strip ALL HTML for plain-text fields."""
    if not value:
        return value
    return bleach.clean(value, tags=[], strip=True).strip()

from apps.core.responses import RESPONSE_CONFLICT_MESSAGE
from .models import BlacklistedToken, ExpertiseChoices, OTPCode, OTPPurposeChoices, User
from .utils import create_hashed_otp, is_otp_expired, send_otp_email, verify_otp_code


class UserProfileSerializer(serializers.Serializer):
    """Serializer for full user profile information."""

    id = serializers.SerializerMethodField()
    email = serializers.EmailField(read_only=True)
    username = serializers.CharField(read_only=True, allow_null=True)
    display_name = serializers.CharField(allow_blank=True)
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

    username = serializers.CharField(allow_null=True)
    display_name = serializers.CharField(allow_blank=True)
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
    username = serializers.CharField(max_length=100, required=False, allow_blank=True)
    display_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    expertise = serializers.ChoiceField(
        choices=ExpertiseChoices.choices,
        required=False,
        allow_blank=True,
    )

    def validate(self, attrs):
        email = attrs.get("email")
        username = attrs.get("username") or None
        attrs["username"] = username
        if User.objects(email=email.strip().lower()).count() > 0:
            raise serializers.ValidationError(
                {"email": RESPONSE_CONFLICT_MESSAGE["email_exists"]}
            )
        if username and User.objects(username=username).count() > 0:
            raise serializers.ValidationError(
                {"username": RESPONSE_CONFLICT_MESSAGE["username_exists"]}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.create_user(password=password,is_verified=False,**validated_data,)
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
    """Validate credentials and issue JWT tokens for login (single-step, no OTP)."""
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
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserProfileSerializer(user).data,
        }


class UserUpdateSerializer(serializers.Serializer):
    """Update serializer for editable profile fields."""

    username = serializers.CharField(max_length=100, required=False, allow_blank=True)
    display_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    expertise = serializers.ChoiceField(
        choices=ExpertiseChoices.choices,
        required=False,
        allow_blank=True,
    )
    speciality = serializers.CharField(max_length=100, required=False, allow_blank=True)
    profile_picture = serializers.URLField(max_length=500, required=False, allow_blank=True)

    def validate_username(self, value):
        if not value:
            return None
        instance = getattr(self, "instance", None)
        query = User.objects(username=value)
        if instance is not None:
            query = query.filter(id__ne=instance.id)
        if query.count() > 0:
            raise serializers.ValidationError(RESPONSE_CONFLICT_MESSAGE["username_exists"])
        return value

    def validate(self, attrs):
        # --- XSS sanitization ---
        if "username" in attrs and attrs["username"]:
            attrs["username"] = _sanitize_plain(attrs["username"])
        if "display_name" in attrs and attrs["display_name"]:
            attrs["display_name"] = _sanitize_plain(attrs["display_name"])
        if "bio" in attrs and attrs["bio"]:
            attrs["bio"] = _sanitize_plain(attrs["bio"])
        if "speciality" in attrs and attrs["speciality"]:
            attrs["speciality"] = _sanitize_plain(attrs["speciality"])
        # --- end sanitization ---
        return attrs

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


class ForgotPasswordSerializer(serializers.Serializer):
    """Initiates password reset by sending an OTP to the email."""

    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects(email=value).first():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

    def save(self, **kwargs):
        email = self.validated_data["email"]
        user = User.objects.get(email=email)
        _, plain_otp = create_hashed_otp(user, OTPPurposeChoices.PASSWORD_RESET)
        send_otp_email(user.email, plain_otp)
        return user


class VerifyResetOTPSerializer(serializers.Serializer):
    """Validates the reset OTP without expiring it."""

    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs.get("email")
        otp_code = attrs.get("otp_code")
        user = User.objects(email=email).first()
        if not user:
            raise serializers.ValidationError({"email": "User does not exist."})
        
        otp = (
            OTPCode.objects(user=user, purpose=OTPPurposeChoices.PASSWORD_RESET)
            .order_by("-created_at")
            .first()
        )
        if otp is None:
            raise serializers.ValidationError({"otp_code": "Invalid or expired OTP."})
        if otp.is_used:
            raise serializers.ValidationError({"otp_code": "OTP has already been used."})
        if is_otp_expired(otp.expires_at):
            raise serializers.ValidationError({"otp_code": "OTP has expired."})
        if not verify_otp_code(otp, otp_code):
            raise serializers.ValidationError({"otp_code": "Invalid OTP."})
            
        attrs["user"] = user
        attrs["otp"] = otp
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    """Finalizes password reset by confirming OTP and hashing new password."""

    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        # Delegate to the OTP verification serializer
        verifier = VerifyResetOTPSerializer(data={"email": attrs.get("email"), "otp_code": attrs.get("otp_code")})
        verifier.is_valid(raise_exception=True)
        
        attrs["user"] = verifier.validated_data["user"]
        attrs["otp"] = verifier.validated_data["otp"]
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        otp = self.validated_data["otp"]
        password = self.validated_data["password"]

        OTPCode.objects(id=otp.id).update_one(set__is_used=True)
        user.set_password(password)
        user.save()
        return user

class VerifyLoginOTPSerializer(serializers.Serializer):
    """Verify login OTP and issue JWT tokens."""

    user_id = serializers.CharField()
    otp_code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        user_id = attrs.get("user_id")
        otp_code = attrs.get("otp_code")

        try:
            user = User.objects.get(id=user_id)
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
            raise serializers.ValidationError({"otp_code": "OTP expired."})
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


class GoogleAuthSerializer(serializers.Serializer):
    """Verify a Google access_token and return internal JWT tokens.

    The frontend sends an access_token obtained from useGoogleLogin (implicit flow).
    We verify it by calling Google's tokeninfo endpoint.

    The user profile (display_name, bio, expertise, etc.) is intentionally
    NOT pre-filled from the Google account. The user fills it in via the
    normal /set-profile flow, exactly like email-registered users.
    """

    token = serializers.CharField(write_only=True)

    def validate(self, attrs):
        import urllib.request
        import json as _json

        raw_token = attrs.get("token")

        # Verify the access_token via Google's userinfo endpoint
        req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {raw_token}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                id_info = _json.loads(resp.read().decode())
        except Exception as exc:
            raise serializers.ValidationError(
                {"token": f"Could not verify Google token: {exc}"}
            )

        email = id_info.get("email", "").strip().lower()
        if not email:
            raise serializers.ValidationError(
                {"token": "Google account has no email address."}
            )

        attrs["email"] = email
        attrs["google_sub"] = id_info.get("sub", "")
        return attrs

    def save(self, **kwargs):
        email = self.validated_data["email"]
        google_sub = self.validated_data["google_sub"]

        # Find existing user or create a brand-new one (no profile data copied)
        user = User.objects(email=email).first()
        if user is None:
            user = User(
                email=email,
                is_verified=True,
                is_active=True,
                oauth_provider="google",
                oauth_id=google_sub,
            )
            # Set an unusable password (they will never log in with password)
            user.set_password(None)
            user.save()
        else:
            # If they previously registered with email/password, link OAuth
            if not user.oauth_provider:
                User.objects(id=user.id).update_one(
                    set__oauth_provider="google",
                    set__oauth_id=google_sub,
                )

        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserProfileSerializer(user).data,
        }