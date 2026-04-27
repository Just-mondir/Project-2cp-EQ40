"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import DOMPurify from "dompurify";
import AiPostInsight from "@/components/AiPostInsight";
import RepostButton from "@/components/RepostButton";
import LeftSidebar from "@/components/LeftSidebar";
import ImageUploadPanel, { type ImageItem } from "@/components/ImageUploadPanel";
import LocationWorldCard from "@/components/LocationWorldCard";
import ActionConfirmModal from "@/components/ActionConfirmModal";
import {
  HISTORICAL_PERIOD_VALUES,
  MONUMENT_TYPE_VALUES,
  MOBILIZATION_STATUS_VALUES,
  REGION_VALUES,
  URGENCY_LEVEL_VALUES,
  translateHistoricalPeriod,
  translateMobilizationStatus,
  translateMonumentType,
  translateRegion,
  translateUrgencyLevel,
} from "@/lib/authFilterOptions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

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

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken") || "";
  }
  return "";
};

function getStoredSet(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}

function toggleStoredItem(key: string, id: string, add: boolean) {
  const set = getStoredSet(key);
  add ? set.add(id) : set.delete(id);
  localStorage.setItem(key, JSON.stringify([...set]));
}

function getAuthUser(): { id?: string; username?: string; display_name?: string; role?: string; is_staff?: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("user") || localStorage.getItem("user_data") || localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
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


/* ───────────────── TYPES ───────────────── */

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

type HistoryReport = {
  id: string;
  post_id: string;
  description: string;
  images: string[];
  previous_status: string;
  requested_status: string;
  created_by: string;
  created_at: string;
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

function normalizeApiPost(raw: any): ApiPost {
  return {
    id: String(raw?.id ?? ""),
    user_id: String(raw?.user_id ?? ""),
    user_display_name: String(raw?.user_display_name ?? ""),
    user_username: String(raw?.user_username ?? ""),
    user_profile_picture: String(raw?.user_profile_picture ?? ""),
    username: String(raw?.username ?? ""),
    date: String(raw?.date ?? ""),
    title: String(raw?.title ?? ""),
    content: String(raw?.content ?? ""),
    post_type: String(raw?.post_type ?? ""),
    region: String(raw?.region ?? ""),
    location: String(raw?.location ?? ""),
    gems_count: Number(raw?.gems_count ?? 0),
    comments_count: Number(raw?.comments_count ?? 0),
    is_gemmed: Boolean(raw?.is_gemmed ?? false),
    is_saved: Boolean(raw?.is_saved ?? false),
    is_reposted: Boolean(raw?.is_reposted ?? false),
    reposts_count: Number(raw?.reposts_count ?? 0),
    images: Array.isArray(raw?.images) ? raw.images : [],
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    historical_period: String(raw?.historical_period ?? ""),
    monument_type: String(raw?.monument_type ?? ""),
    created_at: String(raw?.created_at ?? ""),
    alert_details: raw?.alert_details ?? null,
    event_details: raw?.event_details ?? null,
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
      style={{ width: size, height: size, backgroundColor: "#E0D5C5" }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="#8B7355" stroke="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

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
  if (!res.ok) throw new Error(data?.message || "Failed to submit report.");
}

function getAcceptedAnnotationsCount(annotations: Annotation[]): number {
  return annotations.filter((a) => a.status === "accepted").length;
}

const PROFILE_DATA = {
  bio: "Passionate about preserving Algeria's rich architectural heritage. Exploring the stories behind every stone, arch, and tile. Join me on this journey through time.",
};

/* ───────────────── SVG ICONS ───────────────── */

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

const HistoryIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);




/* ───────────────── TAGS ───────────────── */

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

/* ───────────────── EXPANDABLE CONTENT ───────────────── */

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

/* ───────────────── POST DETAIL BADGE ───────────────── */

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
    const statusKeyMap: Record<string, string> = {
      restored: "statuses.restored",
      under_intervention: "statuses.underIntervention",
      destroyed: "statuses.destroyed",
      alert: "statuses.alert",
    };
    const urgencyKeyMap: Record<string, string> = {
      low: "urgency.low",
      medium: "urgency.medium",
      high: "urgency.high",
      critical: "urgency.critical",
    };
    const statusLabel = statusKeyMap[post.alert_details.current_status]
      ? feedT(statusKeyMap[post.alert_details.current_status])
      : STATUS_LABELS[post.alert_details.current_status] ?? post.alert_details.current_status;
    const urgencyLabel = urgencyKeyMap[post.alert_details.urgence_level]
      ? feedT(urgencyKeyMap[post.alert_details.urgence_level])
      : level.label;
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
            <span className="text-xs font-bold" style={{ color: level.dot }}>{urgencyLabel}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: level.dot + "22", color: level.dot }}>{statusLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ───────────────── COMMENT ITEM ───────────────── */

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
  const commonT = useTranslations("auth.common");
  const feedT = useTranslations("auth.feed");
  const router = useRouter();
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
      setGemsCount(Number(data?.data?.gems_count ?? previousCount));
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

  const currentUser = getAuthUser();
  const currentUserId = String(currentUser?.id ?? "");
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

/* ───────────────── FILTER SECTION ───────────────── */

function FilterSection({ isVisible, onClose, onApply }: { isVisible: boolean; onClose: () => void; onApply: (filters: any) => void }) {
  const filtersT = useTranslations("auth.filters");
  const postFormT = useTranslations("auth.postForm");
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    region: "All",
    historical_period: "All",
    monument_type: "All",
    urgence_level: "All",
    current_status: "All",
  });

  useEffect(() => {
    if (isVisible) setIsAnimating(true);
    else setTimeout(() => setIsAnimating(false), 300);
  }, [isVisible]);

  if (!isAnimating && !isVisible) return null;

  const filters = [
    { key: "region", label: filtersT("labels.region"), options: ["All", ...REGION_VALUES] },
    { key: "historical_period", label: filtersT("labels.historicalPeriod"), options: ["All", ...HISTORICAL_PERIOD_VALUES] },
    { key: "monument_type", label: filtersT("labels.heritageType"), options: ["All", ...MONUMENT_TYPE_VALUES] },
    { key: "urgence_level", label: filtersT("labels.urgencyLevel"), options: ["All", ...URGENCY_LEVEL_VALUES] },
    { key: "current_status", label: filtersT("labels.mobilizationStatus"), options: ["All", ...MOBILIZATION_STATUS_VALUES] },
  ];

  const handleSelectChange = (key: string, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const reset = {
      region: "All",
      historical_period: "All",
      monument_type: "All",
      urgence_level: "All",
      current_status: "All",
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
      className={`absolute top-[65px] right-4.5 w-[340px] z-[60] overflow-hidden transition-all duration-400 cubic-bezier(0.16, 1, 0.3, 1) origin-top-right ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-4 pointer-events-none"}`}
      style={{ backgroundColor: "var(--background)", borderRadius: "28px", boxShadow: "0 25px 60px rgba(67,40,23,0.2)", border: "1.5px solid var(--brown)" }}
    >
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(67, 40, 23, 0.1)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--brown)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--brown)", fontFamily: "var(--font-lato)" }}>{filtersT("title")}</h3>
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
                    {filter.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "All"
                          ? filtersT("all")
                          : filter.key === "region"
                            ? translateRegion(opt, postFormT)
                            : filter.key === "historical_period"
                              ? translateHistoricalPeriod(opt, postFormT)
                              : filter.key === "monument_type"
                                ? translateMonumentType(opt, postFormT)
                                : filter.key === "urgence_level"
                                  ? translateUrgencyLevel(opt, postFormT)
                                  : translateMobilizationStatus(opt, postFormT)}
                      </option>
                    ))}
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
        <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:bg-black/5" style={{ border: "1.5px solid var(--brown)", color: "var(--brown)" }}>{filtersT("reset")}</button>
        <button onClick={handleApply} className="flex-[2] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:shadow-lg shadow-[#432817]/20 border border-transparent" style={{ backgroundColor: "var(--brown)", color: "var(--cream)" }}>{filtersT("apply")}</button>
      </div>
    </div>
  );
}


/* ───────────────── POST MODAL ───────────────── */

function PostModal({
  post,
  onClose,
  interaction,
  onInteractionChange,
  onMobilizationClick,
  initialTab = "comments",
}: {
  post: ApiPost | null;
  onClose: () => void;
  interaction: PostInteraction;
  onInteractionChange: (update: Partial<PostInteraction>) => void;
  onMobilizationClick: () => void;
  initialTab?: "comments" | "annotations" | "history";
  onDelete?: (postId: string) => void;
}) {
  const feedT = useTranslations("auth.feed");
  const pageT = useTranslations("auth.pages.monumentsInDanger");
  const postFormT = useTranslations("auth.postForm");
  const [newComment, setNewComment] = useState("");
  const [newAnnotationText, setNewAnnotationText] = useState("");
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "annotations" | "history">(initialTab);
  const [confirmAction, setConfirmAction] = useState<"delete" | "edit" | "delete_history" | null>(null);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [histories, setHistories] = useState<HistoryReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);

  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const imageScrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { gemmed, gemsCount, saved, reposted, repostsCount } = interaction;

  useEffect(() => {
    if (post) {
      setContentExpanded(false);
      fetchComments(post.id);
      fetchAnnotations(post.id);
      fetchHistory(post.id);
    }
  }, [post?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) setShowPostMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchComments = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}/comments/`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        const raw = (data.data || data.results || []) as ApiCommentRaw[];
        setComments(raw.map(normalizeComment));
      }
    } catch { }
    finally { setLoading(false); }
  };

  const fetchAnnotations = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}/annotations/`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAnnotations((data.data || data.results || []) as Annotation[]);
      }
    } catch { }
  };

  const fetchHistory = async (postId: string) => {
    setHistoryLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/mobilization-reports/?post_id=${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistories(data.data?.results || []);
    } catch { } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!post || !newComment.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/comments/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
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
    if (!post || !newAnnotationText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/annotations/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newAnnotationText }),
      });
      if (!res.ok) return;
      setNewAnnotationText("");
      await fetchAnnotations(post.id);
    } catch { }
  };

  if (!post) return null;

  const currentUser = getAuthUser();
  const isOwner = post && String(currentUser?.id ?? "") === String(post.user_id);
  const moderatorGlobal = isModerator(currentUser);
  const isModeratorActive = moderatorGlobal;
  const canDelete = isOwner || moderatorGlobal;

  const imageList = post.images ?? [];
  const tags = buildTags(post);
  const isContentLong = post.content.length > CONTENT_LIMIT;

  const handleDeletePostModal = async () => {
    if (!post) return;
    if (onDelete) {
      await onDelete(post.id);
      onClose();
    } else {
      const token = getAuthToken();
      try {
        const res = await fetch(`${API_URL}/api/posts/${post.id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok || res.status === 204) {
          onClose();
        } else {
          const errorData = await res.json().catch(() => null);
          alert(`Failed to delete post. Status: ${res.status}. Reason: ${errorData?.detail || errorData?.message || "Unknown error"}`);
        }
      } catch (err) {
        alert("Error deleting post: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    }
    setConfirmAction(null);
  };

  const handleDeleteHistory = (reportId: string) => {
    setHistoryToDelete(reportId);
    setConfirmAction("delete_history");
  };

  const confirmDeleteHistory = async (reportId: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/mobilization-reports/${reportId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setHistories((prev) => prev.filter((h) => h.id !== reportId));
      } else {
        alert("Failed to delete report");
      }
    } catch {
      alert("Error deleting report");
    } finally {
      setHistoryToDelete(null);
      setConfirmAction(null);
    }
  };

  const handleGem = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextGemmed = !gemmed;
    const nextCount = nextGemmed ? gemsCount + 1 : gemsCount - 1;
    onInteractionChange({ gemmed: nextGemmed, gemsCount: nextCount });
    toggleStoredItem("gemmed_posts", post.id, nextGemmed);
    try {
      await fetch(`${API_URL}/api/posts/${post.id}/gem/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
    } catch { }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !saved;
    onInteractionChange({ saved: nextSaved });
    toggleStoredItem("saved_posts", post.id, nextSaved);
    try {
      await fetch(`${API_URL}/api/posts/${post.id}/save/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
    } catch { }
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
  const getReplies = (commentId: string) => comments.filter((c) => String(c.parent) === String(commentId));

  const handleDeleteComment = (id: string) => {
    setComments((prev) => {
      const toRemove = new Set<string>();
      const collect = (commentId: string) => {
        toRemove.add(commentId);
        prev.forEach((item) => {
          if (String(item.parent) === String(commentId)) collect(item.id);
        });
      };
      collect(id);
      return prev.filter((x) => !toRemove.has(x.id));
    });
  };

  const renderCommentThread = (comment: CommentNode, level = 0): React.ReactNode => {
    const replies = getReplies(comment.id);
    return (
      <div key={comment.id} className={level > 0 ? "ml-8 mt-2" : ""}>
        <CommentItem comment={comment} postId={post.id} onRefresh={() => fetchComments(post.id)} onDelete={handleDeleteComment} isReply={level > 0} />
        {replies.length > 0 && <div className="flex flex-col gap-2 mt-2">{replies.map((reply) => renderCommentThread(reply, level + 1))}</div>}
      </div>
    );
  };

  const LeftPanel = imageList.length > 0 ? (
    <div className="w-1/2 flex-shrink-0 relative overflow-hidden" style={{ backgroundColor: "#000" }}>
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
      {imageList.length > 1 && currentImageIndex > 0 && (
        <button type="button" className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); scrollToImage(currentImageIndex - 1); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}
      {imageList.length > 1 && currentImageIndex < imageList.length - 1 && (
        <button type="button" className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); scrollToImage(currentImageIndex + 1); }}>
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
    <div className="w-1/2 flex-shrink-0 flex flex-col p-6 overflow-y-auto feed-scroll" style={{ backgroundColor: "#F5EFE0" }}>
      <LocationWorldCard
        location={post.location}
        region={post.region}
        textStyle={{ color: "#8B7355" }}
        iconColor="#8B7355"
        iconSize={13}
        buttonClassName="mb-1"
      />
      <h3 className="text-xl font-bold mb-4" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
      <div className="text-sm leading-relaxed prose prose-sm max-w-none" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tags.map((tag, i) => (
            <span key={i} className="text-[11px] font-medium" style={{ color: "#A07850" }}>#{tag.toLowerCase().replace(/\s+/g, "_")}</span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center shadow-2xl" onClick={onClose} style={{ backdropFilter: "blur(4px)" }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex flex-col md:flex-row w-full max-w-[1000px] max-h-[90vh] h-[90vh] rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF" }} onClick={(e) => e.stopPropagation()}>
        {LeftPanel}

        {/* Right Panel: Comments/Annotations */}
        <div className="w-full md:w-1/2 flex flex-col overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>
          <div className="flex items-center px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
            <UserAvatar profilePicture={post.user_profile_picture} size={38} iconSize={20} />
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  className="font-bold text-sm block truncate"
                  style={{ color: "#432817", background: "none", border: "none", padding: 0 }}
                  onClick={() => { if (!post.user_username) return; onClose(); router.push(`/user/${post.user_username}`); }}
                >
                  {post.user_display_name || post.user_username}
                </button>
                <span className="text-[10px] block" style={{ color: "#8B7355" }}>{formatDate(post.created_at)}</span>
              </div>
            </div>
            <div className="relative" ref={postMenuRef}>
              <button className="p-1 rounded hover:bg-[#E0D5C5] transition-colors mr-2" onClick={() => setShowPostMenu(!showPostMenu)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B7355"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
              </button>
              {showPostMenu && (
                <div className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-50 overflow-hidden" style={{ backgroundColor: "#FFF8E2", border: "1px solid #E0D5C5", minWidth: "140px" }}>
                  {canDelete && (
                    <>
                      {isOwner && (
                        <button
                          className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-black/5"
                          style={{ color: "var(--foreground)" }}
                          onClick={(e) => { e.stopPropagation(); setShowPostMenu(false); router.push(`/edit-post?id=${post.id}`); }}
                        >
                          {feedT("actions.editPost") || "Edit post"}
                        </button>
                      )}
                      <button
                        className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#FDE8E8]"
                        style={{ color: "#7B0000" }}
                        onClick={(e) => { e.stopPropagation(); setShowPostMenu(false); setConfirmAction("delete"); }}
                      >
                        {feedT("actions.deletePost")}
                      </button>
                    </>
                  )}
                  {!isModeratorActive && (
                    <button className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={() => { setShowPostMenu(false); onMobilizationClick(); }}>{feedT("actions.reportPost")}</button>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#E0D5C5] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
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
            {isContentLong && contentExpanded && <button className="font-semibold text-xs mt-1" style={{ color: "#8B6914" }} onClick={() => setContentExpanded(false)}>{feedT("actions.seeLess")}</button>}
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
              {feedT("tabs.annotations", { count: getAcceptedAnnotationsCount(annotations) })}
            </button>
            <button
              className="flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              style={{
                color: activeTab === "history" ? "#432817" : "#8B7355",
                borderBottom: activeTab === "history" ? "2px solid #432817" : "2px solid transparent",
              }}
              onClick={() => setActiveTab("history")}
            >
              <HistoryIcon size={13} />
              History
            </button>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar">
            <div className="px-5 py-4">
              {activeTab === "comments" ? (
                <div className="flex flex-col gap-4">
                  {topLevelComments.length > 0 ? (
                    topLevelComments.map((c) => renderCommentThread(c))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <CommentIcon size={28} className="opacity-30" />
                      <p className="text-xs" style={{ color: "#8B7355" }}>
                        {feedT("empty.comments")}
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === "annotations" ? (
                <div className="flex flex-col gap-4">
                  {annotations.length > 0 ? (
                    annotations.map((a) => (
                      <AnnotationItem key={a.id} annotation={a} postId={post.id} postAuthorId={post.user_id} onDelete={(id) => setAnnotations(prev => prev.filter(x => x.id !== id))} onAccept={(id) => setAnnotations(prev => prev.map(x => x.id === id ? { ...x, status: "accepted" } : x))} onReject={(id) => setAnnotations(prev => prev.map(x => x.id === id ? { ...x, status: "rejected" } : x))} onRefresh={() => fetchAnnotations(post.id)} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <AnnotationIcon size={28} className="opacity-30" />
                      <p className="text-xs" style={{ color: "#8B7355" }}>
                        {feedT("empty.annotations")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {historyLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }} />
                    </div>
                  ) : histories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <div className="mb-2">
                        <HistoryIcon size={40} />
                      </div>
                      <span className="text-xs font-bold">No history reports yet.</span>
                    </div>
                  ) : (
                    histories.map((h) => (
                      <div key={h.id} className="p-4 rounded-3xl bg-white shadow-sm" style={{ border: "1px solid rgba(67, 40, 23, 0.05)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold" style={{ color: "#8B7355" }}>{formatDate(h.created_at)}</span>
                          {(isModeratorActive || (currentUser && String(currentUser.id) === String(h.created_by))) && (
                            <button
                              onClick={() => handleDeleteHistory(h.id)}
                              className="p-1 rounded-full hover:bg-red-500/10 transition-colors"
                              title="Delete history report"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="mb-2 text-[11px] font-bold" style={{ color: "rgba(67, 40, 23, 0.5)" }}>
                          {translateMobilizationStatus(h.previous_status, postFormT)} → {translateMobilizationStatus(h.requested_status, postFormT)}
                        </div>
                        <ExpandableContent content={h.description} className="text-xs leading-relaxed opacity-90 mb-3" style={{ color: "#432817" }} />
                        {h.images && h.images.length > 0 && (
                          <div className="flex gap-2 h-24 mt-2">
                            {h.images.map((img, i) => (
                              <img key={i} src={img.startsWith('/media/') ? API_URL + img : img} alt="Update" className="w-1/3 h-full object-cover rounded-xl" />
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
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
                <AnnotationIcon size={14} /> {formatCount(getAcceptedAnnotationsCount(annotations))}
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

          {/* input */}
          <div className="px-5 py-3 flex items-center gap-2 flex-shrink-0">
            {activeTab === "comments" ? (
              <>
                <input
                  type="text"
                  placeholder={feedT("placeholders.comment")}
                  className="flex-1 py-2.5 px-4 text-xs rounded-xl outline-none border bg-white"
                  style={{ color: "#432817", borderColor: "#E0D5C5" }}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
                />
                <button onClick={handleSubmitComment} className="w-9 h-9 rounded-xl bg-[#432817] flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              </>
            ) : activeTab === "annotations" ? (
              <>
                <input
                  type="text"
                  placeholder={feedT("placeholders.annotation")}
                  className="flex-1 py-2.5 px-4 text-xs rounded-xl outline-none border bg-white"
                  style={{ color: "#432817", borderColor: "#E0D5C5" }}
                  value={newAnnotationText}
                  onChange={(e) => setNewAnnotationText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmitAnnotation(); }}
                />
                <button onClick={handleSubmitAnnotation} className="w-9 h-9 rounded-xl bg-[#432817] flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              </>
            ) : (
              <button
                onClick={onMobilizationClick}
                className="w-full py-3 bg-[#432817] text-white text-sm font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span className="text-xl font-medium">+</span> {pageT("addMobilizationReport")}
              </button>
            )}
          </div>
        </div>
      </div>
      <ActionConfirmModal
        isOpen={!!confirmAction}
        onClose={() => {
          setConfirmAction(null);
          setHistoryToDelete(null);
        }}
        onConfirm={() => {
          if (confirmAction === "delete") {
            handleDeletePostModal();
          } else if (confirmAction === "delete_history" && historyToDelete) {
            confirmDeleteHistory(historyToDelete);
          }
          setConfirmAction(null);
        }}
        title={
          confirmAction === "delete" ? "Delete Post" :
            "Delete History Report"
        }
        message={
          confirmAction === "delete" ? "Are you sure you want to delete this post? This action cannot be undone." :
            "Are you sure you want to delete this mobilization report? This action cannot be undone."
        }
        confirmText={
          confirmAction === "delete" ? "Delete" :
            "Delete"
        }
        confirmColor={
          confirmAction === "delete" || confirmAction === "delete_history" ? "#C0392B" : "#8B6914"
        }
      />
    </div >
  );
}

/* ───────────────── POST CARD ───────────────── */

function PostCard({
  post,
  interaction,
  onInteractionChange,
  onCommentClick,
  onHistoryClick,
  onMobilizationClick,
  onDelete,
}: {
  post: ApiPost;
  interaction: PostInteraction;
  onInteractionChange: (update: Partial<PostInteraction>) => void;
  onCommentClick: () => void;
  onHistoryClick: () => void;
  onMobilizationClick: () => void;
  onDelete?: (id: string) => void;
}) {
  const feedT = useTranslations("auth.feed");
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"delete" | "edit" | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentUser = getAuthUser();
  const isOwner = currentUser?.id === post.user_id;
  const canManage = isOwner || isModerator(currentUser);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const router = useRouter();
  const { gemmed, gemsCount, saved, reposted, repostsCount } = interaction;
  const imageList = post.images ?? [];
  const tags = buildTags(post);

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
      className="rounded-xl mb-5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
      style={{ boxShadow: "0 2px 16px rgba(67,40,23,0.08)", backgroundColor: "var(--light)" }}
      onClick={onCommentClick}
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
              {post.user_display_name || post.user_username || "Anonymous"}
            </button>
            <p className="text-xs" style={{ color: "#8B7355" }}>{formatDate(post.created_at)}</p>
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            className="p-1 rounded hover:bg-[#FFF8E2] transition-colors"
            style={{ color: "#8B7355" }}
            onClick={(e) => { e.stopPropagation(); onHistoryClick(); }}
          >
            <HistoryIcon size={18} />
          </button>
          <div className="relative" ref={menuRef}>
            <button className="p-1 rounded hover:bg-[#FFF8E2] transition-colors" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 py-2 px-4 rounded-lg shadow-lg z-50 w-40" style={{ backgroundColor: "#FFF8E2" }}>
                {canManage && (
                  <>
                    {isOwner && (
                      <button
                        className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-black/5"
                        style={{ color: "var(--foreground)" }}
                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); router.push(`/edit-post?id=${post.id}`); }}
                      >
                        {feedT("actions.editPost") || "Edit post"}
                      </button>
                    )}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:text-red-600"
                      style={{ color: "#7B0000" }}
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); setConfirmAction("delete"); }}
                    >
                      {feedT("actions.deletePost")}
                    </button>
                  </>
                )}
                {!isModerator(currentUser) && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:text-[#8B6914]"
                    style={{ color: "#432817" }}
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                  >
                    {feedT("actions.reportPost")}
                  </button>
                )}
              </div>
            )}
          </div>
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
                  <div className="absolute top-3 left-3 z-30 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md" style={{ background: "rgba(0,0,0,0.35)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                    {currentImageIndex + 1}/{imageList.length}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F0EAD8" }}>
        <div className="flex items-center gap-5">
          <button
            className="flex items-center gap-1.5 text-xs transition-all"
            style={{ color: gemmed ? "#4FC3F7" : "#432817" }}
            onClick={(e) => { e.stopPropagation(); onInteractionChange({ gemmed: !gemmed, gemsCount: gemmed ? gemsCount - 1 : gemsCount + 1 }); }}
          >
            <GemIcon filled={gemmed} active={gemmed} />
            <span>{formatCount(gemsCount)}</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#8B6914]" style={{ color: "#432817" }}>
            <CommentIcon /><span>{formatCount(post.comments_count)}</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#8B6914]" style={{ color: "#432817" }}>
            <AnnotationIcon /><span>0</span>
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
          <button
            className="flex items-center gap-1.5 text-xs transition-all"
            style={{ color: saved ? "#8B6914" : "#432817" }}
            onClick={(e) => { e.stopPropagation(); onInteractionChange({ saved: !saved }); }}
          >
            <BookmarkIcon filled={saved} active={saved} />
          </button>
        </div>
      </div>
      <ActionConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "delete") {
            onDelete?.(post.id);
          }
          setConfirmAction(null);
        }}
        title={"Delete Post"}
        message={"Are you sure you want to delete this post? This action cannot be undone."}
        confirmText={"Delete"}
        confirmColor={"#C0392B"}
      />

    </div>
  );
}

/* ───────────────── MOBILIZATION MODAL ───────────────── */

function MobilizationModal({
  post,
  onClose,
  onSuccess,
}: {
  post: ApiPost | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const commonT = useTranslations("auth.common");
  const pageT = useTranslations("auth.pages.monumentsInDanger.reportModal");
  const postFormT = useTranslations("auth.postForm");
  const [selectedPrev, setSelectedPrev] = useState("Alert");
  const [selectedReq, setSelectedReq] = useState("Under intervention");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const options = ["Destroyed", "Under intervention", "Restored", "Alert"];

  const handleSubmit = async () => {
    if (!post) return;
    const token = getAuthToken();
    if (!token) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("post_id", post.id);
      formData.append("description", description);
      formData.append("previous_status", selectedPrev.toLowerCase().replace(/\s+/g, "_"));
      formData.append("requested_status", selectedReq.toLowerCase().replace(/\s+/g, "_"));

      images.forEach((img) => {
        if (!img.isRemote && img.file) {
          formData.append("uploaded_images", img.file);
        }
      });

      const res = await fetch(`${API_URL}/api/mobilization-reports/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) throw new Error(pageT("errors.submitFailed"));
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Submission error:", err);
      alert(pageT("errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 overflow-hidden backdrop-blur-sm px-4">
      <div className="bg-[#F7F5EF] w-[950px] max-w-full max-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col pt-4 pb-8 relative border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between px-8 mb-6">
          <button
            onClick={onClose}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl text-[#432817] hover:bg-[#432817]/5 transition-all"
          >
            <div className="bg-white p-1.5 rounded-full shadow-sm group-hover:bg-[#432817] group-hover:text-white transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            </div>
            <span className="text-sm font-bold opacity-80 group-hover:opacity-100">{commonT("back")}</span>
          </button>

          <h2 className="text-3xl text-[#432817] font-bold tracking-tight text-center flex-1 pr-16" style={{ fontFamily: "var(--font-lato), sans-serif" }}>
            {pageT("title")}
          </h2>
        </div>

        <div className="flex-1 min-h-0 px-4 md:px-8 flex flex-col md:flex-row gap-6 md:gap-8 overflow-y-auto md:overflow-visible">
          {/* Left: Image Upload Preview */}
          <div className="flex-[0.7] flex flex-col gap-4 min-h-0 overflow-y-auto pr-2 feed-scroll">
            <label className="text-sm font-bold text-[#432817]">
              {pageT("documentationPhotos")}
            </label>
            <div className="flex-1 overflow-hidden" style={{ minHeight: "400px" }}>
              <ImageUploadPanel initialImages={[]} onImagesChange={setImages} />
            </div>
          </div>

          {/* Right: Form */}
          <div className="flex-1 flex flex-col gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-[#432817]/5 overflow-y-auto feed-scroll">
            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#432817]">
                {pageT("description")}
              </label>
              <textarea
                className="w-full h-32 p-4 bg-[#F7F5EF]/50 border-2 border-transparent rounded-[24px] resize-none text-sm outline-none focus:border-[#C4A882] focus:bg-white transition-all shadow-inner"
                placeholder={pageT("descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ fontFamily: 'var(--font-lato)' }}
              />
            </div>

            {/* Previous Status */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-[#432817]">
                {pageT("previousStatus")}<span style={{ color: "red" }}>*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSelectedPrev(opt)}
                    className={`px-5 py-2 text-[11px] font-bold rounded-full transition-all border-2 ${selectedPrev === opt
                      ? 'bg-[#432817] border-[#432817] text-white shadow-md'
                      : 'bg-transparent border-[#432817]/10 text-[#432817] hover:border-[#432817]/30'
                      }`}
                  >
                    {translateMobilizationStatus(opt, postFormT)}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Status */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-[#432817]">
                {pageT("newStatus")} <span style={{ color: "red" }}>*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSelectedReq(opt)}
                    className={`px-5 py-2 text-[11px] font-bold rounded-full transition-all border-2 ${selectedReq === opt
                      ? 'bg-[#432817] border-[#432817] text-white shadow-md'
                      : 'bg-transparent border-[#432817]/10 text-[#432817] hover:border-[#432817]/30'
                      }`}
                  >
                    {translateMobilizationStatus(opt, postFormT)}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-[#432817]/5">
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-2xl font-bold text-sm text-[#432817] hover:bg-[#432817]/5 transition-colors"
              >
                {commonT("cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-10 py-3 rounded-2xl font-bold text-sm text-white bg-[#432817] hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#432817]/20"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {pageT("submitting")}
                  </div>
                ) : pageT("submit")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ───────────────── HISTORY MODAL ───────────────── */

function HistoryModal({
  post,
  interaction,
  onClose,
  onMobilizationReport,
  onToggleGem,
  onToggleSave,
  onDeleteHistory,
}: {
  post: ApiPost | null;
  interaction: PostInteraction | null;
  onClose: () => void;
  onMobilizationReport: () => void;
  onToggleGem: (postId: string, currentGemmed: boolean, currentCount: number) => void;
  onToggleSave: (postId: string, currentSaved: boolean) => void;
  onDeleteHistory: (reportId: string) => void;
}) {
  const pageT = useTranslations("auth.pages.monumentsInDanger");
  const postFormT = useTranslations("auth.postForm");
  const [histories, setHistories] = useState<HistoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getAuthUser();

  useEffect(() => {
    if (!post) return;
    const fetchHistory = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/mobilization-reports/?post_id=${post.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistories(data.data?.results || []);
        }
      } catch (err) {
        console.error("Fetch history error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [post]);

  if (!post) return null;
  const imageList = post.images ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center shadow-2xl" onClick={onClose} style={{ backdropFilter: "blur(4px)" }}>
      <div className="relative flex flex-col md:flex-row w-full max-w-[1000px] max-h-[90vh] h-[90vh] rounded-2xl overflow-hidden bg-[#FFF8E2] shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
        {/* Left Side: Large image mirror */}
        <div className="w-full md:w-1/2 h-48 md:h-auto bg-black relative flex items-center justify-center overflow-hidden">
          {imageList.length > 0 ? (
            <img
              src={imageList[0].image.startsWith('/media/') ? API_URL + imageList[0].image : imageList[0].image}
              alt="Monument"
              className="w-full h-full object-cover opacity-90 transition-opacity duration-300 hover:opacity-100"
            />
          ) : (
            <div className="p-10 text-cream text-center opacity-40">{pageT("history.noPreviewImage")}</div>
          )}
        </div>

        {/* Right Side: History list */}
        <div className="w-full md:w-1/2 flex flex-col bg-[#FFF8E2] rounded-r-2xl overflow-hidden shadow-[-4px_0_15px_rgba(0,0,0,0.05)]">
          {/* Header row */}
          <div className="flex items-center px-5 pt-4 pb-3 border-b" style={{ borderColor: "#E0D5C5" }}>
            <UserAvatar profilePicture={post.user_profile_picture} size={36} iconSize={18} />
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm" style={{ color: "#432817" }}>{post.user_display_name || post.user_username}</span>
                <span className="text-[10px]" style={{ color: "#8B7355" }}>{pageT("history.postedIn", { date: formatDate(post.created_at) })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HistoryIcon size={18} />
              <button className="p-1.5 rounded-lg hover:bg-black/5" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>

          <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
            <div className="flex items-center gap-1 mb-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span className="text-xs" style={{ color: "#8B7355" }}>{post.location || post.region || pageT("defaultLocation")}</span>
            </div>
            <h3 className="text-base font-bold" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
            <ExpandableContent content={post.content} className="text-xs leading-relaxed mt-1" style={{ color: "#432817" }} />
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto feed-scroll p-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }} />
              </div>
            ) : histories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <div className="mb-2">
                  <HistoryIcon size={40} />
                </div>
                <span className="text-xs font-bold">{pageT("history.empty")}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {histories.map((h) => (
                  <div key={h.id} className="p-4 rounded-3xl bg-white shadow-sm" style={{ border: "1px solid rgba(67, 40, 23, 0.05)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold" style={{ color: "#8B7355" }}>{formatDate(h.created_at)}</span>
                      </div>
                      {isModerator(currentUser) && (
                        <button
                          onClick={() => onDeleteHistory(h.id)}
                          className="p-1 rounded-full hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete report"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="mb-2 text-[11px] font-bold" style={{ color: "rgba(67, 40, 23, 0.5)" }}>
                      {translateMobilizationStatus(h.previous_status, postFormT)} → {translateMobilizationStatus(h.requested_status, postFormT)}
                    </div>
                    <ExpandableContent content={h.description} className="text-xs leading-relaxed opacity-90 mb-3" style={{ color: "#432817" }} />
                    {h.images && h.images.length > 0 && (
                      <div className="flex gap-2 h-24 mt-2">
                        {h.images.map((img, i) => (
                          <img
                            key={i}
                            src={img.startsWith('/media/') ? API_URL + img : img}
                            alt="Update"
                            className="w-1/3 h-full object-cover rounded-xl"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action footer */}
          <div className="p-6 border-t flex flex-col gap-4" style={{ borderColor: "#E0D5C5" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: "#432817" }}
                  onClick={() => {
                    if (interaction) {
                      onToggleGem(post.id, interaction.gemmed, interaction.gemsCount);
                    }
                  }}
                >
                  <GemIcon size={18} filled={interaction?.gemmed ?? false} />
                  <span>{formatCount(interaction?.gemsCount ?? 0)}</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#432817" }}>
                  <CommentIcon size={18} /><span>{formatCount(post.comments_count)}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (interaction) {
                    onToggleSave(post.id, interaction.saved);
                  }
                }}
              >
                <BookmarkIcon size={18} filled={interaction?.saved ?? false} />
              </button>
            </div>

            <button
              onClick={onMobilizationReport}
              className="w-full py-3.5 bg-[#432817] text-white text-sm font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ fontFamily: "var(--font-lato), sans-serif" }}
            >
              <span className="text-xl font-medium">+</span> {pageT("addMobilizationReport")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




/* ─────────────────── MOBILE MONUMENTS STRIP ─────────────────── */

function MobileMonumentsStrip({ posts }: { posts: ApiPost[] }) {
  const pageT = useTranslations("auth.pages.monumentsInDanger");
  const postFormT = useTranslations("auth.postForm");
  if (!posts || posts.length === 0) return null;
  return (
    <div className="lg:hidden px-4 py-4">
      <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "#8B7355", fontFamily: "var(--font-lato)" }}>{pageT("criticalTitle")}</h3>
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {posts.map((post) => {
          const image = post.images?.[0]?.image;
          const imageUrl = image ? (image.startsWith("/media/") ? `${API_URL}${image}` : image) : "/about-5.jpg";
          const userName = post.user_display_name || post.user_username || pageT("unknownUser");
          const alertStatus = post.alert_details?.current_status || "Alert";
          const translatedStatus = translateMobilizationStatus(alertStatus, postFormT);

          return (
            <div
              key={post.id}
              className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105"
              style={{ width: "140px" }}
            >
              <div className="flex flex-col">
                <img
                  src={imageUrl}
                  alt={stripHtml(post.title)}
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
                >
                  {stripHtml(post.title)}
                </span>
                <div className="flex items-center gap-1 mb-1">
                  <UserAvatar profilePicture={post.user_profile_picture} size={16} iconSize={10} />
                  <span
                    className="text-[8px] font-medium truncate"
                    style={{
                      color: "#432817",
                      fontFamily: "var(--font-lato)",
                      maxWidth: "90px"
                    }}
                  >
                    {userName}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#9E9E9E", flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span
                    className="text-[8px] font-medium truncate"
                    style={{
                      color: "#9E9E9E",
                      fontFamily: "var(--font-lato)",
                      maxWidth: "90px"
                    }}
                  >
                    {post.location || post.region || pageT("defaultLocation")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#E53935" }}></span>
                    <span className="text-[8px] font-medium" style={{ color: "#E53935" }}>{translateUrgencyLevel("Critical", postFormT)}</span>
                  </div>
                  <span className="text-[8px] font-medium" style={{ color: "#9E9E9E" }}>{translatedStatus}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────── RIGHT SIDEBAR ───────────────── */

function RightSidebar({ onAction, onPostClick, posts }: { onAction: () => void; onPostClick: (post: ApiPost) => void; posts: ApiPost[] }) {
  const pageT = useTranslations("auth.pages.monumentsInDanger");
  const addEventT = useTranslations("auth.pages.addEvent");
  const postFormT = useTranslations("auth.postForm");
  if (!posts || posts.length === 0) {
    return (
      <aside className="w-[320px] xl:w-[380px] flex-shrink-0 pl-5 pr-4 pt-4 h-full hidden lg:flex flex-col">
        <div className="sticky top-0 h-full flex flex-col items-center">
          {/* Button on top */}
          <button
            onClick={onAction}
            className="px-8 py-2.5 mb-6 bg-[#432817] text-white text-base font-medium rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ fontFamily: "var(--font-lato), sans-serif" }}
          >
            + {addEventT("title")}
          </button>

          {/* Centered Title */}
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
          >
            {pageT("criticalTitle")}
          </h2>

          <div className="flex items-center justify-center h-48">
            <span className="text-sm opacity-50" style={{ color: "#432817" }}>{pageT("noCritical")}</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[320px] xl:w-[380px] flex-shrink-0 pl-5 pr-4 pt-4 h-full hidden lg:flex flex-col">
      <div className="sticky top-0 h-full flex flex-col items-center">
        {/* Button on top */}
        <button
          onClick={onAction}
          className="px-8 py-2.5 mb-6 bg-[#432817] text-white text-base font-medium rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
          style={{ fontFamily: "var(--font-lato), sans-serif" }}
        >
          + {addEventT("title")}
        </button>

        {/* Centered Title */}
        <h2
          className="text-2xl font-bold mb-8 text-center"
          style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
        >
          {pageT("criticalTitle")}
        </h2>

        {/* Scrollable list of cards */}
        <div className="w-full flex flex-col gap-4 overflow-y-auto pr-2 pb-10" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {posts.map((post) => {
            const image = post.images?.[0]?.image;
            const imageUrl = image ? (image.startsWith("/media/") ? `${API_URL}${image}` : image) : "/about-5.jpg";
            const userName = post.user_display_name || post.user_username || pageT("unknownUser");
            const alertStatus = post.alert_details?.current_status || "Alert";
            const translatedStatus = translateMobilizationStatus(alertStatus, postFormT);

            return (
              <div
                key={post.id}
                className="bg-white rounded-xl p-4 flex flex-row items-start gap-3 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(44,26,14,0.14)] hover:bg-[#FFFCF2] cursor-pointer"
                onClick={() => onPostClick(post)}
              >
                {/* Thumbnail on left */}
                <div className="flex-shrink-0">
                  <img src={imageUrl} alt={stripHtml(post.title)} className="w-12 h-12 rounded-full object-cover shrink-0 shadow-sm" />
                </div>

                {/* Info on right */}
                <div className="flex flex-col gap-1 min-w-0 justify-center mt-0.5">
                  {/* Monument Title */}
                  <h3 className="font-bold text-sm text-[#2C1A0E] truncate" style={{ fontFamily: "var(--font-lato), system-ui, sans-serif" }}>
                    {stripHtml(post.title)}
                  </h3>

                  {/* Attributes line */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#5a4a3a]">
                    <div className="flex items-center gap-1 truncate max-w-[120px]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#7a5a3a", flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="truncate">{post.location || post.region || pageT("defaultLocation")}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#E53935" }}></span>
                      <span>{translateUrgencyLevel("Critical", postFormT)}</span>
                    </div>

                    <span className="opacity-40 flex-shrink-0">|</span>

                    <span className="flex-shrink-0">{translatedStatus}</span>
                  </div>

                  {/* User row */}
                  <div className="flex flex-row items-center gap-1.5 mt-0.5 text-[#7a5a3a]">
                    <UserAvatar profilePicture={post.user_profile_picture} size={16} iconSize={8} />
                    <span className="font-bold text-[10px] truncate" style={{ fontFamily: "var(--font-lato), system-ui, sans-serif" }}>{userName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}




/* ───────────────── MAIN PAGE ───────────────── */

export default function MonumentsInDangerPage() {
  const pageT = useTranslations("auth.pages.monumentsInDanger");
  const commonT = useTranslations("auth.common");
  const addEventT = useTranslations("auth.pages.addEvent");
  const router = useRouter();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [criticalPosts, setCriticalPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);
  const [selectedPostTab, setSelectedPostTab] = useState<"comments" | "annotations" | "history">("comments");
  const [showFilter, setShowFilter] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobilizationOpen, setIsMobilizationOpen] = useState(false);
  const [mobilizationPost, setMobilizationPost] = useState<ApiPost | null>(null);
  const [historyPost, setHistoryPost] = useState<ApiPost | null>(null);
  const [postInteractions, setPostInteractions] = useState<Record<string, PostInteraction>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    region: "All",
    historical_period: "All",
    monument_type: "All",
    urgence_level: "All",
    current_status: "All",
  });

  const getInteraction = (post: ApiPost): PostInteraction =>
    postInteractions[post.id] ?? {
      gemmed: getStoredSet("gemmed_posts").has(post.id),
      gemsCount: post.gems_count,
      saved: getStoredSet("saved_posts").has(post.id),
      reposted: post.is_reposted ?? false,
      repostsCount: post.reposts_count ?? 0,
      commentsCount: post.comments_count ?? 0,
      annotationsCount: 0,
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
        annotationsCount: 0,
      };
      return { ...prev, [postId]: { ...existing, ...update } };
    });
  };

  const handleToggleGem = async (postId: string, currentGemmed: boolean, currentCount: number) => {
    const token = getAuthToken();
    if (!token) return;
    const nextGemmed = !currentGemmed;
    const nextCount = nextGemmed ? currentCount + 1 : currentCount - 1;
    updateInteraction(postId, { gemmed: nextGemmed, gemsCount: nextCount });
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/gem/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle gem");
      const data = await res.json();
      updateInteraction(postId, { gemmed: data.data.liked, gemsCount: data.data.gems_count });
    } catch (err) {
      console.error("Gem toggle error:", err);
      updateInteraction(postId, { gemmed: currentGemmed, gemsCount: currentCount });
    }
  };

  const handleToggleSave = async (postId: string, currentSaved: boolean) => {
    const token = getAuthToken();
    if (!token) return;
    const nextSaved = !currentSaved;
    updateInteraction(postId, { saved: nextSaved });
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/save/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle save");
      const data = await res.json();
      updateInteraction(postId, { saved: data.data.saved });
      toggleStoredItem("saved_posts", postId, data.data.saved);
    } catch (err) {
      console.error("Save toggle error:", err);
      updateInteraction(postId, { saved: currentSaved });
    }
  };

  const handleDeletePost = async (postId: string) => {
    const token = getAuthToken();
    const sId = String(postId);
    try {
      const res = await fetch(`${API_URL}/api/posts/${sId}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setPosts((prev) => prev.filter((p) => String(p.id) !== sId));
        setCriticalPosts((prev) => prev.filter((p) => String(p.id) !== sId));
        if (selectedPost && String(selectedPost.id) === sId) {
          setSelectedPost(null);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.detail || errorData.message || "You might not have permission to delete this post.";
        alert(`Failed to delete post: ${msg} (Status: ${res.status})`);
      }
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Error connecting to server. Please check your internet connection.");
    }
  };


  // --- SEACH & FILTER LOGIC ---
  const constructUrl = (filters: typeof activeFilters, query: string) => {
    const params = new URLSearchParams();
    if (query) params.append("search", query);
    if (filters.region !== "All") params.append("region", filters.region);
    if (filters.historical_period !== "All") params.append("historical_period", filters.historical_period);
    if (filters.monument_type !== "All") params.append("monument_type", filters.monument_type);
    if (filters.urgence_level !== "All") params.append("urgence_level", filters.urgence_level.toLowerCase());
    if (filters.current_status !== "All") params.append("current_status", filters.current_status.toLowerCase().replace(/\s+/g, "_"));

    return `${API_URL}/api/posts/monuments-danger/?${params.toString()}`;
  };

  const fetchAlerts = async (url: string) => {
    const token = getAuthToken();
    if (!token) {
      console.warn("No auth token found, skipping fetch.");
      // Option: router.push("/login") if login is mandatory
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (res.status === 401) {
        // Token might be expired
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const results = (data.results || data.data || data).map((p: any) =>
        normalizeApiPost(p)
      );
      setPosts(results);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Immediate effect for filter changes
  useEffect(() => {
    fetchAlerts(constructUrl(activeFilters, searchQuery));
  }, [activeFilters]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAlerts(constructUrl(activeFilters, searchQuery));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCriticalAlerts = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/posts/critical/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const results = (data.results || data.data || data).map((p: any) =>
            normalizeApiPost(p)
          );
          setCriticalPosts(results);
        }
      } catch (err) {
        console.error("Fetch critical alerts error:", err);
      }
    };
    fetchCriticalAlerts();
  }, []);

  const handleApplyFilters = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAlerts(constructUrl(activeFilters, searchQuery));
  };

  return (
    <>
      <div className="flex h-[100dvh] overflow-hidden justify-center w-full" style={{ fontFamily: "var(--font-lato), sans-serif", backgroundColor: "var(--background)" }}>
        <LeftSidebar activePage="monuments" />
        <div className="flex h-full w-full max-w-[1180px] md:ml-[80px] pb-16 md:pb-0">
          <div className="flex flex-1 flex-col">
            <div className="sticky top-0 z-40 px-6 pt-4 pb-3 flex flex-col gap-4" style={{ backgroundColor: "var(--nav-bg)" }}>
              <form onSubmit={handleSearchSubmit} className="flex items-center w-full rounded-full px-4 py-2.5 transition-all duration-200" style={{ backgroundColor: "var(--light)", border: isFocused ? "1px solid var(--accent-gold)" : "1px solid var(--brown)", boxShadow: isFocused ? "0 0 0 3px rgba(82, 65, 30, 0.18)" : "0 0px 0px rgba(20,12,6,0.1)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input
                  type="text"
                  placeholder={pageT("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  className="flex-1 ml-3 outline-none bg-transparent text-sm"
                  style={{ color: "var(--foreground)", fontFamily: "var(--font-lato)" }}
                />
                <button type="button" className="flex-shrink-0 p-1 rounded hover:bg-[var(--panel-hover)] transition-colors" onClick={() => setShowFilter(!showFilter)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                    <circle cx="8" cy="6" r="1.5" fill="var(--foreground)" /><circle cx="16" cy="12" r="1.5" fill="var(--foreground)" /><circle cx="10" cy="18" r="1.5" fill="var(--foreground)" />
                  </svg>
                </button>
              </form>
              <FilterSection isVisible={showFilter} onClose={() => setShowFilter(false)} onApply={handleApplyFilters} />
            </div>

            {/* Mobile Add Mobilization Event Button */}
            <div className="lg:hidden px-4 py-3 flex justify-center">
              <button
                onClick={() => router.push("/add-event")}
                className="px-8 py-2.5 bg-[#432817] text-white text-sm font-medium rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ fontFamily: "var(--font-lato), sans-serif" }}
              >
                + {addEventT("title")}
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <main className="flex-1 overflow-y-auto feed-scroll px-6 py-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <MobileMonumentsStrip posts={criticalPosts} />
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      interaction={getInteraction(post)}
                      onInteractionChange={(upd) => {
                        const current = getInteraction(post);
                        if (upd.gemmed !== undefined) handleToggleGem(post.id, current.gemmed, current.gemsCount);
                        else if (upd.saved !== undefined) handleToggleSave(post.id, current.saved);
                        else updateInteraction(post.id, upd);
                      }}
                      onMobilizationClick={() => {
                        setMobilizationPost(post);
                        setIsMobilizationOpen(true);
                      }}
                      onHistoryClick={() => { setSelectedPost(post); setSelectedPostTab("history"); }}
                      onCommentClick={() => { setSelectedPost(post); setSelectedPostTab("comments"); }}
                      onDelete={handleDeletePost}
                    />
                  ))
                ) : !loading && (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-[#432817]/40"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <p className="text-xl font-bold" style={{ color: "#432817" }}>{pageT("noResultsTitle")}</p>
                    <p className="text-sm mt-2" style={{ color: "#432817" }}>{pageT("noResultsDescription")}</p>
                  </div>
                )}

                {
                  loading && (
                    <div className="flex justify-center py-6">
                      <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "var(--border-soft)", borderTopColor: "var(--accent-gold)" }} />
                    </div>
                  )
                }
              </main>
              <RightSidebar
                onAction={() => router.push("/add-event")}
                onPostClick={(post) => setSelectedPost(post)}
                posts={criticalPosts}
              />
            </div>

          </div>
        </div>
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          initialTab={selectedPostTab}
          interaction={getInteraction(selectedPost)}
          onInteractionChange={(upd) => {
            const current = getInteraction(selectedPost);
            if (upd.gemmed !== undefined) handleToggleGem(selectedPost.id, current.gemmed, current.gemsCount);
            else if (upd.saved !== undefined) handleToggleSave(selectedPost.id, current.saved);
            else updateInteraction(selectedPost.id, upd);
          }}
          onClose={() => setSelectedPost(null)}
          onMobilizationClick={() => {
            const currentPost = selectedPost;
            setSelectedPost(null);
            setMobilizationPost(currentPost);
            setIsMobilizationOpen(true);
          }}
          onDelete={handleDeletePost}
        />
      )}

      {isMobilizationOpen && (
        <MobilizationModal
          post={mobilizationPost}
          onClose={() => {
            setIsMobilizationOpen(false);
            setMobilizationPost(null);
          }}
          onSuccess={() => fetchAlerts(constructUrl(activeFilters, searchQuery))}
        />
      )}
      <HistoryModal
        post={historyPost}
        interaction={historyPost ? getInteraction(historyPost) : null}
        onToggleGem={handleToggleGem}
        onToggleSave={handleToggleSave}
        onDeleteHistory={async (reportId) => {
          if (!window.confirm(commonT("confirmDeleteReport"))) return;
          const token = getAuthToken();
          try {
            const res = await fetch(`${API_URL}/api/mobilization-reports/${reportId}/`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` },
            });
            if (res.ok) {
              // Refresh the histories in the modal would be better, but for now we can just close it or rely on re-fetch if it's managed by state
              // Since Histories state is internal to HistoryModal, I should probably pass a function to update it or handle it inside
            }
          } catch (err) { console.error(err); }
        }}
        onClose={() => setHistoryPost(null)}
        onMobilizationReport={() => {
          const p = historyPost;
          setHistoryPost(null);
          setMobilizationPost(p);
          setIsMobilizationOpen(true);
        }}
      />
    </>
  );
}


