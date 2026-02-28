from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone


class Post(models.Model):
    class PostType(models.TextChoices):
        DISCOVERIES = "discoveries", "Discoveries"
        VISITS      = "visits", "Visits"
        QUESTIONS   = "questions", "Questions"
        ALERT       = "alert", "Alert"
        EVENTS      = "events", "Events"

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

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=300)
    content = models.TextField()
    post_type = models.CharField(max_length=20, choices=PostType.choices)

    historical_period = models.CharField(
        max_length=20, choices=HistoricalPeriod.choices, blank=True, default=""
    )
    monument_type = models.CharField(
        max_length=20, choices=MonumentType.choices, blank=True, default=""
    )
    region = models.CharField(
        max_length=20, choices=Region.choices, blank=True, default=""
    )

    visibility = models.CharField(max_length=20, choices=Visibility.choices)
    location = models.CharField(max_length=255, blank=True, default="")
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()

        # During creation, Post has no pk yet, so it cannot have OneToOne children yet.
        if not self.pk:
            return

        # If post_type is EVENTS, it must have event_details
        if self.post_type == Post.PostType.EVENTS:
            if not hasattr(self, "event_details"):
                raise ValidationError({"post_type": "EventDetails is required when post_type is Events."})

        # If post_type is ALERT, it must have alert_details
        if self.post_type == Post.PostType.ALERT:
            if not hasattr(self, "alert_details"):
                raise ValidationError({"post_type": "AlertDetails is required when post_type is Alert."})

    def save(self, *args, **kwargs):
        # Forces model validation every save (okay now that clean() is safe)
        self.full_clean()
        return super().save(*args, **kwargs)

    @property
    def countdown_seconds(self):
        if self.post_type != Post.PostType.EVENTS:
            return None
        if not hasattr(self, "event_details"):
            return None
        starts_at = self.event_details.starts_at
        return max(0, int((starts_at - timezone.now()).total_seconds()))

    def __str__(self):
        return f"{self.title} ({self.post_type})"

    @property
    def gems_count(self):
        return self.gems.count()

    @property
    def comments_count(self):
        return self.comments.count()


class EventDetails(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="event_details")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        super().clean()
        if self.post.post_type != Post.PostType.EVENTS:
            raise ValidationError({"post": "Linked Post must have post_type = Events."})
        if self.ends_at and self.ends_at < self.starts_at:
            raise ValidationError({"ends_at": "ends_at must be after starts_at."})


class AlertDetails(models.Model):
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

    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="alert_details")
    urgence_level = models.CharField(max_length=20, choices=UrgenceLevel.choices)
    current_status = models.CharField(max_length=25, choices=CurrentStatus.choices, default=CurrentStatus.ALERT)

    def clean(self):
        super().clean()
        if self.post.post_type != Post.PostType.ALERT:
            raise ValidationError({"post": "Linked Post must have post_type = Alert."})


class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="post_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        # limit to 5 images per post (excluding self when editing existing image row)
        if self.post_id and self.post.images.exclude(pk=self.pk).count() >= 5:
            raise ValidationError("A post can have a maximum of 5 images.")


class Gem(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="gems")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["post", "user"], name="unique_gem_per_user_post")
        ]


class Save(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="saves")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["post", "user"], name="unique_save_per_user_post")
        ]


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)