"""DRF views for the posts app."""
from __future__ import annotations
from datetime import datetime, time
import json
import re
import urllib.error
import urllib.request
from rest_framework import status
import cloudinary.uploader
from .utils import upload_to_cloudinary
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
from apps.users.models import User, EXPERTISE_CHOICES
from .models import Comment, CommentGem, Gem, Post, PostImage, Repost, Save, EventDetails, AlertDetails, Annotation, MobilizationEvent
from apps.thematic_groups.models import ThematicGroup
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


def _is_moderator(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    username = getattr(user, "username", "")
    if username and username.lower() in ("nordine", "hibeterrahmane-nordine"):
        return True
    if user.is_staff or getattr(user, "is_admin", False) or getattr(user, "is_superuser", False):
        return True
    role = str(getattr(user, "role", "")).lower()
    return role in ("moderator", "admin", "staff", "mod")


class PostPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


def _save_post_images(post: Post, image_files) -> None:
    existing_count = PostImage.objects(post=post, is_deleted=False).count()
    allowed = 5 - existing_count
    for img in list(image_files)[:allowed]:
        url = upload_to_cloudinary(img, folder="posts")
        PostImage(post=post, image=url).save()


def _build_post_insight_prompt(post: Post) -> str:
    fields = [
        f"Title: {post.title}",
        f"Type: {post.post_type}",
        f"Content: {post.content}",
        f"Region: {post.region or 'Not specified'}",
        f"Location: {post.location or 'Not specified'}",
        f"Historical period: {post.historical_period or 'Not specified'}",
        f"Monument type: {post.monument_type or 'Not specified'}",
    ]

    if post.post_type == "alert":
        alert = AlertDetails.objects(post=post).first()
        if alert:
            fields.append(f"Urgency: {alert.urgence_level}")
            fields.append(f"Current status: {alert.current_status}")

    if post.post_type == "event":
        event = EventDetails.objects(post=post).first()
        if event:
            fields.append(f"Starts at: {event.starts_at}")
            fields.append(f"Ends at: {event.ends_at or 'Not specified'}")

    return (
        "You are an expert cultural heritage researcher for an Algerian heritage community app. "
        "Do deep research using the available search grounding tool, then write a rich but readable "
        "research note about this post. Focus on historical background, cultural meaning, architectural "
        "or archaeological details, preservation context, and what a visitor or researcher should notice. "
        "If the post is brief, use the title, location, region, monument type, and historical period to "
        "research the likely subject, but clearly avoid claiming uncertain facts as proven. "
        "Write 500 to 800 words in plain text, no markdown tables. "
        "Use these sections: Overview, Historical background, Cultural and archaeological significance, "
        "Details worth noticing, Preservation notes, Further research questions. "
        "Do not stop after a heading, and do not answer with only a short summary.\n\n"
        + "\n".join(fields)
    )


def _build_post_quiz_prompt(post: Post) -> str:
    plain_content = re.sub(r"<[^>]*>", " ", post.content or "")
    plain_content = re.sub(r"\s+", " ", plain_content).strip()
    fields = [
        f"Title: {post.title}",
        f"Type: {post.post_type}",
        f"Content: {plain_content}",
        f"Region: {post.region or 'Not specified'}",
        f"Location: {post.location or 'Not specified'}",
        f"Historical period: {post.historical_period or 'Not specified'}",
        f"Monument type: {post.monument_type or 'Not specified'}",
    ]
    return (
        "Create an educational multiple-choice quiz for this cultural heritage post. "
        "Use only information that can be learned from the post fields, plus obvious contextual heritage facts "
        "when the post is very short. Generate 3, 4, 5, or 6 questions depending on how much information exists. "
        "Each question must have exactly 4 options and exactly one correct answer. "
        "Return ONLY valid JSON, with no markdown and no extra text, in this exact shape: "
        "{\"questions\":[{\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"answer_index\":0,\"explanation\":\"...\"}]}. "
        "Keep questions clear, fun, and useful for learning. Keep explanations under 25 words.\n\n"
        + "\n".join(fields)
    )


def _extract_gemini_text(payload: dict) -> str:
    candidates = payload.get("candidates") or []
    parts = []
    for candidate in candidates:
        content = candidate.get("content") or {}
        for part in content.get("parts") or []:
            text = part.get("text")
            if text:
                parts.append(text)
    return "\n".join(parts).strip()


def _extract_gemini_grounding(payload: dict) -> dict:
    candidates = payload.get("candidates") or []
    metadata = candidates[0].get("groundingMetadata") if candidates else None
    if not metadata:
        return {"sources": [], "search_queries": []}

    sources = []
    seen = set()
    for chunk in metadata.get("groundingChunks") or []:
        web = chunk.get("web") or {}
        uri = web.get("uri")
        if not uri or uri in seen:
            continue
        seen.add(uri)
        sources.append({
            "title": web.get("title") or uri,
            "uri": uri,
        })

    return {
        "sources": sources[:8],
        "search_queries": metadata.get("webSearchQueries") or [],
    }


def _clean_gemini_insight(text: str) -> str:
    text = re.sub(r"\s*\[cite:\s*[^\]]+\]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    heading_pattern = re.compile(
        r"^(Overview|Historical background|Cultural and archaeological significance|"
        r"Details worth noticing|Preservation notes|Further research questions)\s*$",
        re.IGNORECASE | re.MULTILINE,
    )
    matches = list(heading_pattern.finditer(text))
    first_overview = None
    second_overview = None

    for match in matches:
        if match.group(1).lower() == "overview":
            if first_overview is None:
                first_overview = match.start()
            else:
                second_overview = match.start()
                break

    if first_overview is not None and second_overview is not None:
        text = text[second_overview:].strip()

    return text


def _parse_quiz_json(text: str) -> list[dict]:
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        text = fenced.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]

    payload = json.loads(text)
    raw_questions = payload.get("questions") if isinstance(payload, dict) else None
    if not isinstance(raw_questions, list):
        raise ValueError("Gemini returned an invalid quiz.")

    questions = []
    for raw in raw_questions[:8]:
        question = str(raw.get("question", "")).strip()
        options = raw.get("options")
        answer_index = raw.get("answer_index")
        explanation = str(raw.get("explanation", "")).strip()
        if not question or not isinstance(options, list) or len(options) != 4:
            continue
        try:
            answer_index = int(answer_index)
        except Exception:
            continue
        if answer_index < 0 or answer_index > 3:
            continue
        questions.append({
            "question": question,
            "options": [str(option).strip()[:180] for option in options],
            "answer_index": answer_index,
            "explanation": explanation[:220],
        })

    if len(questions) < 3:
        raise ValueError("Gemini returned too few quiz questions.")
    return questions


def _generate_post_insight(post: Post) -> dict:
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("Gemini API key is not configured.")

    model = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": _build_post_insight_prompt(post)}],
            }
        ],
        "tools": [{"google_search": {}}],
        "generationConfig": {
            "temperature": 0.25,
            "maxOutputTokens": 2200,
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))

    text = _clean_gemini_insight(_extract_gemini_text(payload))
    if not text:
        raise ValueError("Gemini returned an empty insight.")
    return {
        "insight": text,
        **_extract_gemini_grounding(payload),
    }


def _generate_post_quiz(post: Post) -> dict:
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("Gemini API key is not configured.")

    model = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": _build_post_quiz_prompt(post)}],
            }
        ],
        "generationConfig": {
            "temperature": 0.35,
            "maxOutputTokens": 1800,
            "responseMimeType": "application/json",
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))

    questions = _parse_quiz_json(_extract_gemini_text(payload))
    return {"questions": questions}


class PostListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return []

    def get(self, request: Request) -> Response:
        post_type = request.query_params.get("post_type")
        public_posts = Post.objects(
            is_deleted=False,
            visibility="public",
            group_id__in=["", None],
        )
        if post_type:
            public_posts = public_posts.filter(post_type=post_type)
        posts = public_posts.order_by("-created_at")
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
            return Post.objects.get(id=pk, is_deleted=False)
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
            existing_count = PostImage.objects(post=post, is_deleted=False).count()
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
        if post.author_id != str(request.user.id) and not _is_moderator(request.user):
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
        existing_count = PostImage.objects(post=post, is_deleted=False).count()
        if existing_count + len(images) > 5:
            return api_error(f"A post can have at most 5 images. This post already has {existing_count}.", status_code=status.HTTP_400_BAD_REQUEST)
        created = []
        for img in images:
            url = upload_to_cloudinary(img, folder="posts")
            post_image = PostImage(post=post, image=url)
            post_image.save()
            created.append(post_image)
        serializer = PostImageSerializer(created, many=True, context={"request": request})
        return api_success("Images uploaded.", serializer.data, status.HTTP_201_CREATED)


class PostImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, pk: str) -> Response:
        try:
            image = PostImage.objects.get(id=pk, is_deleted=False)
        except PostImage.DoesNotExist:
            return api_error("Image not found.", status_code=status.HTTP_404_NOT_FOUND)
        post = image.post
        if post.author_id != str(request.user.id):
            return api_error("You can only delete images from your own posts.", status_code=status.HTTP_403_FORBIDDEN)
        try:
            public_id = "/".join(image.image.split("/")[-2:]).rsplit(".", 1)[0]
            cloudinary.uploader.destroy(public_id)
        except Exception:
            pass
        image.is_deleted = True
        image.save()
        return api_success("Image deleted.", status_code=status.HTTP_204_NO_CONTENT)


class GemToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)
        gem = Gem.objects(post=post, user_id=str(request.user.id), is_deleted=False).first()
        if gem:
            gem.is_deleted = True
            gem.save()
            return api_success("Gem removed.", {"liked": False, "gems_count": post.gems_count})
        Gem(post=post, user_id=str(request.user.id)).save()
        if post.author_id != str(request.user.id):
            notify(event_type="gem_on_post", actor_id=str(request.user.id), actor_name=getattr(request.user, "display_name", "Someone"), recipient_id=post.author_id, target_type="post", target_id=str(post.id), post_title=post.title)
        return api_success("Gem added.", {"liked": True, "gems_count": post.gems_count}, status.HTTP_201_CREATED)


class PostGemUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        gems = Gem.objects(post=post, is_deleted=False).order_by("-created_at")
        user_ids = [gem.user_id for gem in gems if gem.user_id]
        users_by_id = {str(user.id): user for user in User.objects(id__in=user_ids)}
        users = []

        for user_id in user_ids:
            user = users_by_id.get(str(user_id))
            if not user:
                continue
            users.append({
                "id": str(user.id),
                "username": user.username or "",
                "display_name": user.display_name or user.username or "",
                "profile_picture": user.profile_picture or "",
                "badge": user.badge or "",
                "expertise": user.expertise or "",
            })

        return api_success("Post gem users retrieved.", {"count": len(users), "users": users})


class CommentGemToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            comment = Comment.objects.get(id=pk)
        except Comment.DoesNotExist:
            return api_error("Comment not found.", status_code=status.HTTP_404_NOT_FOUND)
        gem = CommentGem.objects(comment=comment, user_id=str(request.user.id), is_deleted=False).first()
        if gem:
            gem.is_deleted = True
            gem.save()
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
        save = Save.objects(post=post, user_id=str(request.user.id), is_deleted=False).first()
        if save:
            save.is_deleted = True
            save.save()
            return api_success("Post unsaved.", {"saved": False})
        Save(post=post, user_id=str(request.user.id)).save()
        return api_success("Post saved.", {"saved": True}, status.HTTP_201_CREATED)


class RepostToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_post(self, pk: str):
        try:
            return Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return None

    def _clean_description(self, value) -> str:
        description = str(value or "")
        return re.sub(r"<[^>]*>", "", description).strip()[:500]

    def post(self, request: Request, pk: str) -> Response:
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        repost = Repost.objects(post=post, user_id=str(request.user.id), is_deleted=False).first()
        if repost:
            repost.is_deleted = True
            repost.save()
            return api_success(
                "Repost removed.",
                {"reposted": False, "reposts_count": Repost.objects(post=post, is_deleted=False).count()},
            )

        description = self._clean_description(request.data.get("description", ""))
        Repost(post=post, user_id=str(request.user.id), description=description).save()
        if post.author_id != str(request.user.id):
            notify(
                event_type="repost_on_post",
                actor_id=str(request.user.id),
                actor_name=getattr(request.user, "display_name", "Someone"),
                recipient_id=post.author_id,
                target_type="post",
                target_id=str(post.id),
                post_title=post.title,
            )
        return api_success(
            "Post reposted.",
            {
                "reposted": True,
                "reposts_count": Repost.objects(post=post, is_deleted=False).count(),
                "repost_description": description,
            },
            status.HTTP_201_CREATED,
        )

    def patch(self, request: Request, pk: str) -> Response:
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        repost = Repost.objects(post=post, user_id=str(request.user.id), is_deleted=False).first()
        if not repost:
            return api_error("Repost not found.", status_code=status.HTTP_404_NOT_FOUND)

        repost.description = self._clean_description(request.data.get("description", ""))
        repost.save()
        return api_success(
            "Repost description updated.",
            {
                "reposted": True,
                "reposts_count": Repost.objects(post=post, is_deleted=False).count(),
                "repost_description": repost.description,
            },
        )

    def delete(self, request: Request, pk: str) -> Response:
        post = self._get_post(pk)
        if not post:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        repost = Repost.objects(post=post, user_id=str(request.user.id), is_deleted=False).first()
        if not repost:
            return api_error("Repost not found.", status_code=status.HTTP_404_NOT_FOUND)

        repost.description = ""
        repost.save()
        return api_success(
            "Repost description removed.",
            {
                "reposted": True,
                "reposts_count": Repost.objects(post=post, is_deleted=False).count(),
                "repost_description": "",
            },
        )


class PostRepostUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        reposts = Repost.objects(post=post, is_deleted=False).order_by("-created_at")
        user_ids = [repost.user_id for repost in reposts if repost.user_id]
        users_by_id = {str(user.id): user for user in User.objects(id__in=user_ids)}
        users = []

        for user_id in user_ids:
            user = users_by_id.get(str(user_id))
            if not user:
                continue
            users.append({
                "id": str(user.id),
                "username": user.username or "",
                "display_name": user.display_name or user.username or "",
                "profile_picture": user.profile_picture or "",
                "badge": user.badge or "",
                "expertise": user.expertise or "",
            })

        return api_success("Post repost users retrieved.", {"count": len(users), "users": users})


class PostAIInsightView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        try:
            research = _generate_post_insight(post)
        except ValueError as exc:
            return api_error(str(exc), status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
        except urllib.error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="ignore")
            return api_error(
                "Gemini could not generate an insight right now.",
                {"detail": details[:500]},
                status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:
            return api_error(
                "Gemini could not generate an insight right now.",
                {"detail": str(exc)},
                status.HTTP_502_BAD_GATEWAY,
            )

        return api_success(
            "AI insight generated.",
            {
                "insight": research["insight"],
                "sources": research["sources"],
                "search_queries": research["search_queries"],
                "model": getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash"),
            },
        )


class PostQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        try:
            quiz = _generate_post_quiz(post)
        except (ValueError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            return api_error(str(exc), status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            return api_error(
                "Gemini could not generate a quiz right now.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return api_success("Quiz generated.", quiz)


class CommentListCreateView(APIView):
    def get(self, request: Request, pk: str) -> Response:
        try:
            post = Post.objects.get(id=pk, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        comments = Comment.objects(post=post, is_deleted=False).order_by("created_at")
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
            return Comment.objects.get(id=pk, is_deleted=False)
        except Comment.DoesNotExist:
            return None

    def get(self, request: Request, pk: str) -> Response:
        comment = self._get_comment(pk)
        if not comment:
            return api_error("Comment not found.", status_code=status.HTTP_404_NOT_FOUND)
        return api_success(
            "Comment retrieved.",
            CommentSerializer(comment, context={"request": request}).data,
        )

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

        is_owner = comment.user_id == str(request.user.id)
        is_mod = _is_moderator(request.user)

        # Check if requester is admin of the group this post belongs to
        is_group_admin = False
        try:
            from apps.posts.models import Post
            from apps.thematic_groups.models import ThematicGroup
            post = Post.objects.get(id=comment.post.id)
            if post.group_id:
                group = ThematicGroup.objects.get(id=post.group_id)
                is_group_admin = str(group.admin_id) == str(request.user.id)
        except Exception:
            pass

        if not (is_owner or is_mod or is_group_admin):
            return api_error("You can only delete your own comments.", status_code=status.HTTP_403_FORBIDDEN)

        replies = Comment.objects(parent=comment, is_deleted=False)
        for reply in replies:
            CommentGem.objects(comment=reply, is_deleted=False).update(set__is_deleted=True)
            reply.is_deleted = True
            reply.save()

        CommentGem.objects(comment=comment, is_deleted=False).update(set__is_deleted=True)
        comment.is_deleted = True
        comment.save()

        return api_success("Comment deleted.", status_code=status.HTTP_204_NO_CONTENT)

class UserPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, username: str) -> Response:
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        posts = Post.objects(author_id=str(user.id), group_id__in=["", None], is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MySavedPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        saves = Save.objects(user_id=str(request.user.id), is_deleted=False)
        post_ids = []
        for save in saves:
            try:
                if save.post:
                    post_ids.append(save.post.id)
            except Exception:
                continue
        posts = Post.objects(id__in=post_ids, is_deleted=False)
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MyRepostedPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        reposts = Repost.objects(user_id=str(request.user.id), is_deleted=False).order_by("-created_at")
        post_ids = []
        for repost in reposts:
            try:
                if repost.post:
                    post_ids.append(repost.post.id)
            except Exception:
                continue
        posts_by_id = {post.id: post for post in Post.objects(id__in=post_ids, is_deleted=False)}
        posts = [posts_by_id[post_id] for post_id in post_ids if post_id in posts_by_id]
        reposts_by_post_id = {str(repost.post.id): repost for repost in reposts if getattr(repost, "post", None)}
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request, "reposts_by_post_id": reposts_by_post_id})
        return paginator.get_paginated_response(serializer.data)


class UserRepostedPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, username: str) -> Response:
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        reposts = Repost.objects(user_id=str(user.id), is_deleted=False).order_by("-created_at")
        post_ids = []
        for repost in reposts:
            try:
                if repost.post:
                    post_ids.append(repost.post.id)
            except Exception:
                continue
        posts_by_id = {post.id: post for post in Post.objects(id__in=post_ids, is_deleted=False)}
        posts = [posts_by_id[post_id] for post_id in post_ids if post_id in posts_by_id]
        reposts_by_post_id = {str(repost.post.id): repost for repost in reposts if getattr(repost, "post", None)}
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request, "reposts_by_post_id": reposts_by_post_id})
        return paginator.get_paginated_response(serializer.data)


class MyGemedPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        gems = Gem.objects(user_id=str(request.user.id), is_deleted=False)
        post_ids = []
        for gem in gems:
            try:
                if gem.post:
                    post_ids.append(gem.post.id)
            except Exception:
                continue
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
        posts = Post.objects(author_id=str(user.id), post_type="event", group_id__in=["", None], is_deleted=False)
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
        posts = Post.objects(author_id=str(user.id), post_type="alert", group_id__in=["", None], is_deleted=False)
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
        expertise = request.query_params.get("expertise", "").strip()

        posts = Post.objects(post_type="event", is_deleted=False)

        if expertise:
            user_ids = User.objects(expertise=expertise).scalar("id")
            posts = posts.filter(author_id__in=[str(uid) for uid in user_ids])

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
        post_ids = []
        for ed in critical_details:
            try:
                if ed.post:
                    post_ids.append(ed.post.id)
            except Exception:
                continue
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
        groups_data = []
        if q:
            users = User.objects(is_active=True, __raw__={"$or": [{"username": {"$regex": q, "$options": "i"}}, {"display_name": {"$regex": q, "$options": "i"}}]})
            posts = Post.objects(is_deleted=False, __raw__={"$or": [{"title": {"$regex": q, "$options": "i"}}, {"content": {"$regex": q, "$options": "i"}}]})
            groups = ThematicGroup.objects(__raw__={"$or": [{"name": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}]})

            users_data = [{"id": str(user.id), "username": user.username, "display_name": user.display_name, "profile_picture": user.profile_picture} for user in users]
            posts_data = [{"id": str(post.id), "title": post.title, "content": post.content, "post_type": post.post_type, "location": post.location} for post in posts]
            groups_data = [{"id": str(group.id), "name": group.name, "description": group.description, "profile_picture": group.profile_picture} for group in groups]

        return api_success(message="Global search results retrieved successfully.", data={"users": users_data, "posts": posts_data, "groups": groups_data}, status_code=200)


class AnnotationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, post_id: str) -> Response:
        try:
            post = Post.objects.get(id=post_id, is_deleted=False)
        except Post.DoesNotExist:
            return api_error("Post not found.", status_code=status.HTTP_404_NOT_FOUND)

        user_id = str(request.user.id)

        if post.author_id == user_id:
            annotations = Annotation.objects(post=post, is_deleted=False).order_by("-created_at")
        else:
            annotations = Annotation.objects(
                post=post,
                is_deleted=False,
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
            return Annotation.objects.get(id=annotation_id, is_deleted=False)
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
        if annotation.user_id != str(request.user.id) and not _is_moderator(request.user):
            return api_error("You can only delete your own annotation.", status_code=status.HTTP_403_FORBIDDEN)
        annotation.is_deleted = True
        annotation.save()
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
                "expertises": [e[0] for e in EXPERTISE_CHOICES if e[0]],
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
        expertise = request.query_params.get("expertise", "").strip()
        
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
        
        if expertise:
            user_ids = User.objects(expertise=expertise).scalar("id")
            posts = posts.filter(author_id__in=[str(uid) for uid in user_ids])
            
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

        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


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
            images_list = [
                upload_to_cloudinary(img, folder="mobilization")
                for img in list(image_files)[:5]
            ]
            mobilization_event.images = images_list
            mobilization_event.save()

        return api_success(
            MobilizationEventSerializer(mobilization_event).data,
            status.HTTP_201_CREATED,
        )
