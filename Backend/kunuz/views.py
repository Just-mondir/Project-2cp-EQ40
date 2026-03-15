from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Annotation
from .serializers import AnnotationSerializer


class AnnotationViewSet(viewsets.ModelViewSet):
    serializer_class = AnnotationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated:
            return Annotation.objects.filter(
                Q(status=Annotation.Status.ACCEPTED) |
                Q(user=user) |
                Q(post__user=user)
            ).distinct().order_by("-created_at")

        return Annotation.objects.filter(
            status=Annotation.Status.ACCEPTED
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            status=Annotation.Status.PENDING
        )

    def update(self, request, *args, **kwargs):
        annotation = self.get_object()

        if annotation.user != request.user:
            return Response(
                {"detail": "You can only edit your own annotation."},
                status=status.HTTP_403_FORBIDDEN
            )

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(annotation, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        serializer.save(
            status=Annotation.Status.PENDING,
            validated_by=None,
            validated_at=None
        )

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        annotation = self.get_object()

        if annotation.user != request.user:
            return Response(
                {"detail": "You can only delete your own annotation."},
                status=status.HTTP_403_FORBIDDEN
            )

        annotation.delete()
        return Response({"detail": "Annotation deleted."}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        annotation = self.get_object()

        if annotation.post.user != request.user:
            return Response(
                {"detail": "Only the creator of the post can validate this annotation."},
                status=status.HTTP_403_FORBIDDEN
            )

        annotation.status = Annotation.Status.ACCEPTED
        annotation.validated_by = request.user
        annotation.validated_at = timezone.now()
        annotation.save()

        return Response({"detail": "Annotation accepted and now visible publicly."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        annotation = self.get_object()

        if annotation.post.user != request.user:
            return Response(
                {"detail": "Only the creator of the post can reject this annotation."},
                status=status.HTTP_403_FORBIDDEN
            )

        annotation.status = Annotation.Status.REJECTED
        annotation.validated_by = request.user
        annotation.validated_at = timezone.now()
        annotation.save()

        return Response({"detail": "Annotation rejected and remains hidden publicly."})