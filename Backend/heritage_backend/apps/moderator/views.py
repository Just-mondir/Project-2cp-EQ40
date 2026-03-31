from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from apps.core.responses import api_error, api_success
from apps.users.models import User
from apps.posts.models import Post
from .models import Visitor
from .serializers import ModeratorUserSerializer
from django.utils import timezone

class PlatformStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request: Request) -> Response:
        stats = {
            "members": User.objects().count(),
            "visitors": Visitor.objects().count(),
            "posts": Post.objects(is_deleted=False).count(),
        }
        return api_success("Platform stats retrieved.", stats)

class TrackVisitorView(APIView):
    authentication_classes = []
    permission_classes = []
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
    def post(self, request):
        ip = self.get_client_ip(request)
        today = timezone.now().replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )
        visitor = Visitor.objects(ip_address=ip, date=today).first()
        if not visitor:
            Visitor(
                ip_address=ip,
                date=today,
            ).save()
        return Response(
            {"message": "Visitor tracked successfully."},
            status=status.HTTP_200_OK,
        )
    
class UserPagination(PageNumberPagination):
    page_size = 20


class UserListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request: Request) -> Response:
        query = request.query_params.get("q", "").strip()
        users = User.objects(is_active=True)
        if query:
            users = users.filter(
                __raw__={
                    "$or": [
                        {"username": {"$regex": query, "$options": "i"}},
                        {"display_name": {"$regex": query, "$options": "i"}},
                    ]
                }
            )
        paginator = UserPagination()
        page = paginator.paginate_queryset(users, request)
        users_data = []
        for user in page:
            post_count = Post.objects(author_id=str(user.id)).count()
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
        serializer = ModeratorUserSerializer(
            users_data, many=True, context={"request": request}
        )
        return paginator.get_paginated_response(serializer.data)