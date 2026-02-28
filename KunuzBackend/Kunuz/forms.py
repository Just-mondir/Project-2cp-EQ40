from django import forms
from django.utils import timezone
from .models import Post, AlertDetails

class PostCreateForm(forms.ModelForm):
    # event fields
    starts_at = forms.DateTimeField(required=False, widget=forms.DateTimeInput(attrs={"type": "datetime-local"}))
    ends_at = forms.DateTimeField(required=False, widget=forms.DateTimeInput(attrs={"type": "datetime-local"}))

    # alert field (only this)
    urgence_level = forms.ChoiceField(required=False, choices=AlertDetails.UrgenceLevel.choices)

    class Meta:
        model = Post
        fields = [
            "title", "content", "post_type", "visibility",
            "historical_period", "monument_type", "region",
            "location", "latitude", "longitude",
        ]

    def clean(self):
        cleaned = super().clean()
        post_type = cleaned.get("post_type")

        # EVENTS validation
        starts_at = cleaned.get("starts_at")
        ends_at = cleaned.get("ends_at")
        if post_type == Post.PostType.EVENTS:
            if not starts_at:
                self.add_error("starts_at", "Start time is required for events.")
            if ends_at and starts_at and ends_at < starts_at:
                self.add_error("ends_at", "End time must be after start time.")
            if starts_at and starts_at < timezone.now():
                self.add_error("starts_at", "Start time cannot be in the past.")

        # ALERT validation
        if post_type == Post.PostType.ALERT:
            if not cleaned.get("urgence_level"):
                self.add_error("urgence_level", "Urgence level is required for alerts.")

        return cleaned
    
class PostEditForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = [
            "title",
            "content",
            "location",
            "region",
            "historical_period",
            "monument_type",
        ]