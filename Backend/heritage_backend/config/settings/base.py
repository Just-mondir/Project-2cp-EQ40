"""Base settings shared across all environments."""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import environ
import cloudinary

env = environ.Env(
    DEBUG=(bool, False),
    ACCESS_TOKEN_LIFETIME_MINUTES=(int, 60),
    REFRESH_TOKEN_LIFETIME_DAYS=(int, 7),
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent

environ.Env.read_env(env_file=str(BASE_DIR / ".env"), overwrite=False)

DEBUG = env.bool("DEBUG", default=True)

SECRET_KEY = env(
    "SECRET_KEY",
    default="django-insecure-change-me-for-production",
)

ALLOWED_HOSTS: list[str] = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "corsheaders",
    # Local apps
    "apps.users",
    "apps.core",
    "apps.posts",
    "apps.reports",
    "apps.notifications",
    "apps.moderator",
    "apps.thematic_groups",
    "apps.badges",
    'cloudinary',
    'cloudinary_storage',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ---------------------------------------------------------------------------
# MongoDB (MongoEngine) — Users and OTP documents
# ---------------------------------------------------------------------------
import mongoengine  # noqa: E402
from mongoengine.connection import get_db  # noqa: E402

MONGODB_NAME = env("MONGODB_NAME", default="heritage_db")
MONGODB_HOST = env("MONGODB_HOST", default="mongodb://localhost:27017")
mongoengine.connect(db=MONGODB_NAME, host=MONGODB_HOST, tz_aware=True)

try:
    users_collection = get_db().get_collection("users")
    username_index = users_collection.index_information().get("username_1")
    if username_index and username_index.get("unique"):
        users_collection.drop_index("username_1")
except Exception:
    pass

# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
AUTHENTICATION_BACKENDS = [
    "apps.users.auth_backend.MongoEngineBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.users.auth_backend.MongoEngineJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
}

EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=25)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
EMAIL_FILE_PATH = env("EMAIL_FILE_PATH", default=str(BASE_DIR / ".test_emails"))
BACKEND_PUBLIC_URL = env("BACKEND_PUBLIC_URL", default="http://127.0.0.1:8000")
DEFAULT_FROM_EMAIL = env(
    "DEFAULT_FROM_EMAIL",
    default="Heritage Community Algeria <noreply@heritage-algeria.com>",
)

ACCESS_TOKEN_LIFETIME_MINUTES = env.int("ACCESS_TOKEN_LIFETIME_MINUTES", default=60)
REFRESH_TOKEN_LIFETIME_DAYS = env.int("REFRESH_TOKEN_LIFETIME_DAYS", default=7)

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=ACCESS_TOKEN_LIFETIME_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=REFRESH_TOKEN_LIFETIME_DAYS),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "BLACKLIST_ENABLED": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "pk",
    "USER_ID_CLAIM": "user_id",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

CORS_ALLOW_ALL_ORIGINS = True

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# ---------------------------------------------------------------------------
# Cloudinary
# ---------------------------------------------------------------------------

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': env('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': env('CLOUDINARY_API_KEY'),
    'API_SECRET': env('CLOUDINARY_API_SECRET'),
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------
GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
GEMINI_API_KEY = env("GEMINI_API_KEY", default="")
GEMINI_MODEL = env("GEMINI_MODEL", default="gemini-2.5-flash")
