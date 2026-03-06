from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm
from django.contrib.auth.models import User
from .models import UserProfile


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