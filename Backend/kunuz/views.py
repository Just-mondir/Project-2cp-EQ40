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


from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Post
from .serializers import PostSerializer

@api_view(['GET'])
def global_search(request):
    """
    Endpoint pour la recherche globale et filtres.
    Query params :
    - q : mot-clé (titre + contenu)
    - historical_period : prehistory, roman, islamic, ottoman, contemporary
    - region : algiers, oran, constantine, tlemcen
    - monument_type : civil, military, religious, funerary
    """
    posts = Post.objects.filter(is_deleted=False)

    # Recherche par mots-clés
    query = request.GET.get("q", "")
    if query:
        posts = posts.filter(
            Q(title__icontains=query) | Q(content__icontains=query)
        )

    # Filtres indépendants
    historical_period = request.GET.get("historical_period")
    if historical_period:
        posts = posts.filter(historical_period=historical_period)

    region = request.GET.get("region")
    if region:
        posts = posts.filter(region=region)

    monument_type = request.GET.get("monument_type")
    if monument_type:
        posts = posts.filter(monument_type=monument_type)

    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)