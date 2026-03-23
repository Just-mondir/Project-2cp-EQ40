"""DRF views for the posts app."""

from __future__ import annotations

from rest_framework import status
import os
from django.conf import settings
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.responses import api_error, api_success
from apps.notifications.registry import notify

from .models import Comment, CommentGem, Gem, Post, PostImage, Save, EventDetails
from apps.users.models import User
from .serializers import (
    CommentSerializer,
    GemSerializer,
    CommentGemSerializer,
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
# Shared image-save helper  (mirrors PostImageUploadView logic exactly)
# ---------------------------------------------------------------------------

def _save_post_images(post: Post, image_files) -> None:
    """Write uploaded image files to disk and create PostImage records."""
    existing_count = PostImage.objects.filter(post=post).count()
    allowed = 5 - existing_count
    for img in list(image_files)[:allowed]:
        # Use a unique filename to avoid collisions: <post_id>_<original_name>
        safe_name = f"{post.id}_{img.name}"
        file_path = os.path.join(settings.MEDIA_ROOT, "post_images", safe_name)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb+") as f:
            for chunk in img.chunks():
                f.write(chunk)
        image_url = f"{settings.MEDIA_URL}post_images/{safe_name}"
        PostImage(post=post, image=image_url).save()


# ---------------------------------------------------------------------------
# Posts
# ---------------------------------------------------------------------------


class PostListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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

        # Save any uploaded images after the post is created
        image_files = request.FILES.getlist("uploaded_images")
        if image_files:
            _save_post_images(post, image_files)

        return api_success(
            "Post created successfully.",
            PostDetailSerializer(post, context={"request": request}).data,
            status.HTTP_201_CREATED,
        )


class PostDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_post(self, pk: str) -> Post | None:
        try:
            return Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return None

    def get(self, request: Request, pk: str) -> Response:
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        serializer = PostDetailSerializer(post, context={"request": request})
        return api_success("Post retrieved.", serializer.data)

    def patch(self, request: Request, pk: str) -> Response:
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

        # Save any newly uploaded images
        image_files = request.FILES.getlist("uploaded_images")
        if image_files:
            existing_count = PostImage.objects.filter(post=post).count()
            if existing_count + len(image_files) > 5:
                return api_error(
                    f"A post can have at most 5 images. This post already has {existing_count}.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            _save_post_images(post, image_files)

        return api_success("Post updated.", PostDetailSerializer(post, context={"request": request}).data)

    def delete(self, request: Request, pk: str) -> Response:
        if not request.user.is_authenticated:
            return api_error("Authentication required.", status_code=status.HTTP_401_UNAUTHORIZED)
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if post.author_id != str(request.user.id) and not request.user.is_staff:
            return api_error("You can only delete your own posts.", status_code=status.HTTP_403_FORBIDDEN)
        post.is_deleted = True
        post.save()
        return api_success("Post deleted.", status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Post Images
# ---------------------------------------------------------------------------


class PostImageUploadView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if post.author_id != str(request.user.id):
            return api_error("You can only add images to your own posts.", status_code=status.HTTP_403_FORBIDDEN)
        images = request.FILES.getlist("images")
        if not images:
            return api_error("No images provided.", status_code=status.HTTP_400_BAD_REQUEST)
        existing_count = PostImage.objects.filter(post=post).count()
        if existing_count + len(images) > 5:
            return api_error(
                f"A post can have at most 5 images. This post already has {existing_count}.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        created = []
        for img in images:
            file_path = os.path.join(settings.MEDIA_ROOT, "post_images", img.name)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "wb+") as f:
                for chunk in img.chunks():
                    f.write(chunk)
            image_url = f"{settings.MEDIA_URL}post_images/{img.name}"
            post_image = PostImage(post=post, image=image_url)
            post_image.save()
            created.append(post_image)

        serializer = PostImageSerializer(created, many=True, context={"request": request})
        return api_success("Images uploaded.", serializer.data, status.HTTP_201_CREATED)

class PostImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, pk: str) -> Response:
        try:
            image = PostImage.objects.get(id=pk)
        except PostImage.DoesNotExist:
            return api_error("Image not found.", status_code=status.HTTP_404_NOT_FOUND)
        
        post = image.post
        if post.author_id != str(request.user.id):
            return api_error("You can only delete images from your own posts.", status_code=status.HTTP_403_FORBIDDEN)
        
        # Delete file from disk
        file_path = os.path.join(settings.MEDIA_ROOT, image.image.lstrip(settings.MEDIA_URL))
        if os.path.exists(file_path):
            os.remove(file_path)
        
        image.delete()
        return api_success("Image deleted.", status_code=status.HTTP_204_NO_CONTENT)
    
# ---------------------------------------------------------------------------
# Gem (like)
# ---------------------------------------------------------------------------


class GemToggleView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        gem = Gem.objects.filter(post=post, user_id=str(request.user.id)).first()
        if gem:
            gem.delete()
            return api_success(
                "Gem removed.",
                {"liked": False, "gems_count": post.gems_count},
            )
        Gem(post=post, user_id=str(request.user.id)).save()
        if post.author_id != str(request.user.id):
            notify(
                event_type="gem_on_post",
                actor_id=str(request.user.id),
                actor_name=getattr(request.user, "display_name", "Someone"),
                recipient_id=post.author_id,
                target_type="post",
                target_id=str(post.id),
                post_title=post.title,
            )
        return api_success(
            "Gem added.",
            {"liked": True, "gems_count": post.gems_count},
            status.HTTP_201_CREATED,
        )


class CommentGemToggleView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            comment = Comment.objects.get(id=pk)
        except Comment.DoesNotExist:
            return api_error("Comment not found.", status_code=status.HTTP_404_NOT_FOUND)
        gem = CommentGem.objects.filter(comment=comment, user_id=str(request.user.id)).first()
        if gem:
            gem.delete()
            return api_success(
                "Gem removed from comment.",
                {"liked": False, "gems_count": comment.gems_count},
            )
        CommentGem(comment=comment, user_id=str(request.user.id)).save()
        if comment.user_id != str(request.user.id):
            notify(
                event_type="gem_on_comment",
                actor_id=str(request.user.id),
                actor_name=getattr(request.user, "display_name", "Someone"),
                recipient_id=comment.user_id,
                target_type="comment",
                target_id=str(comment.id),
            )
        return api_success(
            "Gem added to comment.",
            {"liked": True, "gems_count": comment.gems_count},
            status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Save (bookmark)
# ---------------------------------------------------------------------------


class SaveToggleView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        save = Save.objects.filter(post=post, user_id=str(request.user.id)).first()
        if save:
            save.delete()
            return api_success("Post unsaved.", {"saved": False})
        Save(post=post, user_id=str(request.user.id)).save()
        return api_success("Post saved.", {"saved": True}, status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------


class CommentListCreateView(APIView):
    def get(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        comments = Comment.objects.filter(post=post)
        serializer = CommentSerializer(comments, many=True, context={"request": request})
        return api_success("Comments retrieved.", serializer.data)

    def post(self, request: Request, pk: str) -> Response:
        if not request.user.is_authenticated:
            return api_error("Authentication required.", status_code=status.HTTP_401_UNAUTHORIZED)
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        serializer = CommentSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)
        comment = Comment(
            post=post,
            user_id=str(request.user.id),
            content=serializer.validated_data["content"],
            parent=serializer.validated_data.get("parent"),
        )
        comment.save()
        actor_name = getattr(request.user, "display_name", "Someone")
        if post.author_id != str(request.user.id):
            notify(
                event_type="comment_on_post",
                actor_id=str(request.user.id),
                actor_name=actor_name,
                recipient_id=post.author_id,
                target_type="post",
                target_id=str(post.id),
                post_title=post.title,
            )
        if comment.parent and comment.parent.user_id != str(request.user.id):
            if comment.parent.user_id != post.author_id:
                notify(
                    event_type="reply_to_comment",
                    actor_id=str(request.user.id),
                    actor_name=actor_name,
                    recipient_id=comment.parent.user_id,
                    target_type="comment",
                    target_id=str(comment.parent.id),
                )
        return api_success(
            "Comment added.",
            CommentSerializer(comment, context={"request": request}).data,
            status.HTTP_201_CREATED,
        )


class CommentDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def _get_comment(self, pk: str):
        try:
            return Comment.objects.get(id=pk)
        except Comment.DoesNotExist:
            return None

    def patch(self, request: Request, pk: str) -> Response:
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
        comment.content = serializer.validated_data.get("content", comment.content)
        comment.save()
        return api_success("Comment updated.", CommentSerializer(comment, context={"request": request}).data)

    def delete(self, request: Request, pk: str) -> Response:
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

class UserPostsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request: Request, username: str) -> Response:
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        posts = Post.objects.filter(author_id=str(user.id), is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MySavedPostsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        saves = Save.objects.filter(user_id=str(request.user.id))
        post_ids = [save.post.id for save in saves]
        posts = Post.objects.filter(id__in=post_ids, is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MyGemedPostsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        gems = Gem.objects.filter(user_id=str(request.user.id))
        post_ids = [gem.post.id for gem in gems]
        posts = Post.objects.filter(id__in=post_ids, is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class UserEventsPostsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request: Request, username: str) -> Response:
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        posts = Post.objects.filter(
            author_id=str(user.id),
            post_type="event",
            is_deleted=False
        )
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class UserAlertsPostsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request: Request, username: str) -> Response:
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        posts = Post.objects.filter(
            author_id=str(user.id),
            post_type="alert",
            is_deleted=False
        )
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


# ---------------------------------------------------------------------------
# Events feed
# ---------------------------------------------------------------------------

class EventsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request: Request) -> Response:
        posts = Post.objects.filter(
            post_type="event",
            is_deleted=False
        )
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class UpcomingEventsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request: Request) -> Response:
        upcoming_event_details = EventDetails.objects.filter(
            starts_at__gt=timezone.now()
        )
        post_ids = [ed.post.id for ed in upcoming_event_details]
        posts = Post.objects.filter(
            id__in=post_ids,
            post_type="event",
            is_deleted=False
        )
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)