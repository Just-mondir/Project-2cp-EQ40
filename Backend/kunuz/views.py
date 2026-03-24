from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Post
from .serializers import PostSerializer


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