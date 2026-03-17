from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from apps.core.responses import api_error, api_success

from apps.users.models import User, Visitor
from apps.posts.models import Post
from .serializers import (
    ModeratorUserSerializer,
)

class PlatformStatsView(APIView):
    def get(self, request: Request) -> Response:
        stats = {
            "members": User.objects.count(),
            "posts": Post.objects.filter(is_deleted=False).count(),
            "visitors": Visitor.objects.count(),
        }
        return Response(stats, status=status.HTTP_200_OK)
    
class UserPagination(PageNumberPagination):
    page_size = 20

class UserListView(APIView):
    def get(self, request: Request) -> Response:
        users = User.objects.all()
        paginator = UserPagination()
        page = paginator.paginate_queryset(users, request)
        users_data = []
        for user in page:
            post_count = Post.objects.filter(author_id=str(user.id)).count()
            users_data.append({
                "id": str(user.id),
                "display_name": user.display_name,
                "username": user.username,
                "expertise": user.expertise,
                "profile_picture": user.profile_picture,
                "role": user.role,
                "created_at": user.created_at,
                "post_count": post_count,
            })
        serializer = ModeratorUserSerializer(users_data, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)   