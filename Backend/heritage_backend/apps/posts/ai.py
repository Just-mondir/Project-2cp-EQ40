"""Helpers for generating post-specific monument insights with Gemini."""

from __future__ import annotations

import json
from typing import Any
from urllib import error, parse, request

from django.conf import settings

from .models import Post


class GeminiServiceError(Exception):
    """Raised when the Gemini API request cannot be completed."""


def _clean_value(value: str | None) -> str:
    return (value or "").strip()


def build_post_prompt(post: Post, question: str = "") -> str:
    """Build a grounded prompt from the existing monument post fields."""
    custom_question = _clean_value(question)
    question_text = (
        custom_question
        if custom_question
        else "Give more historical and cultural context about this monument."
    )

    return (
        "You are helping users learn more about a cultural monument from a community post.\n"
        "Use the post details below as the primary context.\n"
        "If some facts are uncertain or missing, say so clearly instead of inventing details.\n"
        "Keep the answer concise, factual, and easy to read.\n"
        "Structure the answer with short sections titled: Overview, Historical Importance, "
        "Architecture or Features, Preservation Notes.\n\n"
        f"User question: {question_text}\n\n"
        "Post details:\n"
        f"- Title: {_clean_value(post.title)}\n"
        f"- Description: {_clean_value(post.content)}\n"
        f"- Location: {_clean_value(post.location)}\n"
        f"- Region: {_clean_value(post.region)}\n"
        f"- Historical period: {_clean_value(post.historical_period)}\n"
        f"- Monument type: {_clean_value(post.monument_type)}\n"
        f"- Post type: {_clean_value(post.post_type)}\n"
    )


def _extract_text_from_response(payload: dict[str, Any]) -> str:
    candidates = payload.get("candidates") or []
    for candidate in candidates:
        content = candidate.get("content") or {}
        parts = content.get("parts") or []
        text_chunks = [part.get("text", "").strip() for part in parts if part.get("text")]
        combined = "\n".join(chunk for chunk in text_chunks if chunk)
        if combined:
            return combined
    return ""


def generate_post_insight(post: Post, question: str = "") -> str:
    """Call Gemini and return an AI-generated monument insight."""
    api_key = getattr(settings, "GEMINI_API_KEY", "").strip()
    model = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash").strip()
    model = model.removeprefix("models/") or "gemini-2.5-flash"

    if not api_key:
        raise GeminiServiceError("Gemini API key is not configured on the server.")

    prompt = build_post_prompt(post, question)
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{parse.quote(model, safe='')}:generateContent?key={parse.quote(api_key, safe='')}"
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ]
    }

    req = request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8")
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise GeminiServiceError(
            f"Gemini request failed with status {exc.code}. {body}".strip()
        ) from exc
    except error.URLError as exc:
        raise GeminiServiceError("Unable to reach Gemini API.") from exc

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise GeminiServiceError("Gemini returned an invalid response.") from exc

    answer = _extract_text_from_response(data).strip()
    if not answer:
        raise GeminiServiceError("Gemini returned an empty answer.")

    return answer
