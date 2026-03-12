"""Models for the posts feature."""

from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Post(models.Model):
    """A user-created post about Algerian heritage."""

    class PostType(models.TextChoices):
        DISCOVERY = "discovery", "Discovery"
        VISIT = "visit", "Visit"
        QUESTION = "question", "Question"
        ALERT = "alert", "Alert"
        EVENT = "event", "Event"

    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public"
        GROUPS = "groups", "Specific Groups"

    class HistoricalPeriod(models.TextChoices):
        PREHISTORY = "prehistory", "Prehistory"
        ROMAN = "roman", "Roman"
        ISLAMIC = "islamic", "Islamic"
        OTTOMAN = "ottoman", "Ottoman"
        CONTEMPORARY = "contemporary", "Contemporary"

    class MonumentType(models.TextChoices):
        CIVIL = "civil", "Civil"
        MILITARY = "military", "Military"
        RELIGIOUS = "religious", "Religious"
        FUNERARY = "funerary", "Funerary"

    class Region(models.TextChoices):
        ALGIERS = "algiers", "Algiers"
        ORAN = "oran", "Oran"
        CONSTANTINE = "constantine", "Constantine"
        TLEMCEN = "tlemcen", "Tlemcen"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    title = models.CharField(max_length=300)
    content = models.TextField()
    post_type = models.CharField(max_length=20, choices=PostType.choices)

    historical_period = models.CharField(
        max_length=20,
        choices=HistoricalPeriod.choices,
        blank=True,
        default="",
    )
    monument_type = models.CharField(
        max_length=20,
        choices=MonumentType.choices,
        blank=True,
        default="",
    )
    region = models.CharField(
        max_length=20,
        choices=Region.choices,
        blank=True,
        default="",
    )

    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PUBLIC,
    )
    location = models.CharField(max_length=255, blank=True, default="")

    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self) -> None:
        super().clean()
        if not self.pk:
            return
        if self.post_type == Post.PostType.EVENT:
            if not hasattr(self, "event_details"):
                raise ValidationError(
                    {"post_type": "EventDetails is required when post_type is Event."}
                )
        if self.post_type == Post.PostType.ALERT:
            if not hasattr(self, "alert_details"):
                raise ValidationError(
                    {"post_type": "AlertDetails is required when post_type is Alert."}
                )

    @property
    def countdown_seconds(self) -> int | None:
        if self.post_type != Post.PostType.EVENT:
            return None
        if not hasattr(self, "event_details"):
            return None
        starts_at = self.event_details.starts_at
        return max(0, int((starts_at - timezone.now()).total_seconds()))

    @property
    def gems_count(self) -> int:
        return self.gems.count()

    @property
    def comments_count(self) -> int:
        return self.comments.count()

    def __str__(self) -> str:
        return f"{self.title} ({self.post_type})"


class EventDetails(models.Model):
    """Extra details for Event-type posts."""

    post = models.OneToOneField(
        Post, on_delete=models.CASCADE, related_name="event_details"
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)

    def clean(self) -> None:
        super().clean()
        if self.post.post_type != Post.PostType.EVENT:
            raise ValidationError({"post": "Linked Post must have post_type = Event."})
        if self.ends_at and self.ends_at < self.starts_at:
            raise ValidationError({"ends_at": "ends_at must be after starts_at."})

    def __str__(self) -> str:
        return f"EventDetails for post {self.post_id}"


class AlertDetails(models.Model):
    """Extra details for Alert-type posts."""

    class UrgenceLevel(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class CurrentStatus(models.TextChoices):
        RESTORED = "restored", "Restored"
        UNDER_INTERVENTION = "under_intervention", "Under intervention"
        DESTROYED = "destroyed", "Destroyed"
        ALERT = "alert", "Alert"

    post = models.OneToOneField(
        Post, on_delete=models.CASCADE, related_name="alert_details"
    )
    urgence_level = models.CharField(max_length=20, choices=UrgenceLevel.choices)
    current_status = models.CharField(
        max_length=25,
        choices=CurrentStatus.choices,
        default=CurrentStatus.ALERT,
    )

    def clean(self) -> None:
        super().clean()
        if self.post.post_type != Post.PostType.ALERT:
            raise ValidationError({"post": "Linked Post must have post_type = Alert."})

    def __str__(self) -> str:
        return f"AlertDetails for post {self.post_id}"


class PostImage(models.Model):
    """Images attached to a post (max 5)."""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="post_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def clean(self) -> None:
        super().clean()
        if self.post_id and self.post.images.exclude(pk=self.pk).count() >= 5:
            raise ValidationError("A post can have a maximum of 5 images.")

    def __str__(self) -> str:
        return f"Image for post {self.post_id}"


class Gem(models.Model):
    """A 'gem' reaction — like a like/upvote on a post."""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="gems")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="gems"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["post", "user"], name="unique_gem_per_user_post"
            )
        ]

    def __str__(self) -> str:
        return f"Gem by {self.user_id} on post {self.post_id}"


class Save(models.Model):
    """A bookmarked / saved post."""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="saves")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saves"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["post", "user"], name="unique_save_per_user_post"
            )
        ]

    def __str__(self) -> str:
        return f"Save by {self.user_id} on post {self.post_id}"


class Comment(models.Model):
    """A comment on a post."""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Comment by {self.user_id} on post {self.post_id}"
