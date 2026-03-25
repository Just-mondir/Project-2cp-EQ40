from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required

from .models import Post, Comment, CommentGem, CommentReport
from .serializers import PostSerializer
from .forms import CommentForm


class PostFilterView(generics.ListAPIView):
    queryset = Post.objects.filter(is_deleted=False).order_by("-created_at")
    serializer_class = PostSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["region", "historical_period", "monument_type", "post_type", "visibility"]
    search_fields = ["title", "content", "location"]
    ordering_fields = ["created_at", "updated_at"]


class FilterChoicesView(APIView):
    def get(self, request):
        return Response(
            {
                "regions": [{"value": value, "label": label} for value, label in Post.Region.choices],
                "historical_periods": [
                    {"value": value, "label": label}
                    for value, label in Post.HistoricalPeriod.choices
                ],
                "monument_types": [
                    {"value": value, "label": label}
                    for value, label in Post.MonumentType.choices
                ],
                "post_types": [{"value": value, "label": label} for value, label in Post.PostType.choices],
                "visibilities": [{"value": value, "label": label} for value, label in Post.Visibility.choices],
            }
        )


def post_detail(request, pk):
    post = get_object_or_404(Post, pk=pk, is_deleted=False)
    comments = post.comments.filter(parent__isnull=True)

    if request.method == "POST":
        if not request.user.is_authenticated:
            return redirect("login")

        form = CommentForm(request.POST)
        parent_id = request.POST.get("parent_id")

        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post
            comment.user = request.user

            if parent_id:
                parent_comment = get_object_or_404(Comment, pk=parent_id, post=post)
                comment.parent = parent_comment

            comment.save()
            return redirect("post_detail", pk=post.pk)
    else:
        form = CommentForm()

    return render(request, "post_detail.html", {
        "post": post,
        "comments": comments,
        "form": form,
    })


@login_required
def gem_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)

    gem, created = CommentGem.objects.get_or_create(
        comment=comment,
        user=request.user
    )

    if not created:
        gem.delete()

    return redirect("post_detail", pk=comment.post.pk)


@login_required
def edit_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)

    if comment.user != request.user:
        return redirect("post_detail", pk=comment.post.pk)

    if request.method == "POST":
        form = CommentForm(request.POST, instance=comment)
        if form.is_valid():
            form.save()
            return redirect("post_detail", pk=comment.post.pk)
    else:
        form = CommentForm(instance=comment)

    return render(request, "edit_comment.html", {
        "form": form,
        "comment": comment,
    })


@login_required
def delete_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)

    if comment.user != request.user:
        return redirect("post_detail", pk=comment.post.pk)

    post_pk = comment.post.pk
    comment.delete()
    return redirect("post_detail", pk=post_pk)


@login_required
def report_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)

    if request.method == "POST":
        reason = request.POST.get("reason")
        description = request.POST.get("description", "")

        CommentReport.objects.get_or_create(
            comment=comment,
            reporter=request.user,
            defaults={
                "reason": reason,
                "description": description,
            }
        )

    return redirect("post_detail", pk=comment.post.pk)