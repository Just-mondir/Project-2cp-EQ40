from django import forms
from django.utils import timezone
from .models import Post, AlertDetails, UserProfile
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm
from django.contrib.auth.models import User




class SignupForm(UserCreationForm):
    email = forms.EmailField()
    expertise = forms.ChoiceField(choices=UserProfile.EXPERTISE_CHOICES)
    speciality = forms.CharField(max_length=100, required=False)
    bio = forms.CharField(widget=forms.Textarea, required=False)
    profile_picture = forms.ImageField(required=False)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password1",
            "password2",
            "expertise",
            "speciality",
            "bio",
            "profile_picture",
        ]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]

        if commit:
            user.save()

            UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    "expertise": self.cleaned_data["expertise"],
                    "speciality": self.cleaned_data["speciality"],
                    "bio": self.cleaned_data["bio"],
                    "profile_picture": self.cleaned_data["profile_picture"],
                },
            )

        return user


class LoginUserForm(AuthenticationForm):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)


class EditUserProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["email"]


class PasswordChangingForm(PasswordChangeForm):
    old_password = forms.CharField(widget=forms.PasswordInput)
    new_password1 = forms.CharField(widget=forms.PasswordInput)
    new_password2 = forms.CharField(widget=forms.PasswordInput)


class UserPublicDetailsForm(forms.ModelForm):
    username = forms.CharField(max_length=150)

    class Meta:
        model = UserProfile
        fields = ["expertise", "speciality", "bio", "profile_picture"]

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user", None)
        super().__init__(*args, **kwargs)

        if user:
            self.fields["username"].initial = user.username

    def save(self, commit=True):
        profile = super().save(commit=False)

        if "username" in self.cleaned_data:
            profile.user.username = self.cleaned_data["username"]
            profile.user.save()

        if commit:
            profile.save()

        return profile

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