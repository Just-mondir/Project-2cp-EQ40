from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q

from .models import Post, Comment
from .forms import CommentForm


@login_required
def post_detail(request, post_id):
    post = get_object_or_404(Post, id=post_id, is_deleted=False)
    comments = post.comments.all()
    images = post.images.all()

    if request.method == "POST":
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post
            comment.user = request.user
            comment.save()
            return redirect("post_detail", post_id=post.id)
    else:
        form = CommentForm()

    return render(request, "kunuz/post_detail.html", {
        "post": post,
        "comments": comments,
        "images": images,
        "form": form,
    })


def global_search(request):
    query = request.GET.get("q", "").strip()

    users = User.objects.none()
    posts = Post.objects.none()

    if query:
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )[:10]

        posts = Post.objects.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(location__icontains=query) |
            Q(historical_period__icontains=query) |
            Q(monument_type__icontains=query) |
            Q(region__icontains=query),
            is_deleted=False
        ).select_related("user")[:10]

    return render(request, "kunuz/search_results.html", {
        "query": query,
        "users": users,
        "posts": posts,
    })