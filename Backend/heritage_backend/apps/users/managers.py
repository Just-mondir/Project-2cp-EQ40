"""Custom QuerySet for the User MongoEngine document."""

from __future__ import annotations

from typing import Any

from mongoengine import QuerySet


class UserQuerySet(QuerySet):
    """Extends MongoEngine QuerySet with create_user / create_superuser helpers."""

    def create_user(self, email: str, password: str | None = None, **extra_fields: Any):
        """Create and return a regular user (delegates to User.create_user)."""
        return self._document.create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str | None = None, **extra_fields: Any):
        """Create and return a superuser (delegates to User.create_superuser)."""
        return self._document.create_superuser(email, password, **extra_fields)
