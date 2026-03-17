"""Models for authentication and user management (MongoDB via MongoEngine)."""

from __future__ import annotations

from datetime import timedelta

import mongoengine as me
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from .managers import UserQuerySet

# ---------------------------------------------------------------------------
# Choice constants (kept as plain classes so serializers can use .choices)
# ---------------------------------------------------------------------------

EXPERTISE_CHOICES = (
    ("", "Not specified"),
    ("amateur", "Amateur"),
    ("student", "Student"),
    ("researcher", "Researcher"),
    ("architect", "Architect"),
    ("historian", "Historian"),
    ("guide", "Guide"),
)

ROLE_CHOICES = (
    ("user", "User"),
    ("moderator", "Moderator"),
    ("admin", "Admin"),
)

OTP_PURPOSE_CHOICES = (
    ("email_verification", "Email Verification"),
    ("login", "Login"),
)


class ExpertiseChoices:
    AMATEUR = "amateur"
    STUDENT = "student"
    RESEARCHER = "researcher"
    ARCHITECT = "architect"
    HISTORIAN = "historian"
    GUIDE = "guide"
    choices = EXPERTISE_CHOICES


class RoleChoices:
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"
    choices = ROLE_CHOICES


class OTPPurposeChoices:
    EMAIL_VERIFICATION = "email_verification"
    LOGIN = "login"
    choices = OTP_PURPOSE_CHOICES


# ---------------------------------------------------------------------------
# MongoEngine Documents
# ---------------------------------------------------------------------------


class User(me.Document):
    """Custom user document stored in MongoDB."""

    email = me.EmailField(unique=True, required=True)
    password = me.StringField(required=True)
    oauth_provider = me.StringField(null=True)
    oauth_id = me.StringField(null=True)
    display_name = me.StringField(max_length=100, default="")
    username = me.StringField(max_length=100, null=True, default=None)
    bio = me.StringField(default="")
    expertise = me.StringField(choices=[c[0] for c in EXPERTISE_CHOICES], default="")
    speciality = me.StringField(max_length=100, default="")
    profile_picture = me.StringField(max_length=500, default="")
    badge = me.StringField(max_length=100, default="")
    is_verified = me.BooleanField(default=False)
    is_active = me.BooleanField(default=True)
    is_staff = me.BooleanField(default=False)
    role = me.StringField(
        choices=[c[0] for c in ROLE_CHOICES], default=RoleChoices.USER
    )
    created_at = me.DateTimeField(default=timezone.now)
    updated_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "users",
        "queryset_class": UserQuerySet,
        "indexes": ["email", "username"],
    }

    # ------------------------------------------------------------------ #
    # Django authentication interface (required by DRF + simplejwt)       #
    # ------------------------------------------------------------------ #

    @property
    def pk(self) -> str:
        return str(self.id) if self.id else None

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    def get_username(self) -> str:
        return self.email

    def __str__(self) -> str:
        return self.email

    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password)

    def has_perm(self, perm, obj=None) -> bool:
        return self.is_active and (self.role == RoleChoices.ADMIN or self.is_staff)

    def has_module_perms(self, app_label) -> bool:
        return self.is_active

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        return super().save(*args, **kwargs)

    # ------------------------------------------------------------------ #
    # Factory helpers (replaces UserManager.create_user)                  #
    # ------------------------------------------------------------------ #

    @classmethod
    def create_user(cls, email: str, password: str | None = None, **extra_fields):
        """Create and return a regular user."""
        if not email:
            raise ValueError("Users must have an email address.")
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("username", None)
        extra_fields.setdefault("display_name", "")
        extra_fields.setdefault("expertise", "")
        extra_fields.setdefault("speciality", "")
        extra_fields.setdefault("profile_picture", "")
        extra_fields.setdefault("bio", "")
        user = cls(email=email.strip().lower(), **extra_fields)
        user.set_password(password)
        user.save()
        return user

    @classmethod
    def create_superuser(cls, email: str, password: str | None = None, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("role", RoleChoices.ADMIN)
        extra_fields.setdefault("is_verified", True)
        extra_fields.setdefault("is_active", True)
        if not extra_fields.get("is_staff"):
            raise ValueError("Superuser must have is_staff=True.")
        return cls.create_user(email, password, **extra_fields)


class OTPCode(me.Document):
    """One-time password document for email verification and login."""

    user = me.ReferenceField(User, required=True)
    code = me.StringField(max_length=128, required=True)
    purpose = me.StringField(
        choices=[c[0] for c in OTP_PURPOSE_CHOICES], required=True
    )
    is_used = me.BooleanField(default=False)
    expires_at = me.DateTimeField(required=True)
    created_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "otp_codes",
        "indexes": [("user", "purpose", "is_used")],
    }

    def __str__(self) -> str:
        return f"OTP for {self.user.pk} ({self.purpose})"

    @classmethod
    def create_expiry(cls) -> timezone.datetime:
        """Return expiry datetime 10 minutes from now."""
        return timezone.now() + timedelta(minutes=10)


class BlacklistedToken(me.Document):
    """MongoDB-backed JWT blacklist (replaces simplejwt token_blacklist)."""

    jti = me.StringField(unique=True, required=True)
    blacklisted_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "blacklisted_tokens",
        "indexes": ["jti"],
    }

class Visitor(me.Document):
    """Tracks anonymous visitors who visited the landing page without registering."""
    
    ip_address = me.StringField(required=True)
    visited_at = me.DateTimeField(default=timezone.now)

    meta = {
        "collection": "visitors",
        "indexes": ["ip_address"],
    }    

