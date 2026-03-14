"""DRF views for the posts app."""

from __future__ import annotations

from django.db import IntegrityError
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.responses import api_error, api_success

from .models import Comment, Gem, Post, PostImage, Save
from .serializers import (
    CommentSerializer,
    GemSerializer,
    PostDetailSerializer,
    PostImageSerializer,
    PostListSerializer,
    SaveSerializer,
)


class PostPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ---------------------------------------------------------------------------
# Posts
# ---------------------------------------------------------------------------


class PostListCreateView(APIView):
    """GET /api/posts/  — list all non-deleted posts (public).
    POST /api/posts/ — create a new post (auth required).
    """

    pagination_class = PostPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return []

    def get(self, request: Request) -> Response:
        posts = Post.objects.filter(is_deleted=False)
        post_type = request.query_params.get("post_type")
        if post_type:
            posts = posts.filter(post_type=post_type)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request: Request) -> Response:
        serializer = PostDetailSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)
        post = serializer.save(author_id=str(request.user.id))
        return api_success(
            "Post created successfully.",
            PostDetailSerializer(post, context={"request": request}).data,
            status.HTTP_201_CREATED,
        )


class PostDetailView(APIView):
    """GET/PATCH/DELETE /api/posts/<pk>/"""

    def _get_post(self, pk: int) -> Post | None:
        try:
            return Post.objects.get(pk=pk, is_deleted=False)
        except Post.DoesNotExist:
            return None

    def get(self, request: Request, pk: int) -> Response:
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        serializer = PostDetailSerializer(post, context={"request": request})
        return api_success("Post retrieved.", serializer.data)

    def patch(self, request: Request, pk: int) -> Response:
        if not request.user.is_authenticated:
            return api_error("Authentication required.", status_code=status.HTTP_401_UNAUTHORIZED)
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if post.author_id != str(request.user.id):
            return api_error("You can only edit your own posts.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = PostDetailSerializer(
            post, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)
        post = serializer.save()
        return api_success("Post updated.", PostDetailSerializer(post, context={"request": request}).data)

    def delete(self, request: Request, pk: int) -> Response:
        if not request.user.is_authenticated:
            return api_error("Authentication required.", status_code=status.HTTP_401_UNAUTHORIZED)
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if post.author_id != str(request.user.id) and not request.user.is_staff:
            return api_error("You can only delete your own posts.", status_code=status.HTTP_403_FORBIDDEN)
        # Soft-delete
        post.is_deleted = True
        post.save(update_fields=["is_deleted", "updated_at"])
        return api_success("Post deleted.", status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Post Images
# ---------------------------------------------------------------------------


class PostImageUploadView(APIView):
    """POST /api/posts/<pk>/images/ — upload images for a post."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request, pk: int) -> Response:
        try:
            post = Post.objects.get(pk=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if post.author_id != str(request.user.id):
            return api_error("You can only add images to your own posts.", status_code=status.HTTP_403_FORBIDDEN)
        images = request.FILES.getlist("images")
        if not images:
            return api_error("No images provided.", status_code=status.HTTP_400_BAD_REQUEST)
        if post.images.count() + len(images) > 5:
            return api_error(
                f"A post can have at most 5 images. "
                f"This post already has {post.images.count()}.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        created = [PostImage(post=post, image=img) for img in images]
        PostImage.objects.bulk_create(created)
        serializer = PostImageSerializer(
            post.images.all(), many=True, context={"request": request}
        )
        return api_success("Images uploaded.", serializer.data, status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Gem (like)
# ---------------------------------------------------------------------------


class GemToggleView(APIView):
    """POST /api/posts/<pk>/gem/ — toggle gem on a post."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: int) -> Response:
        try:
            post = Post.objects.get(pk=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        gem = Gem.objects.filter(post=post, user_id=str(request.user.id))
        if gem.exists():
            gem.delete()
            return api_success(
                "Gem removed.",
                {"liked": False, "gems_count": post.gems.count()},
            )
        try:
            Gem.objects.create(post=post, user_id=str(request.user.id))
        except IntegrityError:
            pass  # already exists (race condition)
        return api_success(
            "Gem added.",
            {"liked": True, "gems_count": post.gems.count()},
            status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Save (bookmark)
# ---------------------------------------------------------------------------


class SaveToggleView(APIView):
    """POST /api/posts/<pk>/save/ — toggle save on a post."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: int) -> Response:
        try:
            post = Post.objects.get(pk=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        save = Save.objects.filter(post=post, user_id=str(request.user.id))
        if save.exists():
            save.delete()
            return api_success("Post unsaved.", {"saved": False})
        try:
            Save.objects.create(post=post, user_id=str(request.user.id))
        except IntegrityError:
            pass
        return api_success("Post saved.", {"saved": True}, status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------


class CommentListCreateView(APIView):
    """GET /api/posts/<pk>/comments/ — list comments.
    POST /api/posts/<pk>/comments/ — add a comment (auth required).
    """

    def get(self, request: Request, pk: int) -> Response:
        try:
            post = Post.objects.get(pk=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        comments = post.comments.all()
        serializer = CommentSerializer(comments, many=True, context={"request": request})
        return api_success("Comments retrieved.", serializer.data)

    def post(self, request: Request, pk: int) -> Response:
        if not request.user.is_authenticated:
            return api_error("Authentication required.", status_code=status.HTTP_401_UNAUTHORIZED)
        try:
            post = Post.objects.get(pk=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        serializer = CommentSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)
        comment = serializer.save(post=post, user_id=str(request.user.id))
        return api_success(
            "Comment added.",
            CommentSerializer(comment, context={"request": request}).data,
            status.HTTP_201_CREATED,
        )


class CommentDetailView(APIView):
    """PATCH/DELETE /api/posts/comments/<pk>/"""

    permission_classes = [IsAuthenticated]

    def _get_comment(self, pk: int):
        from .models import Comment as CommentModel
        try:
            return CommentModel.objects.get(pk=pk)
        except CommentModel.DoesNotExist:
            return None

    def patch(self, request: Request, pk: int) -> Response:
        comment = self._get_comment(pk)
        if not comment:
            return api_error("Comment not found.", status_code=status.HTTP_404_NOT_FOUND)
        if comment.user_id != str(request.user.id):
            return api_error("You can only edit your own comments.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = CommentSerializer(
            comment, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)
        comment = serializer.save()
        return api_success("Comment updated.", CommentSerializer(comment, context={"request": request}).data)

    def delete(self, request: Request, pk: int) -> Response:
        comment = self._get_comment(pk)
        if not comment:
            return api_error("Comment not found.", status_code=status.HTTP_404_NOT_FOUND)
        if comment.user_id != str(request.user.id) and not request.user.is_staff:
            return api_error("You can only delete your own comments.", status_code=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return api_success("Comment deleted.", status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# User-specific feeds
# ---------------------------------------------------------------------------


class MyPostsView(APIView):
    """GET /api/posts/me/ — posts created by the requesting user."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        posts = Post.objects.filter(author_id=str(request.user.id), is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MySavedPostsView(APIView):
    """GET /api/posts/saved/ — posts saved by the requesting user."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        saved_post_ids = Save.objects.filter(user_id=str(request.user.id)).values_list("post_id", flat=True)
        posts = Post.objects.filter(id__in=saved_post_ids, is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)
