from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth.models import User

from .models import Post
from .serializers import PostSerializer



@api_view(['GET'])
def global_search(request):
    query = request.GET.get("q", "").strip()

    posts = Post.objects.filter(is_deleted=False)

    if query:
        posts = posts.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query)
        )

    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def search_users(request):
    query = request.GET.get("q", "").strip()

    users = User.objects.all()

    if query:
        users = users.filter(
            Q(username__icontains=query)
        )

    data = [
        {
            "id": user.id,
            "username": user.username,
        }
        for user in users
    ]

    return Response(data)