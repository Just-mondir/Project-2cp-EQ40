from django.views.generic import ListView, CreateView,UpdateView,DeleteView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import ValidationError
from django.db import transaction
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from .models import Post, PostImage, EventDetails, AlertDetails, Gem, Save,User
from .forms import PostCreateForm, PostEditForm
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.views import generic
from django.contrib.auth.views import PasswordChangeView
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
    posts = Post.objects.all().order_by("-created_at")
    return render(request, "home.html", {"object_list": posts})


class SignUp(SuccessMessageMixin, generic.CreateView):
    form_class = SignupForm
    template_name = "register.html"
    success_url = reverse_lazy("login")
    success_message = "Account created successfully"


class LogIn(generic.View):
    form_class = LoginUserForm
    template_name = "login.html"

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
    template_name = "profile.html"
    def get(self, request, user_name):
        user_obj = get_object_or_404(User, username=user_name)
        profile = get_object_or_404(UserProfile, user=user_obj)
        gemed_post_ids = Gem.objects.filter(user=user_obj).values_list("post_id", flat=True)
        saved_post_ids = Save.objects.filter(user=user_obj).values_list("post_id", flat=True)
        context = {
            "profile_user": user_obj,
            "user_profile_data": profile,
            "my_posts": Post.objects.filter(user=user_obj).order_by("-created_at"),
            "gemed_posts": Post.objects.filter(id__in=gemed_post_ids).order_by("-created_at"),
            "saved_posts": Post.objects.filter(id__in=saved_post_ids).order_by("-created_at"),
            "my_event": Post.objects.filter(user=user_obj, post_type=Post.PostType.EVENT).order_by("-created_at"),
            "my_alerts": Post.objects.filter(user=user_obj, post_type=Post.PostType.ALERT).order_by("-created_at"),
        }
        return render(request, self.template_name, context)

class UpdateUserView(LoginRequiredMixin, SuccessMessageMixin, generic.UpdateView):
    model = User
    form_class = EditUserProfileForm
    template_name = "edit_user_profile.html"
    success_url = reverse_lazy("home")
    success_message = "Email updated successfully"
    def get_object(self):
        return self.request.user


class UpdatePublicDetails(LoginRequiredMixin, SuccessMessageMixin, generic.UpdateView):
    model = UserProfile
    form_class = UserPublicDetailsForm
    template_name = "edit_public_details.html"
    success_url = reverse_lazy("home")
    success_message = "Profile updated successfully"

    def get_object(self):
        return self.request.user.userprofile

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["user"] = self.request.user
        return kwargs


class UserPasswordChangeView(LoginRequiredMixin, PasswordChangeView):
    form_class = PasswordChangingForm
    template_name = "change_password.html"
    success_url = reverse_lazy("password_success")


def password_success(request):
    return render(request, "password_change_success.html")


class DeleteUser(LoginRequiredMixin, generic.DeleteView):
    model = User
    template_name = "delete_user_confirm.html"
    success_url = reverse_lazy("home")

    def get_object(self):
        return self.request.user


class Dashboard(LoginRequiredMixin, generic.View):
    template_name = "dashboard.html"

    def get(self, request):
        users = User.objects.all().select_related("userprofile")
        return render(request, self.template_name, {"users": users})

@login_required
@require_POST
def gem_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    gem = Gem.objects.filter(post=post, user=request.user)
    if gem.exists():
        gem.delete()
        liked = False
    else:
        Gem.objects.create(post=post, user=request.user)
        liked = True
    return JsonResponse({
        "liked": liked,
        "count": post.gems.count()
    })

@login_required
@require_POST
def save_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    save = Save.objects.filter(post=post, user=request.user)
    if save.exists():
        save.delete()
        saved = False
    else:
        Save.objects.create(post=post, user=request.user)
        saved = True
    return JsonResponse({
        "saved": saved,
    })

class AddPostView(LoginRequiredMixin, CreateView):
    model = Post
    form_class = PostCreateForm 
    template_name = "add-post.html"
    success_url = reverse_lazy("home")
    def form_valid(self, form):
        form.instance.user = self.request.user
        images = self.request.FILES.getlist("images")
        if len(images) > 5:
            form.add_error(None, "You can upload up to 5 images only.")
            return self.form_invalid(form)
        try:
            with transaction.atomic():
                response = super().form_valid(form)
                if self.object.post_type == Post.PostType.EVENT:
                    EventDetails.objects.create(
                        post=self.object,
                        starts_at=form.cleaned_data["starts_at"],
                        ends_at=form.cleaned_data.get("ends_at"),
                    )
                if self.object.post_type == Post.PostType.ALERT:
                    AlertDetails.objects.create(
                        post=self.object,
                        urgence_level=form.cleaned_data["urgence_level"],
                    )
                for img in images:
                    post_image = PostImage(post=self.object, image=img)
                    post_image.full_clean()
                    post_image.save()
                return response
        except ValidationError as e:
            form.add_error(None, e.message_dict if hasattr(e, "message_dict") else str(e))
            return self.form_invalid(form)
        
class EditPostView(LoginRequiredMixin, UpdateView):
    model = Post
    form_class = PostEditForm
    template_name = "edit-post.html"
    def get_success_url(self):
        return reverse_lazy("profile", kwargs={"user_name": self.request.user.username})
    def get_queryset(self):
        return Post.objects.filter(user=self.request.user)
    def form_valid(self, form):
        with transaction.atomic():
            response = super().form_valid(form)
            post = self.object
            if post.post_type == Post.PostType.EVENT:
                starts_at = form.cleaned_data.get("starts_at")
                ends_at = form.cleaned_data.get("ends_at")
            # Use update_or_create so starts_at is always set
                EventDetails.objects.update_or_create(
                    post=post,
                    defaults={
                        "starts_at": starts_at,
                        "ends_at": ends_at,
                    }
                )
                AlertDetails.objects.filter(post=post).delete()
            elif post.post_type == Post.PostType.ALERT:
                urgence_level = form.cleaned_data.get("urgence_level")
                current_status = form.cleaned_data.get("current_status")
                AlertDetails.objects.update_or_create(
                    post=post,
                    defaults={
                        "urgence_level": urgence_level,
                        "current_status": current_status,
                    }
                )
                EventDetails.objects.filter(post=post).delete()
            else:
                EventDetails.objects.filter(post=post).delete()
                AlertDetails.objects.filter(post=post).delete()
            return response
        
class DeletePostView(LoginRequiredMixin, DeleteView):
    model = Post
    def get_success_url(self):
        return reverse_lazy("profile", kwargs={"user_name": self.request.user.username})
    def get_queryset(self):
        return Post.objects.filter(user=self.request.user)
    

@login_required
@require_POST
def add_images(request, pk):
    post = get_object_or_404(Post, pk=pk, user=request.user)
    images = request.FILES.getlist("images")
    for f in images:
        PostImage.objects.create(post=post, image=f)
    return redirect("edit-post", pk=post.pk)


@login_required
@require_POST
def delete_image(request, image_id):
    img = get_object_or_404(PostImage, pk=image_id, post__user=request.user)
    post_id = img.post_id
    img.delete()
    return redirect("edit-post", pk=post_id)