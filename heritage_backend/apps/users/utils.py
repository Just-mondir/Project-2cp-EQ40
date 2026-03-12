"""Utility functions for OTP generation and email sending (MongoEngine-compatible)."""

from __future__ import annotations

import secrets
from typing import Tuple

from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.utils import timezone

from .models import OTPCode, OTPPurposeChoices, User

OTP_LENGTH = 6
OTP_MAX_VALUE = 10**OTP_LENGTH
OTP_EMAIL_SUBJECT = "Heritage Community Algeria — Your Verification Code"


def generate_otp_code() -> str:
    """Generate a secure numeric OTP of fixed length."""
    number = secrets.randbelow(OTP_MAX_VALUE)
    return f"{number:0{OTP_LENGTH}d}"


def create_hashed_otp(user: User, purpose: str) -> Tuple[OTPCode, str]:
    """Create a new hashed OTP for a given user and purpose, replacing any existing unused one."""
    # Delete previous unused OTPs for this user/purpose
    OTPCode.objects(user=user, purpose=purpose, is_used=False).delete()

    plain_code = generate_otp_code()
    hashed_code = make_password(plain_code)
    otp = OTPCode(
        user=user,
        code=hashed_code,
        purpose=purpose,
        is_used=False,
        expires_at=OTPCode.create_expiry(),
    )
    otp.save()
    return otp, plain_code


def verify_otp_code(otp: OTPCode, plain_code: str) -> bool:
    """Verify that a provided OTP matches the stored hash and is not expired."""
    if otp.is_used:
        return False
    if otp.expires_at <= timezone.now():
        return False
    return check_password(plain_code, otp.code)


def send_otp_email(email: str, code: str) -> None:
    """Send the OTP code to the user email."""
    message = f"Your verification code is: {code}"
    send_mail(
        subject=OTP_EMAIL_SUBJECT,
        message=message,
        from_email=None,
        recipient_list=[email],
        fail_silently=False,
    )
