from django.db import models
from django.contrib.auth.models import User


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
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    expertise = models.CharField(max_length=20, choices=EXPERTISE_CHOICES, blank=True)
    speciality = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)

    def __str__(self):
        return self.user.username