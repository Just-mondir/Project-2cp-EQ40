from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from apps.core.responses import api_error, api_success

from apps.users.models import User, Visitor
from apps.posts.models import Post

class PlatformStatsView(APIView):
    def get(self, request: Request):
        stats = {
            "members": User.objects.count(),
            "posts": Post.objects.filter(is_deleted=False).count(),
            "visitors": Visitor.objects.count(),
        }
        return Response(stats, status=status.HTTP_200_OK)