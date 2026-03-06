from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse_lazy
from django.views import generic
from django.contrib.auth.views import PasswordChangeView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.contrib.messages.views import SuccessMessageMixin


from .forms import (
    SignupForm,
    LoginUserForm,
    PasswordChangingForm,
    EditUserProfileForm,
    UserPublicDetailsForm,
)

from .models import UserProfile


def home(request):
    return render(request, "kunuz/home.html")


class SignUp(SuccessMessageMixin, generic.CreateView):
    form_class = SignupForm
    template_name = "kunuz/register.html"
    success_url = reverse_lazy("login")
    success_message = "Account created successfully"


class LogIn(generic.View):
    form_class = LoginUserForm
    template_name = "kunuz/login.html"

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {"form": form})

    def post(self, request):
        form = self.form_class(request=request, data=request.POST)

        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")

            user = authenticate(username=username, password=password)

            if user:
                login(request, user)
                return redirect("home")

        messages.error(request, "Invalid username or password")
        return render(request, self.template_name, {"form": form})


class LogOut(LoginRequiredMixin, generic.View):
    def get(self, request):
        logout(request)
        return redirect("home")


class Profile(LoginRequiredMixin, generic.View):
    template_name = "kunuz/profile.html"

    def get(self, request, user_name):
        user_obj = get_object_or_404(User, username=user_name)
        profile = get_object_or_404(UserProfile, user=user_obj)

        context = {
            "profile_user": user_obj,
            "user_profile_data": profile,
        }

        return render(request, self.template_name, context)


class UpdateUserView(LoginRequiredMixin, SuccessMessageMixin, generic.UpdateView):
    model = User
    form_class = EditUserProfileForm
    template_name = "kunuz/edit_user_profile.html"
    success_url = reverse_lazy("home")
    success_message = "User updated successfully"

    def get_object(self):
        return self.request.user


class UpdatePublicDetails(LoginRequiredMixin, SuccessMessageMixin, generic.UpdateView):
    model = UserProfile
    form_class = UserPublicDetailsForm
    template_name = "kunuz/edit_public_details.html"
    success_url = reverse_lazy("home")
    success_message = "Profile updated successfully"

    def get_object(self):
        return self.request.user.userprofile


class UserPasswordChangeView(LoginRequiredMixin, PasswordChangeView):
    form_class = PasswordChangingForm
    template_name = "kunuz/change_password.html"
    success_url = reverse_lazy("password_success")


def password_success(request):
    return render(request, "kunuz/password_change_success.html")


class DeleteUser(LoginRequiredMixin, generic.DeleteView):
    model = User
    template_name = "kunuz/delete_user_confirm.html"
    success_url = reverse_lazy("home")

    def get_object(self):
        return self.request.user


class Dashboard(LoginRequiredMixin, generic.View):
    template_name = "kunuz/dashboard.html"

    def get(self, request):
        return render(request, self.template_name)
    
