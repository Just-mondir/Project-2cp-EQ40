"""DRF views for the posts app."""
from __future__ import annotations
from datetime import datetime, time
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
from apps.thematic_groups.services import user_can_access_group
from apps.users.models import User
from .models import Comment, CommentGem, Gem, Post, PostImage, Save, EventDetails, AlertDetails, Annotation, MobilizationEvent
from .serializers import (
    CommentSerializer,
    GemSerializer,
    CommentGemSerializer,
    PostDetailSerializer,
    PostImageSerializer,
    PostListSerializer,
    SaveSerializer,
    AnnotationSerializer,
    MobilizationEventSerializer,
)


class PostPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


def _save_post_images(post: Post, image_files) -> None:
    existing_count = PostImage.objects(post=post).count()
    allowed = 5 - existing_count
    for img in list(image_files)[:allowed]:
        safe_name = f"{post.id}_{img.name}"
        file_path = os.path.join(settings.MEDIA_ROOT, "post_images", safe_name)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb+") as f:
            for chunk in img.chunks():
                f.write(chunk)
        image_url = f"{settings.MEDIA_URL}post_images/{safe_name}"
        PostImage(post=post, image=image_url).save()


class PostListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return []

    def get(self, request: Request) -> Response:
        posts = Post.objects(is_deleted=False, visibility="public")
        post_type = request.query_params.get("post_type")
        if post_type:
            posts = posts.filter(post_type=post_type)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request: Request) -> Response:
        serializer = PostDetailSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)
        post = serializer.save(author_id=str(request.user.id))
        image_files = request.FILES.getlist("uploaded_images")
        if image_files:
            _save_post_images(post, image_files)
        return api_success("Post created successfully.", PostDetailSerializer(post, context={"request": request}).data, status.HTTP_201_CREATED)


class PostDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_post(self, pk: str) -> Post | None:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
            if getattr(post, "group_id", None) and getattr(post, "group_visibility", "public") == "group_only":
                user = getattr(self, "request_user", None)
                if not user or not user_can_access_group(str(user.id), post.group_id):
                    return None
            return post
        except Post.DoesNotExist:
            return None

    def get(self, request: Request, pk: str) -> Response:
        self.request_user = request.user
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        serializer = PostDetailSerializer(post, context={"request": request})
        return api_success("Post retrieved.", serializer.data)

    def patch(self, request: Request, pk: str) -> Response:
        self.request_user = request.user
        if not request.user.is_authenticated:
            return api_error("Authentication required.", status_code=status.HTTP_401_UNAUTHORIZED)
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if post.author_id != str(request.user.id):
            return api_error("You can only edit your own posts.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = PostDetailSerializer(post, data=request.data, partial=True, context={"request": request})
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)
        post = serializer.save()
        image_files = request.FILES.getlist("uploaded_images")
        if image_files:
            existing_count = PostImage.objects(post=post).count()
            if existing_count + len(image_files) > 5:
                return api_error(f"A post can have at most 5 images. This post already has {existing_count}.", status_code=status.HTTP_400_BAD_REQUEST)
            _save_post_images(post, image_files)
        return api_success("Post updated.", PostDetailSerializer(post, context={"request": request}).data)

    def delete(self, request: Request, pk: str) -> Response:
        self.request_user = request.user
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
        existing_count = PostImage.objects(post=post).count()
        if existing_count + len(images) > 5:
            return api_error(f"A post can have at most 5 images. This post already has {existing_count}.", status_code=status.HTTP_400_BAD_REQUEST)
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
        file_path = os.path.join(settings.MEDIA_ROOT, image.image.lstrip(settings.MEDIA_URL))
        if os.path.exists(file_path):
            os.remove(file_path)
        image.delete()
        return api_success("Image deleted.", status_code=status.HTTP_204_NO_CONTENT)


class GemToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if getattr(post, "group_id", None) and getattr(post, "group_visibility", "public") == "group_only" and not user_can_access_group(str(request.user.id), post.group_id):
            return api_error("You do not have access to this post.", status_code=status.HTTP_403_FORBIDDEN)
        gem = Gem.objects(post=post, user_id=str(request.user.id)).first()
        if gem:
            gem.delete()
            return api_success("Gem removed.", {"liked": False, "gems_count": post.gems_count})
        Gem(post=post, user_id=str(request.user.id)).save()
        if post.author_id != str(request.user.id):
            notify(event_type="gem_on_post", actor_id=str(request.user.id), actor_name=getattr(request.user, "display_name", "Someone"), recipient_id=post.author_id, target_type="post", target_id=str(post.id), post_title=post.title)
        return api_success("Gem added.", {"liked": True, "gems_count": post.gems_count}, status.HTTP_201_CREATED)


class CommentGemToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            comment = Comment.objects.get(id=pk)
        except Comment.DoesNotExist:
            return api_error("Comment not found.", status_code=status.HTTP_404_NOT_FOUND)
        gem = CommentGem.objects(comment=comment, user_id=str(request.user.id)).first()
        if gem:
            gem.delete()
            return api_success("Gem removed from comment.", {"liked": False, "gems_count": comment.gems_count})
        CommentGem(comment=comment, user_id=str(request.user.id)).save()
        if comment.user_id != str(request.user.id):
            notify(event_type="gem_on_comment", actor_id=str(request.user.id), actor_name=getattr(request.user, "display_name", "Someone"), recipient_id=comment.user_id, target_type="comment", target_id=str(comment.id))
        return api_success("Gem added to comment.", {"liked": True, "gems_count": comment.gems_count}, status.HTTP_201_CREATED)


class SaveToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if getattr(post, "group_id", None) and getattr(post, "group_visibility", "public") == "group_only" and not user_can_access_group(str(request.user.id), post.group_id):
            return api_error("You do not have access to this post.", status_code=status.HTTP_403_FORBIDDEN)
        save = Save.objects(post=post, user_id=str(request.user.id)).first()
        if save:
            save.delete()
            return api_success("Post unsaved.", {"saved": False})
        Save(post=post, user_id=str(request.user.id)).save()
        return api_success("Post saved.", {"saved": True}, status.HTTP_201_CREATED)


class CommentListCreateView(APIView):
    def get(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if getattr(post, "group_id", None) and getattr(post, "group_visibility", "public") == "group_only" and not user_can_access_group(str(request.user.id), post.group_id):
            return api_error("You do not have access to this post.", status_code=status.HTTP_403_FORBIDDEN)

        comments = Comment.objects(post=post).order_by("created_at")
        serializer = CommentSerializer(
            comments,
            many=True,
            context={"request": request, "post": post},
        )
        return api_success("Comments retrieved.", serializer.data)

    def post(self, request: Request, pk: str) -> Response:
        if not request.user.is_authenticated:
            return api_error("Authentication required.", status_code=status.HTTP_401_UNAUTHORIZED)

        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        if getattr(post, "group_id", None) and getattr(post, "group_visibility", "public") == "group_only" and not user_can_access_group(str(request.user.id), post.group_id):
            return api_error("You do not have access to this post.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = CommentSerializer(
            data=request.data,
            context={"request": request, "post": post},
        )
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)

        parent_comment = serializer.validated_data.get("parent_id")

        comment = Comment(
            post=post,
            user_id=str(request.user.id),
            content=serializer.validated_data["content"],
            parent=parent_comment,
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

        if parent_comment and parent_comment.user_id != str(request.user.id):
            if parent_comment.user_id != post.author_id:
                notify(
                    event_type="reply_to_comment",
                    actor_id=str(request.user.id),
                    actor_name=actor_name,
                    recipient_id=parent_comment.user_id,
                    target_type="comment",
                    target_id=str(parent_comment.id),
                )

        return api_success(
            "Comment added.",
            CommentSerializer(
                comment,
                context={"request": request, "post": post},
            ).data,
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
        serializer = CommentSerializer(comment, data=request.data, partial=True, context={"request": request})
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

        replies = Comment.objects(parent=comment)
        for reply in replies:
            CommentGem.objects(comment=reply).delete()
            reply.delete()

        CommentGem.objects(comment=comment).delete()
        comment.delete()

        return api_success("Comment deleted.", status_code=status.HTTP_204_NO_CONTENT)

class UserPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, username: str) -> Response:
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        posts = Post.objects(author_id=str(user.id), is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MySavedPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        saves = Save.objects(user_id=str(request.user.id))
        post_ids = [save.post.id for save in saves]
        posts = Post.objects(id__in=post_ids, is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MyGemedPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        gems = Gem.objects(user_id=str(request.user.id))
        post_ids = [gem.post.id for gem in gems]
        posts = Post.objects(id__in=post_ids, is_deleted=False)
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
        posts = Post.objects(author_id=str(user.id), post_type="event", is_deleted=False)
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
        posts = Post.objects(author_id=str(user.id), post_type="alert", is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class EventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        posts = Post.objects(post_type="event", is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class UpcomingEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        upcoming_event_details = EventDetails.objects(starts_at__gt=timezone.now())
        post_ids = []
        for ed in upcoming_event_details:
            try:
                post_ids.append(ed.post.id)
            except Exception:
                continue

        posts = Post.objects(id__in=post_ids, post_type="event", is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class EventFilterView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        location = request.query_params.get("location", "").strip()
        region = request.query_params.get("region", "").strip()
        historical_period = request.query_params.get("historical_period", "").strip()
        monument_type = request.query_params.get("monument_type", "").strip()
        visibility = request.query_params.get("visibility", "").strip()
        status_filter = request.query_params.get("status", "").strip().lower()
        date_from = request.query_params.get("date_from", "").strip()
        date_to = request.query_params.get("date_to", "").strip()

        posts = Post.objects(post_type="event", is_deleted=False)

        if q:
            posts = posts.filter(__raw__={"$or": [{"title": {"$regex": q, "$options": "i"}}, {"content": {"$regex": q, "$options": "i"}}, {"location": {"$regex": q, "$options": "i"}}]})
        if location:
            posts = posts.filter(__raw__={"location": {"$regex": location, "$options": "i"}})
        if region:
            posts = posts.filter(region=region)
        if historical_period:
            posts = posts.filter(historical_period=historical_period)
        if monument_type:
            posts = posts.filter(monument_type=monument_type)
        if visibility:
            posts = posts.filter(visibility=visibility)

        post_ids = [post.id for post in posts]
        event_details = EventDetails.objects(post__in=post_ids)
        now = timezone.now()

        if status_filter == "upcoming":
            event_details = event_details.filter(starts_at__gt=now)
        elif status_filter == "ongoing":
            event_details = event_details.filter(starts_at__lte=now, ends_at__gte=now)
        elif status_filter == "past":
            event_details = event_details.filter(ends_at__lt=now)

        if date_from:
            try:
                parsed_from = datetime.strptime(date_from, "%Y-%m-%d")
                parsed_from = timezone.make_aware(datetime.combine(parsed_from.date(), time.min))
                event_details = event_details.filter(starts_at__gte=parsed_from)
            except ValueError:
                return Response({"detail": "Invalid date_from format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if date_to:
            try:
                parsed_to = datetime.strptime(date_to, "%Y-%m-%d")
                parsed_to = timezone.make_aware(datetime.combine(parsed_to.date(), time.max))
                event_details = event_details.filter(starts_at__lte=parsed_to)
            except ValueError:
                return Response({"detail": "Invalid date_to format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        post_ids = [event.post.id for event in event_details]
        posts = Post.objects(id__in=post_ids, post_type="event", is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MonumentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        posts = Post.objects(post_type="alert", is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class CriticalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        critical_details = AlertDetails.objects(urgence_level="critical")
        post_ids = [ed.post.id for ed in critical_details]
        posts = Post.objects(id__in=post_ids, post_type="alert", is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        q = request.query_params.get("q", "").strip()
        users_data = []
        posts_data = []
        if q:
            users = User.objects(is_active=True, __raw__={"$or": [{"username": {"$regex": q, "$options": "i"}}, {"display_name": {"$regex": q, "$options": "i"}}]})
            posts = Post.objects(is_deleted=False, __raw__={"$or": [{"title": {"$regex": q, "$options": "i"}}, {"content": {"$regex": q, "$options": "i"}}]})
            users_data = [{"id": str(user.id), "username": user.username, "display_name": user.display_name, "profile_picture": user.profile_picture} for user in users]
            posts_data = [{"id": str(post.id), "title": post.title, "content": post.content, "post_type": post.post_type, "location": post.location} for post in posts]
        return api_success(message="Global search results retrieved successfully.", data={"users": users_data, "posts": posts_data}, status_code=200)


class AnnotationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, post_id: str) -> Response:
        try:
            post = Post.objects.get(id=post_id, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        user_id = str(request.user.id)

        if post.author_id == user_id:
            annotations = Annotation.objects(post=post).order_by("-created_at")
        else:
            annotations = Annotation.objects(
                post=post,
                __raw__={
                    "$or": [
                        {"status": "accepted"},
                        {"user_id": user_id},
                    ]
                },
            ).order_by("-created_at")

        serializer = AnnotationSerializer(annotations, many=True)
        return api_success("Annotations retrieved.", serializer.data)

    def post(self, request: Request, post_id: str) -> Response:
        try:
            post = Post.objects.get(id=post_id, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        serializer = AnnotationSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)
        annotation = Annotation(post=post, user_id=str(request.user.id), text=serializer.validated_data.get("text", ""), image=serializer.validated_data.get("image", ""), status="pending")
        annotation.save()
        return api_success("Annotation created.", AnnotationSerializer(annotation).data, status.HTTP_201_CREATED)


class AnnotationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_annotation(self, annotation_id: str):
        try:
            return Annotation.objects.get(id=annotation_id)
        except Annotation.DoesNotExist:
            return None

    def patch(self, request: Request, post_id: str, annotation_id: str) -> Response:
        annotation = self._get_annotation(annotation_id)
        if not annotation:
            return api_error("Annotation not found.", status_code=status.HTTP_404_NOT_FOUND)
        if annotation.user_id != str(request.user.id):
            return api_error("You can only edit your own annotation.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = AnnotationSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)
        if "text" in serializer.validated_data:
            annotation.text = serializer.validated_data["text"]
        if "image" in serializer.validated_data:
            annotation.image = serializer.validated_data["image"]
        annotation.status = "pending"
        annotation.validated_by_id = ""
        annotation.validated_at = None
        annotation.updated_at = timezone.now()
        annotation.save()
        return api_success("Annotation updated.", AnnotationSerializer(annotation).data)

    def delete(self, request: Request, post_id: str, annotation_id: str) -> Response:
        annotation = self._get_annotation(annotation_id)
        if not annotation:
            return api_error("Annotation not found.", status_code=status.HTTP_404_NOT_FOUND)
        if annotation.user_id != str(request.user.id):
            return api_error("You can only delete your own annotation.", status_code=status.HTTP_403_FORBIDDEN)
        annotation.delete()
        return api_success("Annotation deleted.", status_code=status.HTTP_204_NO_CONTENT)


class AnnotationAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, post_id: str, annotation_id: str) -> Response:
        try:
            annotation = Annotation.objects.get(id=annotation_id)
        except Annotation.DoesNotExist:
            return api_error("Annotation not found.", status_code=status.HTTP_404_NOT_FOUND)
        if annotation.post.author_id != str(request.user.id):
            return api_error("Only the creator of the post can accept this annotation.", status_code=status.HTTP_403_FORBIDDEN)
        annotation.status = "accepted"
        annotation.validated_by_id = str(request.user.id)
        annotation.validated_at = timezone.now()
        annotation.save()
        return api_success("Annotation accepted.")


class AnnotationRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, post_id: str, annotation_id: str) -> Response:
        try:
            annotation = Annotation.objects.get(id=annotation_id)
        except Annotation.DoesNotExist:
            return api_error("Annotation not found.", status_code=status.HTTP_404_NOT_FOUND)
        if annotation.post.author_id != str(request.user.id):
            return api_error("Only the creator of the post can reject this annotation.", status_code=status.HTTP_403_FORBIDDEN)
        annotation.status = "rejected"
        annotation.validated_by_id = str(request.user.id)
        annotation.validated_at = timezone.now()
        annotation.save()
        return api_success("Annotation rejected.")


class FilterChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return api_success(
            message="Filter choices retrieved.",
            data={
                "post_types": list(Post.POST_TYPE_CHOICES),
                "visibilities": list(Post.VISIBILITY_CHOICES),
                "historical_periods": [p for p in Post.HISTORICAL_PERIOD_CHOICES if p],
                "monument_types": [m for m in Post.MONUMENT_TYPE_CHOICES if m],
                "regions": [r for r in Post.REGION_CHOICES if r],
            },
            status_code=200,
        )


class PostFilterView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        region = request.query_params.get("region", "").strip()
        post_type = request.query_params.get("post_type", "").strip()
        historical_period = request.query_params.get("historical_period", "").strip()
        monument_type = request.query_params.get("monument_type", "").strip()
        filters = {"is_deleted": False}
        if region:
            filters["region"] = region
        if post_type:
            filters["post_type"] = post_type
        if historical_period:
            filters["historical_period"] = historical_period
        if monument_type:
            filters["monument_type"] = monument_type
        posts = Post.objects(**filters).order_by("-created_at")
        serializer = PostListSerializer(posts, many=True, context={"request": request})
        return api_success("Filtered posts retrieved.", serializer.data)

class MonumentsInDangerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        search = request.query_params.get("search", "").strip()
        region = request.query_params.get("region", "").strip()
        historical_period = request.query_params.get("historical_period", "").strip()
        monument_type = request.query_params.get("monument_type", "").strip()
        urgence_level = request.query_params.get("urgence_level", "").strip()
        current_status = request.query_params.get("current_status", "").strip()

        posts = Post.objects(post_type="alert", is_deleted=False)

        if region and region.lower() != "all":
            posts = posts.filter(
                __raw__={"region": {"$regex": f"^{region}$", "$options": "i"}}
            )

        if historical_period and historical_period.lower() != "all":
            posts = posts.filter(
                __raw__={
                    "historical_period": {
                        "$regex": f"^{historical_period}$",
                        "$options": "i",
                    }
                }
            )

        if monument_type and monument_type.lower() != "all":
            posts = posts.filter(
                __raw__={
                    "monument_type": {
                        "$regex": f"^{monument_type}$",
                        "$options": "i",
                    }
                }
            )

        if search:
            posts = posts.filter(
                __raw__={
                    "$or": [
                        {"title": {"$regex": search, "$options": "i"}},
                        {"content": {"$regex": search, "$options": "i"}},
                        {"region": {"$regex": search, "$options": "i"}},
                        {"historical_period": {"$regex": search, "$options": "i"}},
                        {"monument_type": {"$regex": search, "$options": "i"}},
                        {"location": {"$regex": search, "$options": "i"}},
                    ]
                }
            )

        posts = list(posts)
        post_ids = [post.id for post in posts]

        alert_map = {}
        if post_ids:
            alert_qs = AlertDetails.objects(post__in=post_ids)

            if urgence_level and urgence_level.lower() != "all":
                alert_qs = alert_qs.filter(
                    __raw__={
                        "urgence_level": {
                            "$regex": f"^{urgence_level}$",
                            "$options": "i",
                        }
                    }
                )

            if current_status and current_status.lower() != "all":
                alert_qs = alert_qs.filter(
                    __raw__={
                        "current_status": {
                            "$regex": f"^{current_status}$",
                            "$options": "i",
                        }
                    }
                )

            alert_list = list(alert_qs)
            alert_map = {str(alert.post.id): alert for alert in alert_list}

            if (urgence_level and urgence_level.lower() != "all") or (
                current_status and current_status.lower() != "all"
            ):
                posts = [post for post in posts if str(post.id) in alert_map]

        posts.sort(key=lambda p: p.created_at, reverse=True)

        data = []
        for post in posts:
            alert_detail = alert_map.get(str(post.id))
            if alert_detail is None:
                alert_detail = AlertDetails.objects(post=post).first()

            data.append(
                {
                    "id": str(post.id),
                    "title": post.title,
                    "content": post.content,
                    "post_type": post.post_type,
                    "region": post.region,
                    "location": post.location,
                    "historical_period": post.historical_period,
                    "monument_type": post.monument_type,
                    "created_at": post.created_at.isoformat() if post.created_at else None,
                    "gems_count": post.gems_count,
                    "comments_count": post.comments_count,
                    "images": PostImageSerializer(PostImage.objects(post=post), many=True, context={"request": request}).data,
                    "alert_details": {
                        "id": str(alert_detail.id),
                        "urgence_level": alert_detail.urgence_level,
                        "current_status": alert_detail.current_status,
                    }
                    if alert_detail
                    else None,
                }
            )

        return api_success("Monuments in danger retrieved.", data)


class MobilizationEventCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = MobilizationEventSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST)

        # Update the monument's status if provided
        monument_post = serializer.validated_data.get("post")
        current_status = serializer.validated_data.get("current_status")
        if monument_post and current_status:
            try:
                alert_details = AlertDetails.objects.get(post=monument_post)
                alert_details.current_status = current_status
                alert_details.save()
            except AlertDetails.DoesNotExist:
                pass

        mobilization_event = serializer.save(author_id=str(request.user.id))

        image_files = request.FILES.getlist("uploaded_images")
        if image_files:
            import os
            from django.conf import settings
            images_list = []
            for i, img in enumerate(list(image_files)[:5]):
                safe_name = f"mob_{mobilization_event.id}_{i}_{img.name}"
                file_path = os.path.join(settings.MEDIA_ROOT, "mobilization_images", safe_name)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                with open(file_path, "wb+") as f:
                    for chunk in img.chunks():
                        f.write(chunk)
                images_list.append(f"{settings.MEDIA_URL}mobilization_images/{safe_name}")
            mobilization_event.images = images_list
            mobilization_event.save()

        return api_success(
            "Mobilization event created successfully.",
            MobilizationEventSerializer(mobilization_event).data,
            status.HTTP_201_CREATED,
        )