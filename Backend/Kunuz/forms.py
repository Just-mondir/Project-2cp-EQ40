from django import forms
from django.utils import timezone
from .models import Post, AlertDetails


class PostCreateForm(forms.ModelForm):
    starts_at = forms.DateTimeField(required=False, widget=forms.DateTimeInput(attrs={"type": "datetime-local"}))
    ends_at = forms.DateTimeField(required=False, widget=forms.DateTimeInput(attrs={"type": "datetime-local"}))
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

        if post_type == Post.PostType.EVENT:
            starts_at = cleaned.get("starts_at")
            ends_at = cleaned.get("ends_at")
            if not starts_at:
                self.add_error("starts_at", "Start time is required for events.")
            else:
                if starts_at < timezone.now():
                    self.add_error("starts_at", "Start time cannot be in the past.")
                if ends_at and ends_at < starts_at:
                    self.add_error("ends_at", "End time must be after start time.")

        if post_type == Post.PostType.ALERT:
            if not cleaned.get("urgence_level"):
                self.add_error("urgence_level", "Urgence level is required for alerts.")

        return cleaned


class PostEditForm(forms.ModelForm):
    starts_at = forms.DateTimeField(required=False, widget=forms.DateTimeInput(attrs={"type": "datetime-local"}))
    ends_at = forms.DateTimeField(required=False, widget=forms.DateTimeInput(attrs={"type": "datetime-local"}))
    urgence_level = forms.ChoiceField(required=False, choices=AlertDetails.UrgenceLevel.choices)
    current_status = forms.ChoiceField(required=False, choices=AlertDetails.CurrentStatus.choices)

    class Meta:
        model = Post
        fields = [
            "title", "content", "post_type", "visibility",
            "historical_period", "monument_type", "region",
            "location",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Pre-populate event/alert fields from existing related objects
        if self.instance and self.instance.pk:
            if self.instance.post_type == Post.PostType.EVENT and hasattr(self.instance, "event_details"):
                ed = self.instance.event_details
                self.fields["starts_at"].initial = ed.starts_at
                self.fields["ends_at"].initial = ed.ends_at
            elif self.instance.post_type == Post.PostType.ALERT and hasattr(self.instance, "alert_details"):
                ad = self.instance.alert_details
                self.fields["urgence_level"].initial = ad.urgence_level
                self.fields["current_status"].initial = ad.current_status

    def clean(self):
        cleaned = super().clean()
        post_type = cleaned.get("post_type")

        if post_type == Post.PostType.EVENT:
            starts_at = cleaned.get("starts_at")
            ends_at = cleaned.get("ends_at")
            if not starts_at:
                self.add_error("starts_at", "Start time is required for events.")
            else:
                if ends_at and ends_at < starts_at:
                    self.add_error("ends_at", "End time must be after start time.")

        if post_type == Post.PostType.ALERT:
            if not cleaned.get("urgence_level"):
                self.add_error("urgence_level", "Urgence level is required for alerts.")
            if not cleaned.get("current_status"):
                self.add_error("current_status", "Current status is required for alerts.")

        return cleaned