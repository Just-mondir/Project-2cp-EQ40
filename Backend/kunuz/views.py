from django.db.models import Q
from django.utils import timezone
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required

from rest_framework import generics, filters, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Post, Comment, CommentGem, CommentReport, Annotation
from .serializers import PostSerializer, AnnotationSerializer
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