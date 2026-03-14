from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone


class UserProfile(models.Model):
    EXPERTISE_CHOICES = [
        ("amateur", "Amateur"),
        ("student", "Student"),
        ("researcher", "Researcher"),
        ("architect", "Architect"),
        ("historian", "Historian"),
        ("guide", "Guide"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    expertise = models.CharField(max_length=30, choices=EXPERTISE_CHOICES, blank=True)
    speciality = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)

    def __str__(self):
        return self.user.username


class Post(models.Model):
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

        if not self.pk:
            return

        if self.post_type == Post.PostType.EVENT:
            if not hasattr(self, "event_details"):
                raise ValidationError({"post_type": "EventDetails is required when post_type is Event."})

        if self.post_type == Post.PostType.ALERT:
            if not hasattr(self, "alert_details"):
                raise ValidationError({"post_type": "AlertDetails is required when post_type is Alert."})

    def save(self, *args, **kwargs):
        return super().save(*args, **kwargs)

    @property
    def countdown_seconds(self):
        if self.post_type != Post.PostType.EVENT:
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
        return self.comments.filter(parent__isnull=True).count()


class EventDetails(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="event_details")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        super().clean()
        if self.post.post_type != Post.PostType.EVENT:
            raise ValidationError({"post": "Linked Post must have post_type = Event."})
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
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.post.title}"

    class Meta:
        ordering = ["-created_at"]

    @property
    def gems_count(self):
        return self.gems.count()

    @property
    def replies_count(self):
        return self.replies.count()


class CommentGem(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="gems")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["comment", "user"], name="unique_gem_per_user_comment")
        ]