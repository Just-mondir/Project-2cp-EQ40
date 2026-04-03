"""Custom authentication backend and JWT authentication for MongoEngine users."""

from __future__ import annotations

from django.utils import timezone

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from rest_framework_simplejwt.settings import api_settings


class MongoEngineBackend:
    """Django authentication backend that authenticates against MongoDB users."""

    def authenticate(self, request, username: str | None = None, password: str | None = None, **kwargs):
        from apps.users.models import User

        if username is None:
            return None
        try:
            user = User.objects.get(email=username.strip().lower())
        except User.DoesNotExist:
            return None

        if user.check_password(password):
            return user
        return None

    def get_user(self, user_id: str):
        from apps.users.models import User

        try:
            return User.objects.get(id=user_id)
        except (User.DoesNotExist, Exception):
            return None


class MongoEngineJWTAuthentication(JWTAuthentication):
    """JWTAuthentication subclass that fetches users from MongoDB."""

    def get_user(self, validated_token):
        from apps.users.models import User

        try:
            user_id = str(validated_token[api_settings.USER_ID_CLAIM])
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, Exception):
            raise AuthenticationFailed("User not found", code="user_not_found")

        if not user.is_active:
            raise AuthenticationFailed("User is inactive", code="user_inactive")

        if getattr(user, "moderation_status", "active") in {"suspended", "banned"}:
            raise AuthenticationFailed("User is moderated out", code="user_moderated_out")

        suspended_until = getattr(user, "suspended_until", None)
        if suspended_until and suspended_until > timezone.now():
            raise AuthenticationFailed("User is suspended", code="user_suspended")

        return user

    def get_validated_token(self, raw_token):
        """Extend parent to also check MongoDB blacklist."""
        from apps.users.models import BlacklistedToken

        validated_token = super().get_validated_token(raw_token)
        jti = validated_token.get("jti")
        if jti and BlacklistedToken.objects(jti=jti).count() > 0:
            raise InvalidToken("Token has been blacklisted")
        return validated_token
