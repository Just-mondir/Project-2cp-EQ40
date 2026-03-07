from django.views.generic import ListView, CreateView,UpdateView,DeleteView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import ValidationError
from django.db import transaction
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from .models import Post, PostImage, EventDetails, AlertDetails, Gem, Save
from .forms import PostCreateForm, PostEditForm
from django.http import JsonResponse
from django.views.decorators.http import require_POST


class HomeView(ListView):
    model = Post
    template_name = "home.html"
    ordering = ["-created_at"]

class ProfileView(ListView):
    model = Post
    template_name = "profile.html"
    context_object_name = "my_posts"
    def get_queryset(self):
        return Post.objects.filter(user=self.request.user).order_by("-created_at")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        gemed_post_ids = Gem.objects.filter(user=self.request.user).values_list("post_id", flat=True)
        context["gemed_posts"] = Post.objects.filter(id__in=gemed_post_ids).order_by("-created_at")
        saved_post_ids = Save.objects.filter(user=self.request.user).values_list("post_id", flat=True)
        context["saved_posts"] = Post.objects.filter(id__in=saved_post_ids).order_by("-created_at")
        context["my_event"] = Post.objects.filter(user=self.request.user, post_type=Post.PostType.EVENT).order_by("-created_at")
        context["my_alerts"] = Post.objects.filter(user=self.request.user, post_type=Post.PostType.ALERT).order_by("-created_at")
        return context
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
    success_url = reverse_lazy("profile")
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
    # template_name = "delete-post.html"
    success_url = reverse_lazy("profile")
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