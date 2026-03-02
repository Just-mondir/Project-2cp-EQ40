"""Models for authentication and user management."""

from __future__ import annotations

from datetime import timedelta

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class ExpertiseChoices(models.TextChoices):
    """Allowed expertise levels for a user."""

    AMATEUR = "amateur", "Amateur"
    STUDENT = "student", "Student"
    RESEARCHER = "researcher", "Researcher"
    ARCHITECT = "architect", "Architect"
    HISTORIAN = "historian", "Historian"
    GUIDE = "guide", "Guide"


class RoleChoices(models.TextChoices):
    """Allowed roles for a user."""

    USER = "user", "User"
    MODERATOR = "moderator", "Moderator"
    ADMIN = "admin", "Admin"


class OTPPurposeChoices(models.TextChoices):
    """Allowed purposes for OTP codes."""

    EMAIL_VERIFICATION = "email_verification", "Email Verification"
    LOGIN = "login", "Login"


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model for Heritage Community Algeria."""

    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(unique=True)
    oauth_provider = models.CharField(max_length=50, null=True, blank=True)
    oauth_id = models.CharField(max_length=255, null=True, blank=True)
    display_name = models.CharField(max_length=100)
    username = models.CharField(max_length=100, unique=True)
    bio = models.TextField(blank=True)
    expertise = models.CharField(max_length=50, choices=ExpertiseChoices.choices)
    speciality = models.CharField(max_length=100, blank=True)
    profile_picture = models.URLField(max_length=500, blank=True)
    badge = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.USER,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "display_name", "expertise"]

    objects = UserManager()

    def __str__(self) -> str:
        """Return string representation."""
        return self.email


class OTPCode(models.Model):
    """One-time password for email verification and login."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otp_codes")
    # Stores the hashed OTP value using Django's password hasher.
    code = models.CharField(max_length=128)
    purpose = models.CharField(max_length=32, choices=OTPPurposeChoices.choices)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for OTPCode."""

        indexes = [
            models.Index(fields=["user", "purpose", "is_used"]),
        ]

    def __str__(self) -> str:
        """Return readable representation."""
        return f"OTP for {self.user_id} ({self.purpose})"

    @classmethod
    def create_expiry(cls) -> timezone.datetime:
        """Return expiry datetime 10 minutes from now."""
        return timezone.now() + timedelta(minutes=10)

