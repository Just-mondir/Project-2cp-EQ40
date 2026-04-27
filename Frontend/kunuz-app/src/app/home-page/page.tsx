"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import DOMPurify from "dompurify";
import LeftSidebar from "@/components/LeftSidebar";
import LocationWorldCard from "@/components/LocationWorldCard";
import ReportPopup from "@/components/Report-popup";
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

function getAuthUser(): { id?: string; username?: string; display_name?: string; role?: string; is_staff?: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("user_data") || localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const isModerator = (user: any) => user?.role === "moderator" || user?.role === "admin" || user?.is_staff;


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

type Group = {
  id: string;
  name: string;
  description: string;
  member_count: number;
  profile_picture?: string;
  category: string;
  historical_period: string;
  region: string;
  visibility: string;
  admin_id: string;
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
  _raw?: Group | null;
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
  const [showReportPopup, setShowReportPopup] = useState(false);
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
  const canDelete = isOwner || isModerator(currentUser);

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
    if (!window.confirm(commonT("confirmDeleteComment"))) return;
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
    <>
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
                {canDelete ? (
                  <>
                    {isOwner && (
                      <button
                        className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]"
                        style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                        onClick={handleEditComment}
                      >
                        {feedT("actions.editComment")}
                      </button>
                    )}
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
              </button>
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
        {showReportPopup ? (
        <ReportPopup
          isOpen={showReportPopup}
          reportType="comment"
          targetId={comment.id}
          onClose={() => setShowReportPopup(false)}
        />
      ) : null}
    </>
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
  const currentUser = getAuthUser();
  const isOwner = currentUserId === String(annotation.user_id);
  const isPostAuthor = currentUserId === String(postAuthorId ?? "");
  const canDelete = isOwner || isModerator(currentUser);

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
    if (!window.confirm(commonT("confirmDeleteAnnotation"))) return;
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
                {canDelete ? (
                  <>
                    {isOwner && (
                      <button
                        className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#F0EAD8]"
                        style={{ color: "#432817" }}
                        onClick={handleEditAnnotation}
                      >
                        {feedT("actions.editAnnotation")}
                      </button>
                    )}
                    <button
                      className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#FDE8E8]"
                      style={{ color: "#432817" }}
                      onClick={handleDelete}
                    >
                      {feedT("actions.deleteAnnotation")}
                    </button>
                  </>
                ) : (
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
}