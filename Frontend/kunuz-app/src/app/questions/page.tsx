"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import DOMPurify from "dompurify";
import AiPostInsight from "@/components/AiPostInsight";
import RepostButton from "@/components/RepostButton";
import LeftSidebar from "@/components/LeftSidebar";
import LocationWorldCard from "@/components/LocationWorldCard";
import {
  translateHistoricalPeriod,
  translateMonumentType,
  translatePostType,
  translateRegion,
} from "@/lib/authFilterOptions";

//const API_URL =
//  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";
const API_URL = "http://127.0.0.1:8000";

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
  | { id?: string; username?: string; display_name?: string; role?: string; is_staff?: boolean; email?: string }
  | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("user_data") || localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const isModerator = (user: any) => {
  if (!user) return false;
  const role = String(user.role || user.user_role || user.Role || user.group_role || "").toLowerCase();
  const isStaff = user.is_staff === true || user.is_staff === 1 || user.is_staff === "true" ||
    user.is_admin === true || user.is_admin === 1 || user.is_admin === "true" ||
    user.is_superuser === true || user.is_moderator === true || user.is_moderator === 1;
  return (
    role === "moderator" ||
    role === "admin" ||
    isStaff
  );
};

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
  user_profile_picture?: string;
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
  is_reposted?: boolean;
  reposts_count?: number;
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
  reposted: boolean;
  repostsCount: number;
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
  user_profile_picture?: string;
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
  user_profile_picture: string;
  content: string;
  created_at: string;
  parent: string | null;
  gems_count: number;
  is_gemmed: boolean;
};

type ReportTargetType = "post" | "comment" | "annotation";

async function submitReport(
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
): Promise<void> {
  const token = getAuthToken();

  const res = await fetch(`${API_URL}/api/reports/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target_type: targetType,
      target_id: targetId,
      reason,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Failed to submit report.");
  }
}

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
    user_profile_picture: String(raw.user_profile_picture ?? ""),
    content: String(raw.content ?? raw.text ?? ""),
    created_at: String(raw.created_at ?? ""),
    parent: normalizeParent(raw.parent, raw.parent_id),
    gems_count: Number(raw.gems_count ?? 0),
    is_gemmed: Boolean(raw.is_gemmed ?? false),
  };
}

function resolveProfilePictureUrl(profilePicture?: string): string {
  const value = String(profilePicture ?? "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  return value;
}

function UserAvatar({
  profilePicture,
  size,
  iconSize,
}: {
  profilePicture?: string;
  size: number;
  iconSize: number;
}) {
  const imageUrl = resolveProfilePictureUrl(profilePicture);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Profile picture"
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, backgroundColor: "var(--avatar-surface)" }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="var(--text-muted)" stroke="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
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

const GROUP_DEFINITIONS = [
  { key: "heritagePhotography", members: "2.7k", image: "/heritage-photography.jpg" },
  { key: "unescoWorldHeritage", members: "4.1k", image: "/unisco.jpg" },
  { key: "monumentsOfTipaza", members: "1.9k", image: "/monuments-of-tipaza.jpg" },
] as const;

type GroupCard = {
  desc: string;
  image: string;
  members: string;
  membersLabel: string;
  name: string;
};

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

const PeopleIcon = ({ className = "", size = 12 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
  const feedT = useTranslations("auth.feed");
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
          {expanded ? feedT("actions.seeLess") : feedT("actions.seeMore")}
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
  const feedT = useTranslations("auth.feed");
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
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#5C7A3E" }}>{feedT("labels.event")}</span>
          <span className="text-xs font-bold" style={{ color: "#2E4A1E" }}>{formatEventTime(post.event_details)}</span>
        </div>
      </div>
    );
  }

  if (post.post_type === "alert" && post.alert_details) {
    const level = URGENCY_COLORS[post.alert_details.urgence_level] ?? URGENCY_COLORS.medium;
    const urgencyLabels: Record<string, string> = {
      low: feedT("urgency.low"),
      medium: feedT("urgency.medium"),
      high: feedT("urgency.high"),
      critical: feedT("urgency.critical"),
    };
    const statusLabels: Record<string, string> = {
      restored: feedT("statuses.restored"),
      under_intervention: feedT("statuses.underIntervention"),
      destroyed: feedT("statuses.destroyed"),
      alert: feedT("statuses.alert"),
    };
    const statusLabel = statusLabels[post.alert_details.current_status] ?? post.alert_details.current_status;
    const levelLabel = urgencyLabels[post.alert_details.urgence_level] ?? feedT("urgency.medium");
    return (
      <div className="mx-5 mb-3 px-4 py-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: level.bg, border: `1px solid ${level.border}` }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: level.dot }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: level.dot }}>{feedT("labels.alert")}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: level.dot }}>{levelLabel}</span>
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
  const commonT = useTranslations("auth.common");
  const feedT = useTranslations("auth.feed");
  const [showMenu, setShowMenu] = useState(false);
  const [gemmed, setGemmed] = useState(comment.is_gemmed);
  const [gemsCount, setGemsCount] = useState(comment.gems_count);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setGemmed(comment.is_gemmed);
    setGemsCount(comment.gems_count);
    setEditText(comment.content);
    setIsEditing(false);
  }, [comment.id, comment.is_gemmed, comment.gems_count, comment.content]);

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
      setGemsCount(Number(data?.data?.gems_count ?? gemsCount));
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

  const handleEditComment = () => {
    setEditText(comment.content);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEditedComment = async () => {
    const nextContent = editText.trim();
    if (!nextContent) return;

    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/comments/${comment.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: nextContent }),
      });

      if (!res.ok) return;

      setIsEditing(false);
      onRefresh?.();
    } catch { }
  };

  const handleCancelEditComment = () => {
    setEditText(comment.content);
    setIsEditing(false);
  };

  const handleReportComment = async () => {
    const reason = window.prompt(feedT("prompts.reportComment"));
    if (!reason || !reason.trim()) return;

    try {
      await submitReport("comment", comment.id, reason.trim());
      setShowMenu(false);
      window.alert(feedT("feedback.commentReported"));
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : feedT("feedback.commentReportFailed")
      );
    }
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
      <UserAvatar profilePicture={comment.user_profile_picture} size={32} iconSize={16} />

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
                  <>
                    <button
                      className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]"
                      style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                      onClick={handleEditComment}
                    >
                      {feedT("actions.editComment")}
                    </button>
                    <button
                      className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#FDE8E8]"
                      style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                      onClick={handleDeleteComment}
                    >
                      {feedT("actions.deleteComment")}
                    </button>
                  </>
                ) : (
                  <button
                    className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]"
                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                    onClick={handleReportComment}
                  >
                    {feedT("actions.reportComment")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-xs rounded-xl px-3 py-2 outline-none border resize-none"
              rows={3}
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E0D5C5",
                color: "#432817",
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ backgroundColor: "#432817", color: "#FFF8E2" }}
                onClick={handleSaveEditedComment}
              >
                {commonT("save")}
              </button>
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ backgroundColor: "#E0D5C5", color: "#432817" }}
                onClick={handleCancelEditComment}
              >
                {commonT("cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm leading-relaxed prose prose-sm max-w-none"
            style={{ color: "#432817" }}
          >
            {stripHtml(comment.content)}
          </div>
        )}

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
            <span>{commonT("reply")}</span>
          </button>
        </div>

        {showReplyInput && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder={feedT("placeholders.reply")}
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
  onRefresh,
}: {
  annotation: Annotation;
  postId: string;
  postAuthorId?: string;
  onDelete: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRefresh?: () => void;
}) {
  const commonT = useTranslations("auth.common");
  const feedT = useTranslations("auth.feed");
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(annotation.text ?? "");
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

  const handleEditAnnotation = () => {
    setEditText(annotation.text ?? "");
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEditedAnnotation = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(
        `${API_URL}/api/posts/${postId}/annotations/${annotation.id}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: editText }),
        }
      );
      if (!res.ok) return;
      setIsEditing(false);
      onRefresh?.();
    } catch { }
  };

  const handleCancelEditAnnotation = () => {
    setEditText(annotation.text ?? "");
    setIsEditing(false);
  };

  const handleReport = async () => {
    const reason = window.prompt(feedT("prompts.reportAnnotation"));
    if (!reason || !reason.trim()) return;

    try {
      await submitReport("annotation", annotation.id, reason.trim());
      setShowMenu(false);
      window.alert(feedT("feedback.annotationReported"));
    } catch {
      window.alert(feedT("feedback.annotationReportFailed"));
    }
  };

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#FFF3E0", color: "#E07B39", label: feedT("statuses.pending") },
    accepted: { bg: "#EAF0E6", color: "#5C7A3E", label: feedT("statuses.accepted") },
    rejected: { bg: "#FDE8E8", color: "#C0392B", label: feedT("statuses.rejected") },
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
                  <>
                    <button
                      className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#F0EAD8]"
                      style={{ color: "#432817" }}
                      onClick={handleEditAnnotation}
                    >
                      {feedT("actions.editAnnotation")}
                    </button>
                    <button
                      className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#FDE8E8]"
                      style={{ color: "#432817" }}
                      onClick={handleDelete}
                    >
                      {feedT("actions.deleteAnnotation")}
                    </button>
                  </>
                )}

                {!isOwner && (
                  <button
                    className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#F0EAD8]"
                    style={{ color: "#432817" }}
                    onClick={handleReport}
                  >
                    {feedT("actions.reportAnnotation")}
                  </button>
                )}

                {isPostAuthor && annotation.status === "pending" && (
                  <>
                    <button
                      className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#EAF0E6]"
                      style={{ color: "#5C7A3E" }}
                      onClick={handleAccept}
                    >
                      {commonT("accept")}
                    </button>

                    <button
                      className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#FDE8E8]"
                      style={{ color: "#C0392B" }}
                      onClick={handleReject}
                    >
                      {commonT("reject")}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-xs rounded-xl px-3 py-2 outline-none border resize-none"
              rows={3}
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E0D5C5",
                color: "#432817",
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ backgroundColor: "#432817", color: "#FFF8E2" }}
                onClick={handleSaveEditedAnnotation}
              >
                {commonT("save")}
              </button>
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ backgroundColor: "#E0D5C5", color: "#432817" }}
                onClick={handleCancelEditAnnotation}
              >
                {commonT("cancel")}
              </button>
            </div>
          </div>
        ) : annotation.text ? (
          <p className="text-xs" style={{ color: "#432817" }}>
            {annotation.text}
          </p>
        ) : null}

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

function FilterSection({
  isVisible,
  onClose,
  onApply,
}: {
  isVisible: boolean;
  onClose: () => void;
  onApply: (filters: { region: string; post_type: string; historical_period: string; monument_type: string }) => void;
}) {
  const filtersT = useTranslations("auth.filters");
  const postFormT = useTranslations("auth.postForm");
  const [isAnimating, setIsAnimating] = useState(false);
  const [choices, setChoices] = useState<{
    regions: string[];
    post_types: string[];
    historical_periods: string[];
    monument_types: string[];
  }>({ regions: [], post_types: [], historical_periods: [], monument_types: [] });

  const [region, setRegion] = useState("All");
  const [postType, setPostType] = useState("All");
  const [historicalPeriod, setHistoricalPeriod] = useState("All");
  const [monumentType, setMonumentType] = useState("All");

  useEffect(() => {
    if (isVisible) setIsAnimating(true);
    else setTimeout(() => setIsAnimating(false), 300);
  }, [isVisible]);

  useEffect(() => {
    const token = getAuthToken();
    fetch(`${API_URL}/api/posts/filter-choices/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setChoices(data.data);
      })
      .catch(() => { });
  }, []);

  if (!isAnimating && !isVisible) return null;

  const handleReset = () => {
    setRegion("All");
    setPostType("All");
    setHistoricalPeriod("All");
    setMonumentType("All");
    onApply({ region: "", post_type: "", historical_period: "", monument_type: "" });
    onClose();
  };

  const handleApply = () => {
    onApply({
      region: region === "All" ? "" : region,
      post_type: postType === "All" ? "" : postType,
      historical_period: historicalPeriod === "All" ? "" : historicalPeriod,
      monument_type: monumentType === "All" ? "" : monumentType,
    });
    onClose();
  };

  const filters = [
    {
      label: filtersT("labels.postType"),
      options: [{ value: "All", label: filtersT("all") }, ...choices.post_types.map((value) => ({ value, label: translatePostType(value, postFormT) }))],
      value: postType,
      onChange: setPostType,
    },
    {
      label: filtersT("labels.region"),
      options: [{ value: "All", label: filtersT("all") }, ...choices.regions.map((value) => ({ value, label: translateRegion(value, postFormT) }))],
      value: region,
      onChange: setRegion,
    },
    {
      label: filtersT("labels.historicalPeriod"),
      options: [{ value: "All", label: filtersT("all") }, ...choices.historical_periods.map((value) => ({ value, label: translateHistoricalPeriod(value, postFormT) }))],
      value: historicalPeriod,
      onChange: setHistoricalPeriod,
    },
    {
      label: filtersT("labels.heritageType"),
      options: [{ value: "All", label: filtersT("all") }, ...choices.monument_types.map((value) => ({ value, label: translateMonumentType(value, postFormT) }))],
      value: monumentType,
      onChange: setMonumentType,
    },
  ];

  return (
    <div
      className={`absolute top-[65px] right-4.5 w-[340px] z-[60] overflow-hidden transition-all duration-400 origin-top-right ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-4 pointer-events-none"}`}
      style={{ backgroundColor: "var(--overlay-bg)", borderRadius: "28px", boxShadow: "0 25px 60px rgba(67,40,23,0.2)", border: "1.5px solid var(--border-soft)" }}
    >
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-soft)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--nav-active-bg)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--nav-active-icon)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato)" }}>{filtersT("title")}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div className="flex flex-col max-h-[50vh]">
        <div className="flex-1 overflow-y-auto px-6 py-5 feed-scroll">
          <div className="flex flex-col gap-5">
            {filters.map((filter) => (
              <div key={filter.label} className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: "var(--text-muted)" }}>{filter.label}</label>
                <div className="relative group w-full">
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full text-[11px] px-4 py-3 outline-none cursor-pointer appearance-none transition-all duration-300"
                    style={{ backgroundColor: "var(--panel-bg)", border: "1.5px solid var(--border-soft)", borderRadius: "14px", color: "var(--foreground)", fontWeight: "700" }}
                  >
                    {filter.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex gap-2 border-t" style={{ backgroundColor: "var(--panel-elevated)", borderColor: "var(--border-soft)" }}>
        <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:bg-black/5" style={{ border: "1.5px solid var(--border-soft)", color: "var(--foreground)" }}>{filtersT("reset")}</button>
        <button onClick={handleApply} className="flex-[2] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:shadow-lg border border-transparent" style={{ backgroundColor: "var(--nav-active-bg)", color: "var(--nav-active-icon)" }}>{filtersT("apply")}</button>
      </div>
    </div>
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
  const feedT = useTranslations("auth.feed");
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
  const { gemmed, gemsCount, saved, reposted, repostsCount } = interaction;

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
      setCurrentImageIndex(0);
      const scrollEl = imageScrollRef.current;
      if (scrollEl) {
        scrollEl.scrollLeft = 0;
      }
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
    if (id === "__refresh__") {
      fetchAnnotations(post.id);
      return;
    }
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
      className="hidden md:flex w-1/2 flex-shrink-0 relative overflow-hidden"
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
    <div className="hidden md:flex w-1/2 flex-shrink-0 flex flex-col overflow-y-auto feed-scroll px-6 py-5" style={{ backgroundColor: "#F5EFE0" }}>
      <div className="mb-1">
        <LocationWorldCard
          location={post.location}
          region={post.region}
          textStyle={{ color: "#8B7355" }}
          iconColor="#8B7355"
          iconSize={13}
          buttonClassName="mb-1"
        />
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

      <p className="text-sm leading-relaxed flex-1" style={{ color: "#432817" }}>{post.content}</p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tags.map((tag, i) => (
            <span key={i} className="text-[11px] font-medium" style={{ color: "#A07850" }}>
              #{tag.toLowerCase().replace(/\s+/g, "_")}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex flex-col md:flex-row w-full max-w-[1000px] max-h-[90vh] h-[90vh] rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF" }} onClick={(e) => e.stopPropagation()}>
        {LeftPanel}

        {/* Right Panel: Comments/Annotations */}
        <div className="w-full md:w-1/2 flex flex-col overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>
          <div className="flex items-center px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
            <UserAvatar profilePicture={post.user_profile_picture} size={38} iconSize={20} />
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
                  <button className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={() => setShowPostMenu(false)}>{feedT("actions.reportPost")}</button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#E0D5C5] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className={`px-5 pt-3 pb-3 border-b flex-shrink-0 ${imageList.length === 0 ? "block md:hidden" : ""}`} style={{ borderColor: "#E0D5C5" }}>
              <LocationWorldCard
                location={post.location}
                region={post.region}
                textStyle={{ color: "#8B7355" }}
                iconColor="#8B7355"
                iconSize={13}
                buttonClassName="mb-1"
              />
              <h3 className="text-base font-bold" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />

              {isContentLong && !contentExpanded ? (
                <p className="text-xs leading-relaxed mt-1" style={{ color: "#432817" }}>
                  {post.content.replace(/<[^>]*>/g, "").slice(0, CONTENT_LIMIT) + "… "}
                  <button className="font-semibold" style={{ color: "#8B6914" }} onClick={() => setContentExpanded(true)}>{feedT("actions.seeMore")}</button>
                </p>
              ) : (
                <div className="text-xs leading-relaxed prose prose-sm max-w-none mt-1" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
              )}
              {isContentLong && contentExpanded && (
                <button className="font-semibold text-xs mt-1" style={{ color: "#8B6914" }} onClick={() => setContentExpanded(false)}>{feedT("actions.seeLess")}</button>
              )}


            </div>

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
              {feedT("tabs.comments", { count: comments.length })}
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
              {feedT("tabs.annotations", { count: acceptedAnnotationsCount })}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto feed-scroll">
            {activeTab === "comments" && (
              <div className="px-5 py-3 flex flex-col gap-3">
                {topLevelComments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <CommentIcon size={28} className="opacity-30" />
                    <p className="text-xs" style={{ color: "#8B7355" }}>
                      {feedT("empty.comments")}
                    </p>
                  </div>
                ) : (
                  topLevelComments.map((comment) =>
                    renderCommentThread(comment)
                  )
                )}
              </div>
            )}

            {activeTab === "annotations" && (
              <div className="px-5 py-3 flex flex-col gap-3">
                {annotationsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }} />
                  </div>
                ) : annotations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <AnnotationIcon size={28} className="opacity-30" />
                    <p className="text-xs" style={{ color: "#8B7355" }}>{feedT("empty.annotations")}</p>
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
                      onRefresh={() => fetchAnnotations(post.id)}
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
              <RepostButton
                key={`${post.id}-${reposted}-${repostsCount}`}
                postId={post.id}
                initialReposted={reposted}
                initialCount={repostsCount}
                className="flex items-center gap-1 text-xs transition-all"
                style={{ color: "#432817" }}
                iconSize={14}
                onChange={({ reposted: nextReposted, repostsCount: nextRepostsCount }) => {
                  onInteractionChange({ reposted: nextReposted, repostsCount: nextRepostsCount });
                }}
              />
            </div>
            <div className="flex items-center gap-4">
              <AiPostInsight
                postId={post.id}
                title={post.title}
                buttonClassName="flex items-center gap-1 text-xs transition-all"
                buttonStyle={{ color: "#432817" }}
              />
              <button className="transition-all" style={{ color: saved ? "#8B6914" : "#432817" }} onClick={handleSave}>
                <BookmarkIcon size={18} filled={saved} active={saved} />
              </button>
            </div>
          </div>

          <div className="px-5 py-3 flex items-center gap-2 flex-shrink-0">
            {activeTab === "comments" ? (
              <>
                <input
                  type="text"
                  placeholder={feedT("placeholders.comment")}
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
                  placeholder={feedT("placeholders.annotation")}
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

/* ─────────────────── MOBILE GROUPS STRIP ─────────────────── */

function MobileGroupsStrip({
  groups,
  title,
}: {
  groups: GroupCard[];
  title: string;
}) {
  return (
    <div className="lg:hidden px-4 py-4">
      <h3 className="localized-container-title text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{title}</h3>
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {groups.slice(0, 5).map((group, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex flex-col items-center w-[75px]"
          >
            <div className="w-[60px] h-[60px] rounded-full overflow-hidden mb-1.5 border-2 border-white shadow-sm transition-transform hover:scale-105 cursor-pointer">
              <img
                src={group.image}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="localized-container-title text-[10px] font-bold text-center leading-tight line-clamp-1" style={{ color: "var(--foreground)" }}>
              {group.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── RIGHT SIDEBAR ─────────────────── */

function RightSidebar({
  groups,
  title,
}: {
  groups: GroupCard[];
  title: string;
}) {
  return (
    <aside className="w-[300px] flex-shrink-0 pl-5 pr-4 pt-4 h-full hidden lg:block overflow-hidden">
      <div className="sticky top-0 h-full flex flex-col">
        <h2 className="localized-container-title text-base font-bold mb-5 flex-shrink-0" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato)" }}>{title}</h2>
        <div className="flex flex-col gap-3 flex-shrink-0">
          {groups.slice(0, 5).map((group, i) => (
            <div key={i} className="flex gap-4 py-3.5 px-3 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5" style={{ width: "100%", boxShadow: "0 8px 22px rgba(67,40,23,0.08)", backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-soft)" }}>
              <img src={group.image} alt={group.name} className="w-[48px] h-[48px] rounded-full object-cover flex-shrink-0 border-2 shadow-sm" style={{ borderColor: "var(--panel-elevated)" }} />
              <div className="flex flex-col justify-center min-w-0">
                <span className="localized-container-title font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>{group.name}</span>
                <span className="localized-container-text text-xs leading-tight mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{group.desc}</span>
                <div className="localized-member-count flex items-center gap-1 mt-1.5">
                  <PeopleIcon className="w-3 h-3 text-[var(--accent-gold)]" />
                  <span className="text-[10px] font-bold" style={{ color: "var(--accent-gold)" }}>
                    {group.membersLabel}
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
  onDelete?: (postId: string) => void;
}) {
  const feedT = useTranslations("auth.feed");
  const user = getAuthUser();
  const isOwner = (user?.id === post?.user_id || (user?.username && (user.username === post?.user_username || user.username === post?.username)));
  const moderatorGlobal = isModerator(user);
  const isModeratorActive = moderatorGlobal;
  const canDelete = isOwner || moderatorGlobal;

  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"delete" | "edit" | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { gemmed, gemsCount, saved, reposted, repostsCount, commentsCount, annotationsCount } = interaction;
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
      className={`rounded-xl mb-5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${isNew ? "post-fade-in" : ""
        }`}
      style={{
        boxShadow: "0 2px 16px rgba(67,40,23,0.08)",
        backgroundColor: "var(--light)",
      }}
      onClick={onCommentClick}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(67,40,23,0.14)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 16px rgba(67,40,23,0.08)"; }}
    >
      <div className="flex items-center px-5 pt-4 pb-2">
        <UserAvatar profilePicture={post.user_profile_picture} size={42} iconSize={22} />
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
              {canDelete && (
                <>
                  {isOwner && (
                    <button
                      className="block w-full text-left py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-black/5 mb-1"
                      style={{ color: "var(--foreground)" }}
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); setConfirmAction("edit"); }}
                    >
                      {feedT("actions.editPost") || "Edit post"}
                    </button>
                  )}
                  <button
                    className="block w-full text-left py-2 text-sm font-bold whitespace-nowrap transition-colors hover:text-red-600 mb-1"
                    style={{ color: "#7B0000" }}
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); setConfirmAction("delete"); }}
                  >
                    {feedT("actions.deletePost")}
                  </button>
                </>
              )}
              {!isModeratorActive && (
                <button className="text-sm font-bold whitespace-nowrap" style={{ color: "#432817" }} onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}>{feedT("actions.reportPost")}</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-2">
        <LocationWorldCard
          location={post.location}
          region={post.region}
          textStyle={{ color: "#8B7355" }}
          iconColor="#8B7355"
          iconSize={14}
        />
      </div>

      <PostDetailBadge post={post} />

      <h3 className="px-5 pb-2 text-xl font-bold prose prose-sm max-w-none" style={{ color: "#432817" }}>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
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
          <RepostButton
            key={`${post.id}-${reposted}-${repostsCount}`}
            postId={post.id}
            initialReposted={reposted}
            initialCount={repostsCount}
            style={{ color: "#432817" }}
            onChange={({ reposted: nextReposted, repostsCount: nextRepostsCount }) => {
              onInteractionChange({ reposted: nextReposted, repostsCount: nextRepostsCount });
            }}
          />
        </div>
        <div className="flex items-center gap-4">
          <AiPostInsight
            postId={post.id}
            title={post.title}
            buttonStyle={{ color: "#432817" }}
          />
          <button className="flex items-center gap-1.5 text-xs transition-all" style={{ color: saved ? "#8B6914" : "#432817" }} onClick={handleSave}>
            <BookmarkIcon filled={saved} active={saved} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── POST CACHE HELPERS ─────────────────── */

const CACHE_KEY = "home_posts_cache";
const CACHE_NEXT_KEY = "home_posts_next";
const CACHE_SCROLL_KEY = "home_posts_scroll";
const MAX_CACHED_POSTS = 60; // ~3 pages

function savePostsToCache(posts: ApiPost[], nextUrl: string | null) {
  if (typeof window === "undefined") return;
  try {
    const toCache = posts.slice(0, MAX_CACHED_POSTS);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
    sessionStorage.setItem(CACHE_NEXT_KEY, nextUrl || "");
  } catch { /* storage full – ignore */ }
}

function loadPostsFromCache(): { posts: ApiPost[]; nextUrl: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const posts = JSON.parse(raw) as ApiPost[];
    const next = sessionStorage.getItem(CACHE_NEXT_KEY) || null;
    return { posts, nextUrl: next || null };
  } catch { return null; }
}

function saveScrollPosition(pos: number) {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(CACHE_SCROLL_KEY, String(pos)); } catch { }
}

function loadScrollPosition(): number {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(CACHE_SCROLL_KEY) || 0);
}

/* ─────────────────── MAIN PAGE ─────────────────── */

export default function HomePageRoute() {
  const t = useTranslations("auth.pages.home");
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPostStart, setNewPostStart] = useState(-1);
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);
  const [selectedPostTab, setSelectedPostTab] = useState<"comments" | "annotations">("comments");
  const [showFilter, setShowFilter] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ users: any[]; posts: ApiPost[] } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ region: string; post_type: string; historical_period: string; monument_type: string } | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(`${API_URL}/api/posts/`);
  const [postInteractions, setPostInteractions] = useState<Record<string, PostInteraction>>({});
  const [cacheRestored, setCacheRestored] = useState(false);

  const groups = useMemo<GroupCard[]>(
    () =>
      GROUP_DEFINITIONS.map((group) => ({
        desc: t(`guilds.items.${group.key}.description`),
        image: group.image,
        members: group.members,
        membersLabel: t("guilds.members", { count: group.members }),
        name: t(`guilds.items.${group.key}.name`),
      })),
    [t],
  );

  const normalizeApiPost = (raw: any, fallback?: ApiPost): ApiPost => ({
    id: String(raw?.id ?? fallback?.id ?? ""),
    user_id: raw?.user_id ?? fallback?.user_id ?? "",
    user_display_name: raw?.user_display_name ?? fallback?.user_display_name ?? "",
    user_username: raw?.user_username ?? fallback?.user_username ?? "",
    user_profile_picture: raw?.user_profile_picture ?? fallback?.user_profile_picture ?? "",
    title: raw?.title ?? fallback?.title ?? "",
    content: raw?.content ?? fallback?.content ?? "",
    post_type: raw?.post_type ?? fallback?.post_type ?? "",
    region: raw?.region ?? fallback?.region ?? "",
    location: raw?.location ?? fallback?.location ?? "",
    gems_count: raw?.gems_count ?? fallback?.gems_count ?? 0,
    comments_count: raw?.comments_count ?? fallback?.comments_count ?? 0,
    accepted_annotations_count:
      raw?.accepted_annotations_count ?? fallback?.accepted_annotations_count ?? 0,
    is_gemmed: raw?.is_gemmed ?? fallback?.is_gemmed ?? false,
    is_saved: raw?.is_saved ?? fallback?.is_saved ?? false,
    is_reposted: raw?.is_reposted ?? fallback?.is_reposted ?? false,
    reposts_count: raw?.reposts_count ?? fallback?.reposts_count ?? 0,
    images: Array.isArray(raw?.images) ? raw.images : fallback?.images ?? [],
    tags: Array.isArray(raw?.tags) ? raw.tags : fallback?.tags ?? [],
    historical_period: raw?.historical_period ?? fallback?.historical_period ?? "",
    monument_type: raw?.monument_type ?? fallback?.monument_type ?? "",
    created_at: raw?.created_at ?? fallback?.created_at ?? "",
    alert_details: raw?.alert_details ?? fallback?.alert_details ?? null,
    event_details: raw?.event_details ?? fallback?.event_details ?? null,
    _key: fallback?._key,
  });

  const getInteraction = (post: ApiPost): PostInteraction =>
    postInteractions[post.id] ?? {
      gemmed: post.is_gemmed ?? getStoredSet("gemmed_posts").has(post.id),
      gemsCount: post.gems_count,
      saved: post.is_saved ?? getStoredSet("saved_posts").has(post.id),
      reposted: post.is_reposted ?? false,
      repostsCount: post.reposts_count ?? 0,
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
        reposted: sourcePost?.is_reposted ?? false,
        repostsCount: sourcePost?.reposts_count ?? 0,
        commentsCount: sourcePost?.comments_count ?? 0,
        annotationsCount: sourcePost?.accepted_annotations_count ?? 0,
      };
      return {
        ...prev,
        [postId]: {
          ...existing,
          ...update,
          gemsCount: Math.max(
            0,
            update.gemsCount ?? existing.gemsCount ?? 0
          ),
        },
      };
    });
  };
  // ─────────────────────────────────────────────────────────────────────────

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Restore posts from sessionStorage cache on mount ── */
  useEffect(() => {
    const cached = loadPostsFromCache();
    if (cached && cached.posts.length > 0) {
      const restored = cached.posts.map((p, i) => ({ ...p, _key: i }));
      setPosts(restored);
      setNextUrl(cached.nextUrl);
      setCacheRestored(true);

      // Restore scroll position after render
      requestAnimationFrame(() => {
        const scrollPos = loadScrollPosition();
        if (feedRef.current && scrollPos > 0) {
          feedRef.current.scrollTop = scrollPos;
        }
      });

      // Background refresh: silently re-fetch page 1 to pick up new posts
      (async () => {
        try {
          const res = await apiFetch(`${API_URL}/api/posts/`);
          if (!res.ok) return;
          const data = await res.json();
          const freshPosts: ApiPost[] = (Array.isArray(data.results) ? data.results : [])
            .map((post: any, i: number) => ({ ...normalizeApiPost(post), _key: i }));
          if (freshPosts.length > 0) {
            setPosts(prev => {
              // Merge: replace cached page-1 posts with fresh ones, keep rest
              const existingIds = new Set(freshPosts.map(p => p.id));
              const remaining = prev.filter(p => !existingIds.has(p.id));
              const merged = [...freshPosts, ...remaining].map((p, i) => ({ ...p, _key: i }));
              savePostsToCache(merged, typeof data.next === "string" && data.next ? data.next : null);
              return merged;
            });
            if (typeof data.next === "string" && data.next) {
              setNextUrl(data.next);
            }
          }
        } catch { /* silent */ }
      })();
    }
  }, []);

  /* ── Save scroll position on scroll ── */
  useEffect(() => {
    const feedElement = feedRef.current;
    if (!feedElement) return;
    let ticking = false;
    const handleScroll = () => {
      if (feedElement.scrollTop > 10) setShowFilter(false);
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          saveScrollPosition(feedElement.scrollTop);
          ticking = false;
        });
      }
    };
    feedElement.addEventListener("scroll", handleScroll);
    return () => feedElement.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q.trim()) { setSearchResults(null); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const token = getAuthToken();
      try {
        const res = await fetch(`${API_URL}/api/posts/search/?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSearchResults(data.data || { users: [], posts: [] });
      } catch { } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const openPostModal = async (
    sourcePost: ApiPost,
    tab: "comments" | "annotations",
  ) => {
    setSelectedPost(sourcePost);
    setSelectedPostTab(tab);

    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/posts/${sourcePost.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const body = await res.json().catch(() => null);
      const rawPost = body?.data ?? body;
      if (!rawPost) return;

      const hydratedPost = normalizeApiPost(rawPost, sourcePost);
      setSelectedPost(hydratedPost);
      setPosts((prev) =>
        prev.map((item) =>
          item.id === hydratedPost.id
            ? { ...normalizeApiPost(hydratedPost, item), _key: item._key }
            : item
        )
      );
    } catch { }
  };

  const handleApplyFilter = async (filters: { region: string; post_type: string; historical_period: string; monument_type: string }) => {
    const hasFilter = Object.values(filters).some((v) => v !== "");
    if (!hasFilter) {
      setActiveFilters(null);
      setNextUrl(`${API_URL}/api/posts/`);
      setPosts([]);
      return;
    }
    setActiveFilters(filters);
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (filters.region) params.append("region", filters.region);
    if (filters.post_type) params.append("post_type", filters.post_type);
    if (filters.historical_period) params.append("historical_period", filters.historical_period);
    if (filters.monument_type) params.append("monument_type", filters.monument_type);
    try {
      const res = await fetch(`${API_URL}/api/posts/filter/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const payload = data.data?.results || data.data || data.results || data;
      const formatted: ApiPost[] = (Array.isArray(payload) ? payload : [])
        .map((post: any, i: number) => ({
          ...normalizeApiPost(post),
          _key: i,
        }));
      setPosts(formatted);
      setNextUrl(null);
    } catch { }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading || !nextUrl) return;
        // Skip fetch if we just restored from cache and still have posts
        if (cacheRestored && posts.length > 0) {
          setCacheRestored(false);
          return;
        }
        try {
          setLoading(true);
          const resolvedNextUrl =
            nextUrl.startsWith("http://") || nextUrl.startsWith("https://")
              ? nextUrl
              : `${API_URL}${nextUrl.startsWith("/") ? "" : "/"}${nextUrl}`;
          const res = await apiFetch(resolvedNextUrl);
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
          const previousLength = posts.length;
          const payload = data.data || data;
          const results = Array.isArray(payload.results) ? payload.results : (Array.isArray(payload) ? payload : (Array.isArray(data.results) ? data.results : []));
          const formattedPosts: ApiPost[] = results.map((post: any, i: number) => ({
            ...normalizeApiPost(post),
            _key: previousLength + i,
          }));
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = formattedPosts.filter(p => !existingIds.has(p.id));
            const updated = [...prev, ...uniqueNew];
            const newNext = typeof data.next === "string" && data.next ? data.next : null;
            savePostsToCache(updated, newNext);
            return updated;
          });
          const nextLink = payload.next !== undefined ? payload.next : data.next;
          setNextUrl(typeof nextLink === "string" && nextLink ? nextLink : null);
          if (formattedPosts.length > 0) setNewPostStart(previousLength);
        } catch (err) {
          console.error("Error fetching posts:", err);
          setNextUrl(null);
        } finally {
          setLoading(false);
        }
      },
      { threshold: 1.0 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextUrl, loading, posts.length, cacheRestored]);

  return (
    <>
      <div className="flex h-screen overflow-hidden justify-center w-full" style={{ fontFamily: "var(--font-lato), sans-serif", backgroundColor: "var(--background)" }}>
        <LeftSidebar activePage="home" />
        <div className="flex h-full w-full max-w-[1116px] md:ml-[80px] pb-16 md:pb-0">
          <div className="flex flex-1 flex-col">
            <div className="sticky top-0 z-40 px-6 pt-4 pb-3 flex flex-col gap-4" style={{ backgroundColor: "var(--nav-bg)" }}>
              <div className="flex items-center w-full rounded-full px-4 py-2.5 transition-all duration-200" style={{ backgroundColor: "var(--panel-bg)", border: isFocused ? "1px solid var(--accent-gold)" : "1px solid var(--brown)", boxShadow: isFocused ? "0 0 0 3px rgba(82, 65, 30, 0.18)" : "0 0px 0px rgba(20,12,6,0.1)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input
                  type="text"
                  placeholder={t("search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  className="flex-1 ml-3 outline-none bg-transparent text-sm"
                  style={{ color: "var(--foreground)", fontFamily: "var(--font-lato)" }}
                />
                <button className="flex-shrink-0 p-1 rounded hover:bg-[var(--panel-hover)] transition-colors" onClick={() => setShowFilter(!showFilter)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                    <circle cx="8" cy="6" r="1.5" fill="var(--foreground)" /><circle cx="16" cy="12" r="1.5" fill="var(--foreground)" /><circle cx="10" cy="18" r="1.5" fill="var(--foreground)" />
                  </svg>
                </button>
              </div>
              <FilterSection isVisible={showFilter} onClose={() => setShowFilter(false)} onApply={handleApplyFilter} />
              {searchQuery && isFocused && (
                <div className="absolute top-[60px] left-6 right-6 z-[70] rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "var(--overlay-bg)", border: "1px solid var(--border-soft)" }}>
                  {searchLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--border-soft)", borderTopColor: "var(--accent-gold)" }} />
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto feed-scroll">
                      {searchResults?.users && searchResults.users.length > 0 && (
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{t("search.sections.users")}</p>
                          {searchResults.users.map((user) => (
                            <button
                              key={user.id}
                              className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[var(--panel-hover)] transition-colors text-left"
                              onMouseDown={() => { window.location.href = `/user/${user.username}`; }}
                            >
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--avatar-surface)" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text-muted)" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              </div>
                              <div>
                                <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{user.display_name}</p>
                                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>@{user.username}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults?.posts && searchResults.posts.length > 0 && (
                        <div className="px-4 pt-2 pb-3">
                          <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{t("search.sections.posts")}</p>
                          {searchResults.posts.map((post) => (
                            <button
                              key={post.id}
                              className="w-full flex items-start gap-3 px-2 py-2 rounded-xl hover:bg-[var(--panel-hover)] transition-colors text-left"
                              onMouseDown={() => setSelectedPost(post as any)}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--avatar-surface)" }}>
                                <CommentIcon size={12} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: "var(--foreground)" }}>{post.title?.replace(/<[^>]*>/g, "")}</p>
                                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{post.content?.replace(/<[^>]*>/g, "").slice(0, 60)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults && searchResults.users.length === 0 && searchResults.posts.length === 0 && (
                        <div className="flex flex-col items-center py-6 gap-1">
                          <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{t("search.noResults", { query: searchQuery })}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-1 overflow-hidden">
              <main ref={feedRef} className="flex-1 overflow-y-auto feed-scroll px-6 py-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <MobileGroupsStrip groups={groups} title={t("guilds.title")} />
                {posts.map((post, index) => (
                  <React.Fragment key={`${post.id}-${index}`}>
                    <PostCard
                      post={post}
                      isNew={index >= newPostStart && newPostStart !== -1}
                      interaction={getInteraction(post)}
                      onInteractionChange={(update) => updateInteraction(post.id, update)}
                      onCommentClick={() => {
                        openPostModal(post, "comments");
                      }}
                      onAnnotationClick={() => {
                        openPostModal(post, "annotations");
                      }}
                    />
                  </React.Fragment>
                ))}
                {loading && (
                  <div className="flex justify-center py-6">
                    <div className="w-8 h-8 rounded-full border-3 border-t-transparent loader-spin" style={{ borderColor: "var(--border-soft)", borderTopColor: "var(--accent-gold)" }} />
                  </div>
                )}
                <div ref={sentinelRef} className="h-4" />
              </main>
              <RightSidebar groups={groups} title={t("guilds.title")} />
            </div>
          </div>
        </div>
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          initialTab={selectedPostTab}
          interaction={getInteraction(selectedPost)}
          onInteractionChange={(update) => updateInteraction(selectedPost.id, update)}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}
