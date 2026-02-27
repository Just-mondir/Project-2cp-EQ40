from django.views.generic import ListView, CreateView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import ValidationError
from django.db import transaction

from .models import Post, PostImage, EventDetails, AlertDetails
from .forms import PostCreateForm


class HomeView(ListView):
    model = Post
    template_name = "home.html"
    ordering = ["-created_at"]


class AddPostView(LoginRequiredMixin, CreateView):
    model = Post
    form_class = PostCreateForm          # ✅ use the form (not fields=...)
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
                if self.object.post_type == Post.PostType.EVENTS:
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