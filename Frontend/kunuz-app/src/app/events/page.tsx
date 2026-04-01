"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import LeftSidebar from "@/components/LeftSidebar";

//const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function stripHtmlFallback(html: string): string {
  let result = html;
  let prev: string;
  do {
    prev = result;
    result = prev.replace(/<[^>]*>/g, "");
  } while (result !== prev);
  return result;
}

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return stripHtmlFallback(html);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br", "p", "span", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
  });
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") return stripHtmlFallback(html);
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function getAuthUser():
  | { id?: string; username?: string; display_name?: string }
  | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/* ─────────────────── PERSISTENT GEM/SAVE HELPERS ─────────────────── */

function getStoredSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}

function toggleStoredItem(key: string, id: string, add: boolean) {
  if (typeof window === "undefined") return;
  const set = getStoredSet(key);
  add ? set.add(id) : set.delete(id);
  localStorage.setItem(key, JSON.stringify([...set]));
}

/* ─────────────────── TYPES ─────────────────── */

type PostImage = {
  id: string;
  image: string;
  uploaded_at: string;
};

type AlertDetails = {
  id: string;
  urgence_level: "low" | "medium" | "high" | "critical";
  current_status: "restored" | "under_intervention" | "destroyed" | "alert";
};

type EventDetails = {
  id: string;
  starts_at: string;
  ends_at: string;
};

type ApiPost = {
  id: string;
  user_display_name?: string;
  user_username?: string;
  username?: string;
  date?: string;
  title: string;
  content: string;
  post_type: string;
  region: string;
  location: string;
  gems_count: number;
  comments_count: number;
  accepted_annotations_count?: number;
  is_gemmed?: boolean;
  is_saved?: boolean;
  images: PostImage[];
  tags?: string[];
  historical_period?: string;
  monument_type?: string;
  created_at: string;
  user_id?: string;
  alert_details: AlertDetails | null;
  event_details: EventDetails | null;
  _key?: number;
};

type PostInteraction = {
  gemmed: boolean;
  gemsCount: number;
  saved: boolean;
  commentsCount: number;
  annotationsCount: number;
};

type Annotation = {
  id: string;
  post: string;
  user_id: string;
  text: string;
  image: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
  validated_by_id: string;
  validated_at: string | null;
};

type ApiCommentRaw = {
  id: string;
  user_id: string;
  user_username: string;
  content?: string;
  text?: string;
  created_at: string;
  parent?: string | null | { id?: string; _id?: string } | undefined;
  parent_id?: string | null;
  gems_count?: number;
  is_gemmed?: boolean;
};

type CommentNode = {
  id: string;
  user_id: string;
  user_username: string;
  content: string;
  created_at: string;
  parent: string | null;
  gems_count: number;
  is_gemmed: boolean;
};

function getAcceptedAnnotationsCount(annotations: Annotation[]): number {
  return annotations.filter((annotation) => annotation.status === "accepted").length;
}

function normalizeParent(parent: ApiCommentRaw["parent"], parentId?: string | null): string | null {
  if (parentId) return String(parentId);
  if (!parent) return null;
  if (typeof parent === "string") return parent;
  if (typeof parent === "object") return String(parent.id ?? parent._id ?? "") || null;
  return null;
}

function normalizeComment(raw: ApiCommentRaw): CommentNode {
  return {
    id: String(raw.id),
    user_id: String(raw.user_id ?? ""),
    user_username: String(raw.user_username ?? ""),
    content: String(raw.content ?? raw.text ?? ""),
    created_at: String(raw.created_at ?? ""),
    parent: normalizeParent(raw.parent, raw.parent_id),
    gems_count: Number(raw.gems_count ?? 0),
    is_gemmed: Boolean(raw.is_gemmed ?? false),
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function formatCount(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}

function formatEventTime(details: EventDetails): string {
  const start = new Date(details.starts_at);
  const end = new Date(details.ends_at);
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  return sameDay
    ? `${fmt(start)} · ${fmtTime(start)} – ${fmtTime(end)}`
    : `${fmt(start)} ${fmtTime(start)} → ${fmt(end)} ${fmtTime(end)}`;
}

function buildTags(post: ApiPost): string[] {
  if (post.tags && post.tags.length > 0) return post.tags;
  const tags: string[] = [];
  if (post.historical_period) tags.push(post.historical_period);
  if (post.monument_type) tags.push(post.monument_type);
  if (post.region) tags.push(post.region);
  return tags;
}

const GUILDS = [
  { name: "Heritage Photography", desc: "A space for sharing photos of cultural and historical landmarks", members: "2.7k", image: "/heritage-photography.jpg" },
  { name: "UNESCO World Heritage Sites", desc: "Dedicated to Algeria's UNESCO-recognized sites", members: "4.1k", image: "/unisco.jpg" },
  { name: "Monuments of Tipaza", desc: "Exploring and documenting the archaeological sites of Tipaza", members: "1.9k", image: "/monuments-of-tipaza.jpg" },
  { name: "Heritage Photography", desc: "A space for sharing photos of cultural and historical landmarks", members: "2.7k", image: "/heritage-photography.jpg" },
  { name: "UNESCO World Heritage Sites", desc: "Dedicated to Algeria's UNESCO-recognized sites", members: "4.1k", image: "/unisco.jpg" },
  { name: "Monuments of Tipaza", desc: "Exploring and documenting the archaeological sites of Tipaza", members: "1.9k", image: "/monuments-of-tipaza.jpg" },
];

/* ─────────────────── SVG ICONS ─────────────────── */

const GemIcon = ({ className = "", size = 18, filled = false, active = false }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      filter: active ? "drop-shadow(0 0 5px #4FC3F7aa)" : "none",
      transition: "filter 0.2s, transform 0.15s",
      transform: active ? "scale(1.18)" : "scale(1)",
    }}
  >
    <path d="M6 3h12l4 6-10 13L2 9z" />
    <path d="M2 9h20" />
    <path d="M12 22L6 9l3-6" />
    <path d="M12 22l6-13-3-6" />
  </svg>
);

const CommentIcon = ({ className = "", size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkIcon = ({ className = "", size = 18, filled = false, active = false }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: "color 0.2s, transform 0.15s",
      transform: active ? "scale(1.15)" : "scale(1)",
    }}
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const AnnotationIcon = ({ className = "", size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

/* ─────────────────── TAGS ─────────────────── */

function PostTags({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-5 pb-3">
      {tags.map((tag, i) => (
        <span key={i} className="text-[11px] font-medium" style={{ color: "#A07850" }}>
          #{tag.toLowerCase().replace(/\s+/g, "_")}
        </span>
      ))}
    </div>
  );
}

/* ─────────────────── EXPANDABLE CONTENT ─────────────────── */

const CONTENT_LIMIT = 160;

function ExpandableContent({ content, className = "", style = {} }: { content: string; className?: string; style?: React.CSSProperties }) {
  const [expanded, setExpanded] = useState(false);
  const strippedText = content.replace(/<[^>]*>/g, "");
  const isLong = strippedText.length > CONTENT_LIMIT;
  return (
    <div className={`${className} prose prose-sm max-w-none`} style={style}>
      {isLong && !expanded ? (
        <span>{strippedText.slice(0, CONTENT_LIMIT) + "… "}</span>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
      )}
      {isLong && (
        <button className="font-semibold" style={{ color: "#8B6914" }} onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}

/* ─────────────────── POST DETAIL BADGE ─────────────────── */

const URGENCY_COLORS: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  low: { bg: "#FFF8E2", border: "#C8A96E", dot: "#C8A96E", label: "Low urgency" },
  medium: { bg: "#FFF3E0", border: "#E07B39", dot: "#E07B39", label: "Medium urgency" },
  high: { bg: "#FDE8E8", border: "#C0392B", dot: "#C0392B", label: "High urgency" },
  critical: { bg: "#FDE8E8", border: "#7B0000", dot: "#7B0000", label: "Critical" },
};

const STATUS_LABELS: Record<string, string> = {
  restored: "Restored",
  under_intervention: "Under Intervention",
  destroyed: "Destroyed",
  alert: "Alert",
};

function PostDetailBadge({ post }: { post: ApiPost }) {
  if (post.post_type === "event" && post.event_details) {
    return (
      <div className="mx-5 mb-3 px-4 py-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: "#EAF0E6", border: "1px solid #B8D4A8" }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#5C7A3E" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#5C7A3E" }}>Event</span>
          <span className="text-xs font-bold" style={{ color: "#2E4A1E" }}>{formatEventTime(post.event_details)}</span>
        </div>
      </div>
    );
  }

  if (post.post_type === "alert" && post.alert_details) {
    const level = URGENCY_COLORS[post.alert_details.urgence_level] ?? URGENCY_COLORS.medium;
    const statusLabel = STATUS_LABELS[post.alert_details.current_status] ?? post.alert_details.current_status;
    return (
      <div className="mx-5 mb-3 px-4 py-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: level.bg, border: `1px solid ${level.border}` }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: level.dot }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: level.dot }}>Alert</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: level.dot }}>{level.label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: level.dot + "22", color: level.dot }}>{statusLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ─────────────────── COMMENT ITEM ─────────────────── */

function CommentItem({
  comment,
  postId,
  onRefresh,
  onDelete,
  isReply = false,
}: {
  comment: CommentNode;
  postId: string;
  onRefresh?: () => void;
  onDelete?: (commentId: string) => void;
  isReply?: boolean;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [gemmed, setGemmed] = useState(comment.is_gemmed);
  const [gemsCount, setGemsCount] = useState(comment.gems_count);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setGemmed(comment.is_gemmed);
    setGemsCount(comment.gems_count);
  }, [comment.id, comment.is_gemmed, comment.gems_count]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentUser = getAuthUser();
  const isOwner = String(currentUser?.id ?? "") === String(comment.user_id);

  const handleGemComment = async () => {
    const token = getAuthToken();
    const previousGemmed = gemmed;
    const previousCount = gemsCount;
    const nextGemmed = !previousGemmed;

    setGemmed(nextGemmed);
    setGemsCount((prev) => (nextGemmed ? prev + 1 : Math.max(prev - 1, 0)));

    try {
      const res = await fetch(`${API_URL}/api/posts/comments/${comment.id}/gem/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error("Failed to toggle comment gem");

      setGemmed(Boolean(data?.data?.liked ?? nextGemmed));
      setGemsCount(Number(data?.data?.gems_count ?? previousCount));
    } catch {
      setGemmed(previousGemmed);
      setGemsCount(previousCount);
    }
  };

  const handleDeleteComment = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/comments/${comment.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok || res.status === 204) {
        setShowMenu(false);
        onDelete?.(comment.id);
      }
    } catch { }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;

    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: replyText, parent_id: comment.id }),
      });

      if (!res.ok) return;

      setReplyText("");
      setShowReplyInput(false);
      onRefresh?.();
    } catch { }
  };

  return (
    <div
      className="flex gap-3 p-3 rounded-xl"
      style={{
        backgroundColor: "var(--light)",
        boxShadow: isReply ? "none" : "0 1px 6px rgba(67,40,23,0.06)",
        borderLeft: isReply ? "2px solid #E0D5C5" : "none",
      }}
    >
      <div
        className="w-[32px] h-[32px] rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: "#E0D5C5" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#8B7355" stroke="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <button
            className="text-sm font-bold hover:underline transition-all cursor-pointer"
            style={{ color: "#432817", background: "none", border: "none", padding: 0 }}
            onClick={() => router.push(`/user/${comment.user_username}`)}
          >
            {comment.user_username}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              className="p-0.5 rounded hover:bg-[#E0D5C5] transition-colors text-sm font-bold leading-none"
              style={{ color: "#8B7355" }}
              onClick={() => setShowMenu(!showMenu)}
            >
              ...
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-50"
                style={{ backgroundColor: "#FFF8E2" }}
              >
                {isOwner ? (
                  <button
                    className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#FDE8E8]"
                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                    onClick={handleDeleteComment}
                  >
                    Delete comment
                  </button>
                ) : (
                  <button
                    className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]"
                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                    onClick={() => setShowMenu(false)}
                  >
                    Report comment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className="text-sm leading-relaxed prose prose-sm max-w-none"
          style={{ color: "#432817" }}
        >
          {stripHtml(comment.content)}
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          <button
            className="text-[10px] flex items-center gap-1 hover:text-[#8B6914] transition-colors"
            style={{ color: gemmed ? "#8B6914" : "#8B7355" }}
            onClick={handleGemComment}
          >
            <GemIcon size={12} filled={gemmed} active={gemmed} />
            <span>{gemsCount}</span>
          </button>

          <button
            className="text-[10px] flex items-center gap-1 hover:text-[#8B6914] transition-colors"
            style={{ color: "#8B7355" }}
            onClick={() => setShowReplyInput(!showReplyInput)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4" />
              <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
            </svg>
            <span>Reply</span>
          </button>
        </div>

        {showReplyInput && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitReply();
              }}
              className="flex-1 text-xs rounded-xl px-3 py-2 outline-none border"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E0D5C5",
                color: "#432817",
              }}
            />
            <button
              onClick={handleSubmitReply}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#432817" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── ANNOTATION ITEM ─────────────────── */

function AnnotationItem({
  annotation,
  postId,
  postAuthorId,
  onDelete,
  onAccept,
  onReject,
}: {
  annotation: Annotation;
  postId: string;
  postAuthorId?: string;
  onDelete: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = String(getAuthUser()?.id ?? "");
  const isOwner = currentUserId === String(annotation.user_id);
  const isPostAuthor = currentUserId === String(postAuthorId ?? "");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(
        `${API_URL}/api/posts/${postId}/annotations/${annotation.id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok || res.status === 204) {
        onDelete(annotation.id);
        setShowMenu(false);
      }
    } catch { }
  };

  const handleAccept = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(
        `${API_URL}/api/posts/${postId}/annotations/${annotation.id}/accept/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        onAccept(annotation.id);
        setShowMenu(false);
      }
    } catch { }
  };

  const handleReject = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(
        `${API_URL}/api/posts/${postId}/annotations/${annotation.id}/reject/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        onReject(annotation.id);
        setShowMenu(false);
      }
    } catch { }
  };

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#FFF3E0", color: "#E07B39", label: "Pending" },
    accepted: { bg: "#EAF0E6", color: "#5C7A3E", label: "Accepted" },
    rejected: { bg: "#FDE8E8", color: "#C0392B", label: "Rejected" },
  };

  const sc = statusColors[annotation.status] ?? statusColors.pending;

  const imageUrl = annotation.image
    ? annotation.image.startsWith("/media/")
      ? `${API_URL}${annotation.image}`
      : annotation.image
    : "";

  return (
    <div
      className="flex gap-3 p-3 rounded-xl"
      style={{
        backgroundColor: "var(--light)",
        boxShadow: "0 1px 6px rgba(67,40,23,0.06)",
        border: `1px solid ${sc.bg}`,
      }}
    >
      <div
        className="w-[32px] h-[32px] rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: "#E0D5C5" }}
      >
        <AnnotationIcon size={14} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: sc.bg, color: sc.color }}
          >
            {sc.label}
          </span>

          <div className="relative" ref={menuRef}>
            <button
              className="p-0.5 rounded hover:bg-[#E0D5C5] text-sm font-bold"
              style={{ color: "#8B7355" }}
              onClick={() => setShowMenu(!showMenu)}
            >
              ...
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[150px]"
                style={{ backgroundColor: "#FFF8E2" }}
              >
                {isOwner && (
                  <button
                    className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#FDE8E8]"
                    style={{ color: "#432817" }}
                    onClick={handleDelete}
                  >
                    Delete annotation
                  </button>
                )}

                {!isOwner && (
                  <button
                    className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#F0EAD8]"
                    style={{ color: "#432817" }}
                    onClick={() => setShowMenu(false)}
                  >
                    Report annotation
                  </button>
                )}

                {isPostAuthor && annotation.status === "pending" && (
                  <>
                    <button
                      className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#EAF0E6]"
                      style={{ color: "#5C7A3E" }}
                      onClick={handleAccept}
                    >
                      Accept
                    </button>

                    <button
                      className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#FDE8E8]"
                      style={{ color: "#C0392B" }}
                      onClick={handleReject}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {annotation.text && (
          <p className="text-xs" style={{ color: "#432817" }}>
            {annotation.text}
          </p>
        )}

        {imageUrl ? (
          <img
            src={imageUrl}
            alt="annotation"
            className="mt-2 rounded-lg max-w-full"
            style={{ maxHeight: 160, objectFit: "cover" }}
          />
        ) : null}

        <span className="text-[10px]" style={{ color: "#8B7355" }}>
          {formatDate(annotation.created_at)}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────── LEFT SIDEBAR ─────────────────── */

/* ───────────────── FILTER SECTION ───────────────── */

function FilterSection({ isVisible, onClose, onApply }: { isVisible: boolean; onClose: () => void; onApply: (filters: any) => void }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    region: "All",
    historical_period: "All",
    monument_type: "All",
    status: "All",
  });

  useEffect(() => {
    if (isVisible) setIsAnimating(true);
    else setTimeout(() => setIsAnimating(false), 300);
  }, [isVisible]);
  if (!isAnimating && !isVisible) return null;

  const filters = [
    { key: "region", label: "Geographical Regions", options: ["All", "Kabylia", "Tuareg", "Chaoui", "Chleuh", "Medea", "Constantine", "Algiers", "Tlemcen", "Oran", "Tipaza", "Setif", "Batna", "Beni Mzab", "Ouled Nail", "Tassili n'Ajjer"] },
    { key: "historical_period", label: "Historical Periods", options: ["All", "Prehistory", "Protohistory", "Numidian period", "Punic (Carthaginian) period", "Roman period", "Vandal period", "Byzantine period", "Early Islamic period", "Rostamid dynasty", "Zirid dynasty", "Hammadid dynasty", "Almohad dynasty", "Zayyanid dynasty", "Ottoman period", "French colonization", "War of Independence", "Independent Algeria", "Contemporary period"] },
    { key: "monument_type", label: "Heritage Type", options: ["All", "Civil", "Religious", "Military", "Funerary"] },
    { key: "status", label: "Event Status", options: ["All", "Upcoming", "Ongoing", "Past"] },
  ];

  const handleSelectChange = (key: string, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const reset = {
      region: "All",
      historical_period: "All",
      monument_type: "All",
      status: "All"
    };
    setSelectedFilters(reset);
    onApply(reset);
    onClose();
  };

  const handleApply = () => {
    onApply(selectedFilters);
    onClose();
  };

  return (
    <div
      className={`absolute top-[65px] right-4.5 w-[340px] z-[60] overflow-hidden transition-all duration-400 origin-top-right ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-4 pointer-events-none"}`}
      style={{ backgroundColor: "var(--background)", borderRadius: "28px", boxShadow: "0 25px 60px rgba(67,40,23,0.2)", border: "1.5px solid var(--brown)" }}
    >
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(67, 40, 23, 0.1)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--brown)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--brown)", fontFamily: "var(--font-lato)" }}>Filters</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brown)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div className="flex flex-col max-h-[50vh]">
        <div className="flex-1 overflow-y-auto px-6 py-5 feed-scroll">
          <div className="flex flex-col gap-5">
            {filters.map((filter) => (
              <div key={filter.label} className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: "var(--brown)" }}>{filter.label}</label>
                <div className="relative group w-full">
                  <select
                    value={selectedFilters[filter.key as keyof typeof selectedFilters]}
                    onChange={(e) => handleSelectChange(filter.key, e.target.value)}
                    className="w-full text-[11px] px-4 py-3 outline-none cursor-pointer appearance-none transition-all duration-300"
                    style={{ backgroundColor: "var(--light)", border: "1.5px solid rgba(67, 40, 23, 0.2)", borderRadius: "14px", color: "var(--brown)", fontWeight: "700" }}
                  >
                    {filter.options.map((opt) => <option key={opt}>{opt}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brown)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex gap-2 border-t" style={{ backgroundColor: "var(--light)", borderColor: "rgba(67, 40, 23, 0.1)" }}>
        <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:bg-black/5" style={{ border: "1.5px solid var(--brown)", color: "var(--brown)" }}>Reset</button>
        <button onClick={handleApply} className="flex-[2] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:shadow-lg shadow-[#432817]/20 border border-transparent" style={{ backgroundColor: "var(--brown)", color: "var(--cream)" }}>Apply</button>
      </div>
    </div>
  );
}

/* ─────────────────── RIGHT SIDEBAR ─────────────────── */

const UPCOMING_EVENTS_MOCKS = Array(5).fill({
  id: 1,
  user_name: "user 85258",
  event_image: "/timgad 1.jpg",
  user_avatar: "/kunuz-icon.svg",
  title: "Timgad Visit",
  location: "Batna",
  start_date: "20/09/2026",
  end_date: "21/09/2026",
}).map((item, index) => ({ ...item, id: index + 1 }));

/* ─────────────────── MOBILE EVENTS STRIP ─────────────────── */

function MobileEventsStrip() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_URL}/api/posts/upcoming-events/`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.ok) {
          const data = await res.json();
          const results = Array.isArray(data.results) ? data.results : data;
          if (Array.isArray(results) && results.length > 0) {
            setUpcomingEvents(results.slice(0, 5).map((event: any) => {
              const imgObj = Array.isArray(event.images) && event.images.length > 0 ? event.images[0] : null;
              const imageUrl = imgObj ? (imgObj.image.startsWith("/media/") ? `${API_URL}${imgObj.image}` : imgObj.image) : "/timgad 1.jpg";
              const sDate = event.event_details?.starts_at ? new Date(event.event_details.starts_at).toLocaleDateString("fr-FR") : "";
              const eDate = event.event_details?.ends_at ? new Date(event.event_details.ends_at).toLocaleDateString("fr-FR") : "";
              return {
                id: event.id,
                user_name: event.user_display_name || event.user_username || "Unknown",
                event_image: imageUrl,
                title: event.title,
                location: event.location || event.region || "Algeria",
                start_date: sDate,
                end_date: eDate,
              };
            }));
          } else {
            setUpcomingEvents(UPCOMING_EVENTS_MOCKS);
          }
        } else {
          setUpcomingEvents(UPCOMING_EVENTS_MOCKS);
        }
      } catch (e) {
        console.error("Failed to fetch upcoming events", e);
        setUpcomingEvents(UPCOMING_EVENTS_MOCKS);
      } finally {
        setLoading(false);
      }
    }
    fetchUpcoming();
  }, []);

  return (
    <div className="lg:hidden px-4 py-4">
      <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "#8B7355", fontFamily: "var(--font-lato)" }}>Upcoming Events</h3>
      <div 
        className="flex gap-3 overflow-x-auto pb-2" 
        style={{ 
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {loading ? (
          <div className="flex justify-center py-4 w-full">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }} />
          </div>
        ) : (
          upcomingEvents.map((eventItem, i) => (
            <div 
              key={i} 
              className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105"
              style={{ width: "140px" }}
            >
              <div className="flex flex-col">
                <img 
                  src={eventItem.event_image} 
                  alt="event" 
                  className="w-[120px] h-[80px] object-cover rounded-xl mb-2 flex-shrink-0 border-2 border-white shadow-sm" 
                />
                <span 
                  className="text-[10px] font-bold text-center leading-tight line-clamp-2 mb-1" 
                  style={{ 
                    color: "#432817", 
                    fontFamily: "var(--font-lato)",
                    maxWidth: "120px",
                    wordBreak: "break-word",
                    hyphens: "auto"
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(eventItem.title) }}
                />
                <span 
                  className="text-[8px] text-center leading-tight line-clamp-1 mb-1" 
                  style={{ 
                    color: "#8B7355", 
                    fontFamily: "var(--font-lato)"
                  }}
                >
                  {eventItem.user_name}
                </span>
                <div className="flex flex-col gap-1 text-center">
                  <span className="flex items-center justify-center gap-1 text-[8px] font-medium" style={{ color: "#8B6914" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {eventItem.location}
                  </span>
                  <span className="flex items-center justify-center gap-1 text-[8px] font-medium" style={{ color: "#8B6914" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    {eventItem.start_date} {eventItem.end_date ? `- ${eventItem.end_date}` : ""}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────── RIGHT SIDEBAR ─────────────────── */

function RightSidebar() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_URL}/api/posts/upcoming-events/`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.ok) {
          const data = await res.json();
          const results = Array.isArray(data.results) ? data.results : data;
          if (Array.isArray(results) && results.length > 0) {
            setUpcomingEvents(results.slice(0, 5).map((event: any) => {
              const imgObj = Array.isArray(event.images) && event.images.length > 0 ? event.images[0] : null;
              const imageUrl = imgObj ? (imgObj.image.startsWith("/media/") ? `${API_URL}${imgObj.image}` : imgObj.image) : "/timgad 1.jpg";
              const sDate = event.event_details?.starts_at ? new Date(event.event_details.starts_at).toLocaleDateString("fr-FR") : "";
              const eDate = event.event_details?.ends_at ? new Date(event.event_details.ends_at).toLocaleDateString("fr-FR") : "";
              return {
                id: event.id,
                user_name: event.user_display_name || event.user_username || "Unknown",
                event_image: imageUrl,
                title: event.title,
                location: event.location || event.region || "Algeria",
                start_date: sDate,
                end_date: eDate,
              };
            }));
          } else {
            setUpcomingEvents(UPCOMING_EVENTS_MOCKS);
          }
        } else {
          setUpcomingEvents(UPCOMING_EVENTS_MOCKS);
        }
      } catch (e) {
        console.error("Failed to fetch upcoming events", e);
        setUpcomingEvents(UPCOMING_EVENTS_MOCKS);
      } finally {
        setLoading(false);
      }
    }
    fetchUpcoming();
  }, []);

  return (
    <aside className="w-[320px] xl:w-[420px] flex-shrink-0 pl-5 pr-4 pt-4 h-full hidden lg:block overflow-hidden">
      <div className="sticky top-0 h-full flex flex-col">
        <h2 className="text-base font-bold mb-5 flex-shrink-0" style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>Upcoming Events</h2>
        <div className="flex flex-col gap-3 flex-shrink-0">
          {loading ? (
            <div className="flex justify-center py-4"><div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }} /></div>
          ) : upcomingEvents.map((eventItem, i) => (
            <div key={i} className="flex p-4 mb-2 bg-white rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg shadow-sm" style={{ boxShadow: "0 4px 16px rgba(67,40,23,0.06)", backgroundColor: "rgba(255,255,255,0.6)" }}>
              {/* Event Image: square 75x75, 20px radius */}
              <div className="w-[75px] h-[75px] flex-shrink-0 mr-4">
                <img src={eventItem.event_image} alt="event" className="w-full h-full object-cover rounded-[20px]" />
              </div>

              {/* Content on the right */}
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  {/* Line 1: User name and icon */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E0D5C5", color: "#8B7355" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold truncate" style={{ color: "#8B7355" }}>{eventItem.user_name}</span>
                  </div>

                  {/* Line 2: Title */}
                  <span className="font-bold text-[14px] leading-snug line-clamp-2 mb-1.5" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(eventItem.title) }}></span>
                </div>

                {/* Line 3: Location and Time */}
                <div className="flex items-center justify-between mt-auto">
                  <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "#8B6914" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {eventItem.location}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "#8B6914" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    {eventItem.start_date} {eventItem.end_date ? `- ${eventItem.end_date}` : ""}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────── POST MODAL ─────────────────── */

function PostModal({
  post,
  onClose,
  interaction,
  onInteractionChange,
  initialTab = "comments",
}: {
  post: ApiPost | null;
  onClose: () => void;
  interaction: PostInteraction;
  onInteractionChange: (update: Partial<PostInteraction>) => void;
  initialTab?: "comments" | "annotations";
}) {
  const [activeTab, setActiveTab] = useState<"comments" | "annotations">(initialTab);

  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<CommentNode[]>([]);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newAnnotationText, setNewAnnotationText] = useState("");
  const [annotationsLoading, setAnnotationsLoading] = useState(false);

  const [showPostMenu, setShowPostMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contentExpanded, setContentExpanded] = useState(false);
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const imageScrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { gemmed, gemsCount, saved } = interaction;

  const acceptedAnnotationsCount = getAcceptedAnnotationsCount(annotations);

  const fetchComments = async (postId: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const raw = Array.isArray(data.data) ? data.data : [];
      const normalized = raw.map(normalizeComment);
      setComments(normalized);
      onInteractionChange({ commentsCount: normalized.length });
    } catch { }
  };

  const fetchAnnotations = async (postId: string) => {
    setAnnotationsLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/annotations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const items = Array.isArray(data.data) ? data.data : [];
      setAnnotations(items);
      onInteractionChange({
        annotationsCount: getAcceptedAnnotationsCount(items),
      });
    } catch { } finally {
      setAnnotationsLoading(false);
    }
  };

  useEffect(() => {
    if (post) {
      setContentExpanded(false);
      setActiveTab(initialTab);
      setAnnotations([]);
      setComments([]);
    }
  }, [post, initialTab]);

  useEffect(() => {
    if (!post) return;
    fetchComments(post.id);
    fetchAnnotations(post.id);
  }, [post]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setShowPostMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    onInteractionChange({ commentsCount: comments.length });
  }, [comments]);

  useEffect(() => {
    onInteractionChange({
      annotationsCount: getAcceptedAnnotationsCount(annotations),
    });
  }, [annotations]);

  if (!post) return null;

  const imageList = post.images ?? [];
  const tags = buildTags(post);
  const isContentLong = post.content.length > CONTENT_LIMIT;

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/comments/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (!res.ok) return;
      setNewComment("");
      await fetchComments(post.id);
    } catch { }
  };

  const handleSubmitAnnotation = async () => {
    if (!newAnnotationText.trim()) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/annotations/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newAnnotationText }),
      });
      if (!res.ok) return;
      setNewAnnotationText("");
      await fetchAnnotations(post.id);
    } catch { }
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAcceptAnnotation = (id: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "accepted" } : a))
    );
  };

  const handleRejectAnnotation = (id: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a))
    );
  };

  const handleGem = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextGemmed = !gemmed;
    const nextCount = nextGemmed ? gemsCount + 1 : gemsCount - 1;
    onInteractionChange({ gemmed: nextGemmed, gemsCount: nextCount });
    toggleStoredItem("gemmed_posts", post.id, nextGemmed);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/gem/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle gem");
    } catch {
      onInteractionChange({ gemmed, gemsCount });
      toggleStoredItem("gemmed_posts", post.id, gemmed);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !saved;
    onInteractionChange({ saved: nextSaved });
    toggleStoredItem("saved_posts", post.id, nextSaved);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/save/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle save");
    } catch {
      onInteractionChange({ saved });
      toggleStoredItem("saved_posts", post.id, saved);
    }
  };

  const scrollToImage = (index: number) => {
    const el = imageScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * index, behavior: "smooth" });
    setCurrentImageIndex(index);
  };

  const handleImageScroll = () => {
    const el = imageScrollRef.current;
    if (!el) return;
    setCurrentImageIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const topLevelComments = comments.filter((c) => !c.parent);

  const getReplies = (commentId: string) =>
    comments.filter((c) => String(c.parent) === String(commentId));

  const handleDeleteComment = (id: string) => {
    setComments((prev) => {
      const toRemove = new Set<string>();

      const collect = (commentId: string) => {
        toRemove.add(commentId);
        prev.forEach((item) => {
          if (String(item.parent) === String(commentId)) {
            collect(item.id);
          }
        });
      };

      collect(id);
      return prev.filter((x) => !toRemove.has(x.id));
    });
  };

  const renderCommentThread = (
    comment: CommentNode,
    level = 0
  ): React.ReactNode => {
    const replies = getReplies(comment.id);
    return (
      <div key={comment.id} className={level > 0 ? "ml-8 mt-2" : ""}>
        <CommentItem
          comment={comment}
          postId={post.id}
          onRefresh={() => fetchComments(post.id)}
          onDelete={handleDeleteComment}
          isReply={level > 0}
        />
        {replies.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {replies.map((reply) => renderCommentThread(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const LeftPanel = imageList.length > 0 ? (
    <div
      className="w-1/2 flex-shrink-0 relative overflow-hidden"
      style={{ backgroundColor: "#000" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={imageScrollRef}
        onScroll={handleImageScroll}
        className="hide-scrollbar flex w-full h-full overflow-x-scroll overflow-y-hidden snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {imageList.map((img) => {
          const imageUrl = img?.image
            ? img.image.startsWith("/media/")
              ? `${API_URL}${img.image}`
              : img.image
            : "";
          const bgImageUrl = imageUrl ? encodeURI(imageUrl) : "";
          return (
            <div key={img.id} className="relative w-full h-full flex-shrink-0 snap-center overflow-hidden">
              {bgImageUrl ? (
                <>
                  <div className="absolute inset-0" style={{ backgroundImage: `url("${bgImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", transform: "scale(1.2)" }} />
                  <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
                </>
              ) : null}
              {imageUrl ? (
                <img src={imageUrl} alt={post.title} className="relative z-10 w-full h-full object-contain" />
              ) : null}
            </div>
          );
        })}
      </div>

      {imageList.length > 1 && currentImageIndex > 0 && (
        <button type="button" className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 hover:scale-105" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); scrollToImage(currentImageIndex - 1); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}
      {imageList.length > 1 && currentImageIndex < imageList.length - 1 && (
        <button type="button" className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 hover:scale-105" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); scrollToImage(currentImageIndex + 1); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      )}
      {imageList.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.15)" }} onClick={(e) => e.stopPropagation()}>
            {imageList.map((_, index) => (
              <button key={index} type="button" onClick={(e) => { e.stopPropagation(); scrollToImage(index); }} className="transition-all duration-200" style={{ width: currentImageIndex === index ? 18 : 8, height: 8, borderRadius: 999, background: currentImageIndex === index ? "#FFF8E2" : "rgba(255,255,255,0.5)" }} />
            ))}
          </div>
          <div className="absolute top-3 left-3 z-30 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md" style={{ background: "rgba(0,0,0,0.35)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
            {currentImageIndex + 1}/{imageList.length}
          </div>
        </>
      )}
    </div>
  ) : (
    <div className="w-1/2 flex-shrink-0 flex flex-col overflow-y-auto feed-scroll px-6 py-5" style={{ backgroundColor: "#F5EFE0" }}>
      <div className="mb-1">
        <div className="flex items-center gap-1 mb-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <span className="text-xs" style={{ color: "#8B7355" }}>{post.location || post.region || "Algeria"}</span>
        </div>
        <h3 className="text-base font-bold" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
      </div>

      {post.post_type === "event" && post.event_details && (
        <div className="mb-3 px-4 py-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: "#EAF0E6", border: "1px solid #B8D4A8" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#5C7A3E" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: "#5C7A3E" }}>Event</span>
            <span className="text-xs font-bold" style={{ color: "#2E4A1E" }}>{formatEventTime(post.event_details)}</span>
          </div>
        </div>
      )}

      {post.post_type === "alert" && post.alert_details && (() => {
        const level = URGENCY_COLORS[post.alert_details!.urgence_level] ?? URGENCY_COLORS.medium;
        const statusLabel = STATUS_LABELS[post.alert_details!.current_status] ?? post.alert_details!.current_status;
        return (
          <div className="mb-3 px-4 py-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: level.bg, border: `1px solid ${level.border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: level.dot }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: level.dot }}>Alert · {level.label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: level.dot + "22", color: level.dot }}>{statusLabel}</span>
            </div>
          </div>
        );
      })()}
      <div className="text-sm leading-relaxed flex-1 prose prose-sm max-w-none" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
      {
        tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {tags.map((tag, i) => (
              <span key={i} className="text-[11px] font-medium" style={{ color: "#A07850" }}>
                #{tag.toLowerCase().replace(/\s+/g, "_")}
              </span>
            ))}
          </div>
        )
      }
    </div >
  );
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex flex-col md:flex-row w-[900px] max-w-[95vw] max-h-[90vh] rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF" }} onClick={(e) => e.stopPropagation()}>
        {/* Left Panel: Image Gallery or Content */}
        <div className="w-full md:w-1/2 h-64 md:h-auto flex-shrink-0 relative overflow-hidden" style={{ backgroundColor: "#000" }}>
          {imageList.length > 0 ? (
            <div ref={imageScrollRef} onScroll={handleImageScroll} className="hide-scrollbar flex w-full h-full overflow-x-scroll overflow-y-hidden snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
              {imageList.map((img) => {
                const imageUrl = img.image.startsWith("/media/") ? `${API_URL}${img.image}` : img.image;
                return (
                  <div key={img.id} className="relative w-full h-full flex-shrink-0 snap-center overflow-hidden">
                    <div className="absolute inset-0" style={{ backgroundImage: `url("${imageUrl}")`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", transform: "scale(1.2)" }} />
                    <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
                    <img src={imageUrl} alt={post.title} className="relative z-10 w-full h-full object-contain" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col p-6 overflow-y-auto feed-scroll" style={{ backgroundColor: "#F5EFE0" }}>
              <div className="flex items-center gap-1 mb-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <span className="text-xs" style={{ color: "#8B7355" }}>{post.location || post.region || "Algeria"}</span>
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
              <div className="text-sm leading-relaxed prose prose-sm max-w-none" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
            </div>
          )}
        </div>

        {/* Right Panel: Comments/Annotations */}
        <div className="w-full md:w-1/2 flex flex-col overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>
          <div className="flex items-center px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
            <div className="w-[38px] h-[38px] rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#E0D5C5" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                <button
                  className="font-bold text-base hover:underline text-left"
                  style={{ color: "#432817", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  onClick={() => { if (!post.user_username) return; onClose(); router.push(`/user/${post.user_username}`); }}
                >
                  {post.user_display_name || post.user_username}
                </button>
                <p className="text-[11px]" style={{ color: "#8B7355" }}>{formatDate(post.created_at)}</p>
              </div>
            </div>
            <div className="relative" ref={postMenuRef}>
              <button className="p-1 rounded hover:bg-[#E0D5C5] transition-colors mr-2" onClick={() => setShowPostMenu(!showPostMenu)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B7355"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
              </button>
              {showPostMenu && (
                <div className="absolute right-0 top-full mt-1 py-2 rounded-lg shadow-lg z-50" style={{ backgroundColor: "#FFF8E2" }}>
                  <button className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={() => setShowPostMenu(false)}>Report post</button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#E0D5C5] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {imageList.length > 0 && (
            <div className="px-5 pt-3 pb-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
              <div className="flex items-center gap-1 mb-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <span className="text-xs" style={{ color: "#8B7355" }}>{post.location || post.region || "Algeria"}</span>
              </div>
              <h3 className="text-base font-bold" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />

              {isContentLong && !contentExpanded ? (
                <p className="text-xs leading-relaxed mt-1" style={{ color: "#432817" }}>
                  {post.content.replace(/<[^>]*>/g, "").slice(0, CONTENT_LIMIT) + "… "}
                  <button className="font-semibold" style={{ color: "#8B6914" }} onClick={() => setContentExpanded(true)}>See more</button>
                </p>
              ) : (
                <div className="text-xs leading-relaxed prose prose-sm max-w-none mt-1" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
              )}
              {isContentLong && contentExpanded && (
                <button className="font-semibold text-xs mt-1" style={{ color: "#8B6914" }} onClick={() => setContentExpanded(false)}>See less</button>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag, i) => (
                    <span key={i} className="text-[11px] font-medium" style={{ color: "#A07850" }}>#{tag.toLowerCase().replace(/\s+/g, "_")}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
            <button
              className="flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              style={{
                color: activeTab === "comments" ? "#432817" : "#8B7355",
                borderBottom: activeTab === "comments" ? "2px solid #432817" : "2px solid transparent",
              }}
              onClick={() => setActiveTab("comments")}
            >
              <CommentIcon size={13} />
              Comments ({comments.length})
            </button>
            <button
              className="flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              style={{
                color: activeTab === "annotations" ? "#432817" : "#8B7355",
                borderBottom: activeTab === "annotations" ? "2px solid #432817" : "2px solid transparent",
              }}
              onClick={() => setActiveTab("annotations")}
            >
              <AnnotationIcon size={13} />
              Annotations ({acceptedAnnotationsCount})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto feed-scroll">
            {activeTab === "comments" && (
              <div className="px-5 py-3 flex flex-col gap-3">
                {topLevelComments.map((comment) => renderCommentThread(comment))}
              </div>
            )}

            {activeTab === "annotations" && (
              <div className="px-5 py-3 flex flex-col gap-3">
                {annotationsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }} />
                  </div>
                ) : (
                  annotations.map((annotation) => (
                    <AnnotationItem
                      key={annotation.id}
                      annotation={annotation}
                      postId={post.id}
                      postAuthorId={post.user_id}
                      onDelete={handleDeleteAnnotation}
                      onAccept={handleAcceptAnnotation}
                      onReject={handleRejectAnnotation}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <div className="px-5 py-2 flex items-center justify-between flex-shrink-0 border-t" style={{ borderColor: "#E0D5C5" }}>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-xs transition-all" style={{ color: gemmed ? "#4FC3F7" : "#432817" }} onClick={handleGem}>
                <GemIcon size={14} filled={gemmed} active={gemmed} />
                {formatCount(gemsCount)}
              </button>
              <button
                className="flex items-center gap-1 text-xs transition-all"
                style={{ color: activeTab === "comments" ? "#432817" : "#8B7355" }}
                onClick={() => setActiveTab("comments")}
              >
                <CommentIcon size={14} /> {formatCount(comments.length)}
              </button>
              <button
                className="flex items-center gap-1 text-xs transition-all"
                style={{ color: activeTab === "annotations" ? "#432817" : "#8B7355" }}
                onClick={() => setActiveTab("annotations")}
              >
                <AnnotationIcon size={14} /> {formatCount(acceptedAnnotationsCount)}
              </button>
            </div>
            <button className="transition-all" style={{ color: saved ? "#8B6914" : "#432817" }} onClick={handleSave}>
              <BookmarkIcon size={18} filled={saved} active={saved} />
            </button>
          </div>

          <div className="px-5 py-3 flex items-center gap-2 flex-shrink-0">
            {activeTab === "comments" ? (
              <>
                <input
                  type="text"
                  placeholder="Add a comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
                  className="flex-1 text-xs rounded-xl px-4 py-2.5 outline-none border"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0D5C5", color: "#432817" }}
                />
                <button
                  onClick={handleSubmitComment}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#432817" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Add an annotation"
                  value={newAnnotationText}
                  onChange={(e) => setNewAnnotationText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmitAnnotation(); }}
                  className="flex-1 text-xs rounded-xl px-4 py-2.5 outline-none border"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0D5C5", color: "#432817" }}
                />
                <button
                  onClick={handleSubmitAnnotation}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#432817" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── POST CARD ─────────────────── */

function PostCard({
  post,
  isNew,
  onCommentClick,
  onAnnotationClick,
  interaction,
  onInteractionChange,
}: {
  post: ApiPost;
  isNew: boolean;
  onCommentClick: () => void;
  onAnnotationClick: () => void;
  interaction: PostInteraction;
  onInteractionChange: (update: Partial<PostInteraction>) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { gemmed, gemsCount, saved, commentsCount, annotationsCount } = interaction;
  const imageList = post.images ?? [];
  const tags = buildTags(post);

  const handleGem = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextGemmed = !gemmed;
    const nextCount = nextGemmed ? gemsCount + 1 : gemsCount - 1;
    onInteractionChange({ gemmed: nextGemmed, gemsCount: nextCount });
    toggleStoredItem("gemmed_posts", post.id, nextGemmed);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/gem/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle gem");
    } catch {
      onInteractionChange({ gemmed, gemsCount });
      toggleStoredItem("gemmed_posts", post.id, gemmed);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !saved;
    onInteractionChange({ saved: nextSaved });
    toggleStoredItem("saved_posts", post.id, nextSaved);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/save/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle save");
    } catch {
      onInteractionChange({ saved });
      toggleStoredItem("saved_posts", post.id, saved);
    }
  };

  const scrollToImage = (index: number) => {
    const el = imageScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * index, behavior: "smooth" });
    setCurrentImageIndex(index);
  };

  const handleImageScroll = () => {
    const el = imageScrollRef.current;
    if (!el) return;
    setCurrentImageIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div
      className={`rounded-xl mb-5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${isNew ? "post-fade-in" : ""}`}
      style={{ boxShadow: "0 2px 16px rgba(67,40,23,0.08)", backgroundColor: "var(--light)" }}
      onClick={onCommentClick}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(67,40,23,0.14)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 16px rgba(67,40,23,0.08)"; }}
    >
      <div className="flex items-center px-5 pt-4 pb-2">
        <div className="w-[42px] h-[42px] rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#E0D5C5" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#8B7355" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              className="font-bold text-base hover:underline text-left"
              style={{ color: "#432817", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); if (!post.user_username) return; router.push(`/user/${post.user_username}`); }}
            >
              {post.user_display_name || post.user_username}
            </button>
            <p className="text-xs" style={{ color: "#8B7355" }}>{formatDate(post.created_at)}</p>
          </div>
        </div>
        <div className="relative">
          <button className="p-1 rounded hover:bg-[#FFF8E2] transition-colors" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 py-2 px-4 rounded-lg shadow-lg z-50" style={{ backgroundColor: "#FFF8E2" }}>
              <button className="text-sm font-bold whitespace-nowrap" style={{ color: "#432817" }} onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}>Report post</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 px-5 pb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        <span className="text-xs" style={{ color: "#8B7355" }}>{post.location || post.region || "Algeria"}</span>
      </div>

      <PostDetailBadge post={post} />

      <h3 className="px-5 pb-2 text-xl font-bold prose prose-sm max-w-none" style={{ color: "#432817" }}>
        <div dangerouslySetInnerHTML={{ __html: post.title }} />
      </h3>

      <ExpandableContent content={post.content} className="px-5 pb-2 text-sm leading-relaxed" style={{ color: "#432817" }} />
      <PostTags tags={tags} />

      {imageList.length > 0 && (
        <div className="relative px-4 pb-3" onClick={(e) => e.stopPropagation()}>
          {imgError ? (
            <div className="w-full rounded-lg flex items-center justify-center" style={{ height: 460, background: "linear-gradient(135deg, #C8A96E, #8B6914)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden rounded-lg h-[300px] sm:h-[400px] md:h-[460px]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
              <div ref={imageScrollRef} onScroll={handleImageScroll} className="hide-scrollbar flex w-full h-full overflow-x-scroll overflow-y-hidden snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
                {imageList.map((img) => {
                  const imageUrl = img?.image
                    ? img.image.startsWith("/media/")
                      ? `${API_URL}${img.image}`
                      : img.image
                    : "";
                  const bgImageUrl = imageUrl ? encodeURI(imageUrl) : "";
                  return (
                    <div key={img.id} className="relative w-full h-full flex-shrink-0 snap-center overflow-hidden">
                      {bgImageUrl ? (
                        <>
                          <div className="absolute inset-0" style={{ backgroundImage: `url("${bgImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", transform: "scale(1.2)" }} />
                          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
                        </>
                      ) : null}
                      {imageUrl ? (
                        <img src={imageUrl} alt={post.title} className="relative z-10 w-full h-full object-contain" onError={() => setImgError(true)} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {imageList.length > 1 && currentImageIndex > 0 && (
                <button type="button" className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 hover:scale-105" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); scrollToImage(currentImageIndex - 1); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              )}
              {imageList.length > 1 && currentImageIndex < imageList.length - 1 && (
                <button type="button" className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 hover:scale-105" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); scrollToImage(currentImageIndex + 1); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              )}
              {imageList.length > 1 && (
                <>
                  <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.15)" }} onClick={(e) => e.stopPropagation()}>
                    {imageList.map((_, index) => (
                      <button key={index} type="button" onClick={(e) => { e.stopPropagation(); scrollToImage(index); }} className="transition-all duration-200" style={{ width: currentImageIndex === index ? 18 : 8, height: 8, borderRadius: 999, background: currentImageIndex === index ? "#FFF8E2" : "rgba(255,255,255,0.5)" }} />
                    ))}
                  </div>
                  <div className="absolute top-3 left-3 z-30 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md" style={{ background: "rgba(0,0,0,0.35)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>{currentImageIndex + 1}/{imageList.length}</div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F0EAD8" }}>
        <div className="flex items-center gap-5">
          <button className="flex items-center gap-1.5 text-xs transition-all" style={{ color: gemmed ? "#4FC3F7" : "#432817" }} onClick={handleGem}>
            <GemIcon filled={gemmed} active={gemmed} />
            <span>{formatCount(gemsCount)}</span>
          </button>
          <button
            className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#8B6914] cursor-pointer"
            style={{ color: "#432817" }}
            onClick={(e) => {
              e.stopPropagation();
              onCommentClick();
            }}
          >
            <CommentIcon />
            <span>{formatCount(commentsCount)}</span>
          </button>
          <button
            className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#8B6914] cursor-pointer"
            style={{ color: "#432817" }}
            onClick={(e) => {
              e.stopPropagation();
              onAnnotationClick();
            }}
          >
            <AnnotationIcon />
            <span>{formatCount(annotationsCount)}</span>
          </button>
        </div>
        <button className="flex items-center gap-1.5 text-xs transition-all" style={{ color: saved ? "#8B6914" : "#432817" }} onClick={handleSave}>
          <BookmarkIcon filled={saved} active={saved} />
        </button>
      </div>
    </div>
  );
}

/* ───────────────── MAIN PAGE ───────────────── */

export default function HomePageRoute() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPostStart, setNewPostStart] = useState(-1);
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);
  const [selectedPostTab, setSelectedPostTab] = useState<"comments" | "annotations">("comments");
  const [showFilter, setShowFilter] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    region: "All",
    historical_period: "All",
    monument_type: "All",
    status: "All",
  });

  const constructUrl = (filters: typeof activeFilters, query: string) => {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (filters.region !== "All") params.append("region", filters.region);
    if (filters.historical_period !== "All") params.append("historical_period", filters.historical_period);
    if (filters.monument_type !== "All") params.append("monument_type", filters.monument_type);
    if (filters.status !== "All") params.append("status", filters.status.toLowerCase());

    return `${API_URL}/api/posts/events/filter/?${params.toString()}`;
  };

  const [nextUrl, setNextUrl] = useState<string | null>(constructUrl({ region: "All", historical_period: "All", monument_type: "All", status: "All" }, ""));

  const [postInteractions, setPostInteractions] = useState<Record<string, PostInteraction>>({});

  const getInteraction = (post: ApiPost): PostInteraction =>
    postInteractions[post.id] ?? {
      gemmed: post.is_gemmed ?? getStoredSet("gemmed_posts").has(post.id),
      gemsCount: post.gems_count,
      saved: post.is_saved ?? getStoredSet("saved_posts").has(post.id),
      commentsCount: post.comments_count ?? 0,
      annotationsCount: post.accepted_annotations_count ?? 0,
    };

  const updateInteraction = (postId: string, update: Partial<PostInteraction>) => {
    setPostInteractions((prev) => {
      const sourcePost = posts.find((p) => p.id === postId);
      const existing = prev[postId] ?? {
        gemmed: sourcePost?.is_gemmed ?? getStoredSet("gemmed_posts").has(postId),
        gemsCount: sourcePost?.gems_count ?? 0,
        saved: sourcePost?.is_saved ?? getStoredSet("saved_posts").has(postId),
        commentsCount: sourcePost?.comments_count ?? 0,
        annotationsCount: sourcePost?.accepted_annotations_count ?? 0,
      };
      return { ...prev, [postId]: { ...existing, ...update } };
    });
  };

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLElement | null>(null);

  const fetchPosts = async (url: string, reset = false) => {
    if (!url || loading) return;
    const token = getAuthToken();
    try {
      setLoading(true);
      const res = await fetch(url, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("authUser");
          window.location.href = "/login";
          return;
        }
        console.error(`HTTP error! status: ${res.status}`);
        setNextUrl(null);
        return;
      }
      const data = await res.json();
      const formattedPosts: ApiPost[] = (data.results || data).map((post: any, i: number) => ({
        id: String(post.id),
        user_display_name: post.user_display_name ?? "",
        user_username: post.user_username ?? "",
        title: post.title ?? "",
        content: post.content ?? "",
        post_type: post.post_type ?? "",
        region: post.region ?? "",
        location: post.location ?? "",
        gems_count: post.gems_count ?? 0,
        comments_count: post.comments_count ?? 0,
        images: Array.isArray(post.images) ? post.images : [],
        tags: Array.isArray(post.tags) ? post.tags : [],
        historical_period: post.historical_period ?? "",
        monument_type: post.monument_type ?? "",
        created_at: post.created_at ?? "",
        alert_details: post.alert_details ?? null,
        event_details: post.event_details ?? null,
        _key: (reset ? 0 : posts.length) + i,
      }));
      setPosts(prev => reset ? formattedPosts : [...prev, ...formattedPosts]);
      setNextUrl(data.next ?? null);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && nextUrl) {
          fetchPosts(nextUrl);
        }
      },
      { threshold: 1.0 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextUrl, loading, posts.length]);

  const handleApplyFilters = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    const url = constructUrl(filters, searchQuery);
    setNextUrl(url);
    fetchPosts(url, true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = constructUrl(activeFilters, searchQuery);
    setNextUrl(url);
    fetchPosts(url, true);
  };

  useEffect(() => {
    const feedElement = feedRef.current;
    if (!feedElement) return;
    const handleScroll = () => { if (feedElement.scrollTop > 10) setShowFilter(false); };
    feedElement.addEventListener("scroll", handleScroll);
    return () => feedElement.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="flex h-screen overflow-hidden justify-center w-full" style={{ fontFamily: "var(--font-lato), sans-serif", backgroundColor: "#FFF8E2" }}>
        <LeftSidebar activePage="events" />
        <div className="flex h-full w-full max-w-[1116px] md:ml-[80px] pb-16 md:pb-0">
          <div className="flex flex-1 flex-col">
            <div className="sticky top-0 z-40 px-6 pt-4 pb-3 flex flex-col gap-4" style={{ backgroundColor: "var(--cream)" }}>
              <form onSubmit={handleSearch} className="flex items-center w-full rounded-full px-4 py-2.5 transition-all duration-200" style={{ backgroundColor: "var(--light)", border: isFocused ? "1px solid #432817" : "1px solid var(--brown)", boxShadow: isFocused ? "0 0 0 3px rgba(67,40,23,0.15)" : "0 1px 8px rgba(67,40,23,0.06)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="flex-1 ml-3 outline-none bg-transparent text-sm"
                  style={{ color: "var(--brown)", fontFamily: "var(--font-lato)" }}
                />
                <button type="button" className="flex-shrink-0 p-1 rounded hover:bg-[#F0E8CC] transition-colors" onClick={() => setShowFilter(!showFilter)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                    <circle cx="8" cy="6" r="1.5" fill="#432817" /><circle cx="16" cy="12" r="1.5" fill="#432817" /><circle cx="10" cy="18" r="1.5" fill="#432817" />
                  </svg>
                </button>
              </form>
              <FilterSection isVisible={showFilter} onClose={() => setShowFilter(false)} onApply={handleApplyFilters} />
            </div>

            <div className="flex flex-1 overflow-hidden">
              <main ref={feedRef} className="flex-1 overflow-y-auto feed-scroll px-6 py-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <MobileEventsStrip />
                {posts.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                    <p className="text-sm font-bold" style={{ color: "var(--brown)" }}>No events found matching your criteria.</p>
                  </div>
                ) : (
                  posts.map((post, index) => (
                    <React.Fragment key={post._key ?? post.id ?? index}>
                      <PostCard
                        post={post}
                        isNew={index >= newPostStart && newPostStart !== -1}
                        interaction={getInteraction(post)}
                        onInteractionChange={(update) => updateInteraction(post.id, update)}
                        onCommentClick={() => {
                          setSelectedPost(post);
                          setSelectedPostTab("comments");
                        }}
                        onAnnotationClick={() => {
                          setSelectedPost(post);
                          setSelectedPostTab("annotations");
                        }}
                      />
                    </React.Fragment>
                  ))
                )}
                {loading && (
                  <div className="flex justify-center py-6">
                    <div className="w-8 h-8 rounded-full border-3 border-t-transparent loader-spin" style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }} />
                  </div>
                )}
                <div ref={sentinelRef} className="h-4" />
              </main >
              <RightSidebar />
            </div >
          </div >
        </div >
      </div >

      {selectedPost && (
        <PostModal
          post={selectedPost}
          initialTab={selectedPostTab}
          interaction={getInteraction(selectedPost)}
          onInteractionChange={(update) => updateInteraction(selectedPost.id, update)}
          onClose={() => setSelectedPost(null)}
        />
      )
      }
    </>
  );
}