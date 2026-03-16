from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q

from .models import Post
from .serializers import PostSerializer


def search_test_page(request):
    return render(request, "kunuz/search_test.html")


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