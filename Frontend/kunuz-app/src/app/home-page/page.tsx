"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import AiPostInsight from "@/components/AiPostInsight";
import PostQuizButton from "@/components/PostQuizButton";
import RepostButton from "@/components/RepostButton";
import LeftSidebar from "@/components/LeftSidebar";
import LocationWorldCard from "@/components/LocationWorldCard";
import ActionConfirmModal from "@/components/ActionConfirmModal";
import { PostsSkeletonList } from "@/components/PostSkeletons";
import { usePosts } from "@/hooks/usePosts";
import { fetchJson } from "@/lib/apiClient";
import ReportModal from "@/components/ReportModal";
import { LongPressGemButton } from "@/components/GemUsersModal";
import {
  translateHistoricalPeriod,
  translateMonumentType,
  translatePostType,
  translateRegion,
  translateExpertise,
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

function getAuthUser(): { id?: string; username?: string; display_name?: string; role?: string; is_staff?: boolean; email?: string } | null {
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
  user_expertise?: string;
  user_role?: string;
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

type ReportTargetType = "post" | "comment" | "annotation";

async function submitReport(
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
  description: string = "",
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
      description,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.message || "Failed to submit report.";
    const details = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    throw new Error(details ? `${errorMsg} ${details}` : errorMsg);
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

function resolveDedicatedProfilePicture(source: any): string {
  if (!source || typeof source !== "object") return "";
  const directCandidate =
    source.user_profile_picture ??
    source.profile_picture ??
    source.avatar ??
    source.profilePicture ??
    source.photoURL ??
    source.photo_url;
  const nestedUser = source.user && typeof source.user === "object" ? source.user : null;
  const nestedCandidate = nestedUser
    ? nestedUser.user_profile_picture ??
    nestedUser.profile_picture ??
    nestedUser.avatar ??
    nestedUser.profilePicture ??
    nestedUser.photoURL ??
    nestedUser.photo_url
    : undefined;
  const value = String(directCandidate ?? nestedCandidate ?? "").trim();
  return value;
}

function normalizeComment(raw: ApiCommentRaw): CommentNode {
  return {
    id: String(raw.id),
    user_id: String(raw.user_id ?? ""),
    user_username: String(raw.user_username ?? ""),
    user_profile_picture: resolveDedicatedProfilePicture(raw),
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
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrl = resolveProfilePictureUrl(profilePicture);
  const shouldShowImage = Boolean(imageUrl) && !hasImageError;

  if (shouldShowImage) {
    return (
      <img
        src={imageUrl}
        alt="Profile picture"
        loading="lazy"
        decoding="async"
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: "#8B6914",
        color: "#FFFFFF",
        fontSize: Math.max(iconSize - 2, 12),
      }}
      aria-label="Default profile avatar"
    >
      AM
    </div>
  );
}

const authorExpertiseStyles: Record<string, { label: string; color: string; background: string; text: string }> = {
  amateur: { label: "Amateur", color: "#C8A96E", background: "#C8A96E", text: "#1a0f00" },
  student: { label: "Student", color: "#5C7A3E", background: "#E3EAD8", text: "#263816" },
  researcher: { label: "Researcher", color: "#4A6FA5", background: "#DDE8F5", text: "#1F3655" },
  historian: { label: "Historian", color: "#8B4513", background: "#EEDCCD", text: "#432817" },
  guide: { label: "Tour Guide", color: "#E07B39", background: "#F8E3D6", text: "#5A2C10" },
  architect: { label: "Architect", color: "#6B5B95", background: "#E8E2F1", text: "#32284F" },
  unknown: { label: "No expertise", color: "#E0D5C5", background: "#F3EEE6", text: "#5B4630" },
};

function normalizeAuthorExpertise(value?: string) {
  const normalized = (value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (normalized === "tour guide") return "guide";
  return normalized || "unknown";
}

function getAuthorStyle(post: ApiPost) {
  const role = (post.user_role ?? "").trim().toLowerCase();
  if (role === "admin") {
    return { label: "Admin", background: "#8B0000", text: "#FFFFFF", ring: "linear-gradient(135deg, #432817, #8B0000)" };
  }
  if (role === "moderator") {
    return { label: "⚜️ Moderator", background: "#3b2314", text: "#FFF8E2", ring: "linear-gradient(135deg, #C8A96E, #8B6914)" };
  }
  const style = authorExpertiseStyles[normalizeAuthorExpertise(post.user_expertise)] ?? authorExpertiseStyles.unknown;
  return { ...style, ring: style.color };
}

function AuthorAvatar({ post, size, iconSize }: { post: ApiPost; size: number; iconSize: number }) {
  const authorStyle = getAuthorStyle(post);
  return (
    <div className="rounded-full flex-shrink-0 p-[3px]" style={{ background: authorStyle.ring }}>
      <UserAvatar profilePicture={post.user_profile_picture} size={size} iconSize={iconSize} />
    </div>
  );
}

function AuthorBadge({ post }: { post: ApiPost }) {
  const authorStyle = getAuthorStyle(post);
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold leading-none whitespace-nowrap" style={{ backgroundColor: authorStyle.background, color: authorStyle.text }}>
      {authorStyle.label}
    </span>
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
    <div className="flex flex-wrap gap-1.5 px-4 md:px-5 pb-3">
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
  onReport,
}: {
  comment: CommentNode;
  postId: string;
  onRefresh?: () => void;
  onDelete?: (commentId: string) => void;
  isReply?: boolean;
  onReport: (type: ReportTargetType, id: string) => void;
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

  const handleReportComment = () => {
    onReport("comment", comment.id);
    setShowMenu(false);
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

/* ─────────────────── ANNOTATION ITEM ─────────────────── */

function AnnotationItem({
  annotation,
  postId,
  postAuthorId,
  onDelete,
  onAccept,
  onReject,
  onRefresh,
  onReport,
}: {
  annotation: Annotation;
  postId: string;
  postAuthorId?: string;
  onDelete: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRefresh?: () => void;
  onReport: (type: ReportTargetType, id: string) => void;
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

  const handleReport = () => {
    onReport("annotation", annotation.id);
    setShowMenu(false);
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
            loading="lazy"
            decoding="async"
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
  onApply: (filters: { region: string; post_type: string; historical_period: string; monument_type: string; expertise: string }) => void;
}) {
  const filtersT = useTranslations("auth.filters");
  const postFormT = useTranslations("auth.postForm");
  const profileFormT = useTranslations("auth.profileForm");
  const [isAnimating, setIsAnimating] = useState(false);
  const [choices, setChoices] = useState<{
    regions: string[];
    post_types: string[];
    historical_periods: string[];
    monument_types: string[];
    expertises: string[];
  }>({ regions: [], post_types: [], historical_periods: [], monument_types: [], expertises: [] });

  const [region, setRegion] = useState("All");
  const [postType, setPostType] = useState("All");
  const [historicalPeriod, setHistoricalPeriod] = useState("All");
  const [monumentType, setMonumentType] = useState("All");
  const [expertise, setExpertise] = useState("All");

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
    setExpertise("All");
    onApply({ region: "", post_type: "", historical_period: "", monument_type: "", expertise: "" });
    onClose();
  };

  const handleApply = () => {
    onApply({
      region: region === "All" ? "" : region,
      post_type: postType === "All" ? "" : postType,
      historical_period: historicalPeriod === "All" ? "" : historicalPeriod,
      monument_type: monumentType === "All" ? "" : monumentType,
      expertise: expertise === "All" ? "" : expertise,
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
    {
      label: filtersT("labels.expertise"),
      options: [{ value: "All", label: filtersT("all") }, ...choices.expertises.map((value) => ({ value, label: translateExpertise(value, profileFormT) }))],
      value: expertise,
      onChange: setExpertise,
    },
  ];

  return (
    <div
      className={`absolute top-[65px] right-2 md:right-4.5 w-[340px] z-[60] overflow-hidden transition-all duration-400 origin-top-right ${isVisible ? "opacity-100 max-md:scale-[0.85] md:scale-100 translate-y-0" : "opacity-0 max-md:scale-[0.75] md:scale-90 -translate-y-4 pointer-events-none"}`}
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
  onReport,
}: {
  post: ApiPost | null;
  onClose: () => void;
  interaction: PostInteraction;
  onInteractionChange: (update: Partial<PostInteraction>) => void;
  initialTab?: "comments" | "annotations";
  onReport: (type: ReportTargetType, id: string) => void;
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

  const currentUser = getAuthUser();
  const isOwner = post && String(currentUser?.id ?? "") === String(post.user_id);
  const canDelete = isOwner || isModerator(currentUser);

  const imageList = post.images ?? [];
  const tags = buildTags(post);
  const isContentLong = post.content.length > CONTENT_LIMIT;

  const handleDeletePostModal = async () => {
    if (!window.confirm(feedT("actions.confirmDeletePost") || "Are you sure you want to delete this post?")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onClose();
        window.location.reload();
      }
    } catch { }
  };

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
          onReport={onReport}
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
      className="block w-full h-[240px] md:h-full md:w-1/2 flex-shrink-0 relative overflow-hidden"
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
                <img src={imageUrl} alt={post.title} loading="lazy" decoding="async" className="relative z-10 w-full h-full object-contain" />
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

      <div className="text-sm leading-relaxed flex-1 prose prose-sm max-w-none" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />

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
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center shadow-2xl" onClick={onClose} style={{ backdropFilter: "blur(4px)" }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex flex-col md:flex-row w-full md:max-w-[1000px] h-full md:max-h-[90vh] md:h-[90vh] md:rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF" }} onClick={(e) => e.stopPropagation()}>
        {LeftPanel}

        {/* Right Panel: Comments/Annotations */}
        <div className="w-full md:w-1/2 h-full flex-1 md:flex-none flex flex-col overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>
          <div className="flex items-center px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
            <AuthorAvatar post={post} size={38} iconSize={20} />
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                <button
                  className="font-bold text-base hover:underline text-left"
                  style={{ color: "#432817", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  onClick={() => { if (!post.user_username) return; onClose(); router.push(`/user/${post.user_username}`); }}
                >
                  {post.user_display_name || post.user_username}
                </button>
                <AuthorBadge post={post} />
                <p className="text-[11px]" style={{ color: "#8B7355" }}>{formatDate(post.created_at)}</p>
              </div>
            </div>
            <div className="relative" ref={postMenuRef}>
              <button className="p-1 rounded hover:bg-[#E0D5C5] transition-colors mr-2" onClick={() => setShowPostMenu(!showPostMenu)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B7355"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
              </button>
              {showPostMenu && (
                <div className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-50 overflow-hidden" style={{ backgroundColor: "#FFF8E2", border: "1px solid #E0D5C5", minWidth: "140px" }}>
                  {canDelete && (
                    <button
                      className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#FDE8E8]"
                      style={{ color: "#7B0000" }}
                      onClick={handleDeletePostModal}
                    >
                      {feedT("actions.deletePost")}
                    </button>
                  )}
                  {!canDelete && (
                    <button className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={() => { onReport("post", post.id); setShowPostMenu(false); }}>{feedT("actions.reportPost")}</button>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#E0D5C5] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="px-5 pt-3 pb-3 border-b flex-shrink-0" style={{ borderColor: "var(--border-soft)" }}>
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
                      onReport={onReport}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <div className="px-5 py-2 flex items-center justify-between flex-shrink-0 border-t" style={{ borderColor: "#E0D5C5" }}>
            <div className="flex items-center gap-4">
              <LongPressGemButton
                postId={post.id}
                count={gemsCount}
                className="flex items-center gap-1 text-xs transition-all"
                style={{ color: gemmed ? "#4FC3F7" : "#432817" }}
                onGemClick={handleGem}
              >
                <GemIcon size={14} filled={gemmed} active={gemmed} />
                {formatCount(gemsCount)}
              </LongPressGemButton>
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
  const router = useRouter();
  return (
    <div className="lg:hidden px-4 py-4">
      <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{title}</h3>
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
            <div
              className="w-[60px] h-[60px] rounded-full overflow-hidden mb-1.5 border-2 border-white shadow-sm transition-transform hover:scale-105 cursor-pointer"
              onClick={() => {
                const raw = (group as any)._raw;
                if (raw?.id) router.push(`/group/${raw.id}`);
              }}
            >
              <img
                src={group.image}
                alt={group.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[10px] font-bold text-center leading-tight line-clamp-1" style={{ color: "#432817" }}>
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
  const router = useRouter();
  return (
    <aside className="w-[300px] flex-shrink-0 pl-5 pr-4 pt-4 h-full hidden lg:block overflow-hidden">
      <div className="sticky top-0 h-full flex flex-col">
        <h2 className="text-base font-bold mb-5 flex-shrink-0" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato)" }}>{title}</h2>
        <div className="flex flex-col gap-3 flex-shrink-0">
          {groups.slice(0, 5).map((group, i) => (
            <div
              key={i}
              className="flex gap-4 py-3.5 px-3 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ width: "100%", boxShadow: "0 8px 22px rgba(67,40,23,0.08)", backgroundColor: "var(--light)", border: "1px solid var(--border-soft)" }}
              onClick={() => {
                const raw = (group as any)._raw;
                if (raw?.id) router.push(`/group/${raw.id}`);
              }}
            >
              <img src={group.image} alt={group.name} loading="lazy" decoding="async" className="w-[48px] h-[48px] rounded-full object-cover flex-shrink-0 border-2 shadow-sm" style={{ borderColor: "var(--panel-elevated)" }} />
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>{group.name}</span>
                <span className="text-xs leading-tight mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{group.desc}</span>
                <div className="flex items-center gap-1 mt-1.5">
                  <PeopleIcon className="w-3 h-3 text-[var(--accent-gold)]" />
                  <span className="text-[10px] font-bold" style={{ color: "#432817" }}>
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
  onDelete,
  onReport,
}: {
  post: ApiPost;
  isNew: boolean;
  onCommentClick: () => void;
  onAnnotationClick: () => void;
  interaction: PostInteraction;
  onInteractionChange: (update: Partial<PostInteraction>) => void;
  onDelete?: (postId: string) => void;
  onReport: (type: ReportTargetType, id: string) => void;
}) {
  const feedT = useTranslations("auth.feed");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const user = mounted ? getAuthUser() : null;
  const isOwner = user?.id === post.user_id || (user?.username && (user.username === post.user_username || user.username === post.username));
  const moderatorGlobal = mounted ? isModerator(user) : false;
  const canDelete = mounted && (isOwner || moderatorGlobal);
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
      className={`rounded-none md:rounded-xl mb-1 md:mb-5 transition-all duration-200 cursor-pointer ${isNew ? "post-fade-in" : ""}`}
      style={{
        boxShadow: "0 2px 16px rgba(67,40,23,0.08)",
        backgroundColor: "var(--light)",
      }}
      onClick={onCommentClick}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(67,40,23,0.14)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 16px rgba(67,40,23,0.08)"; }}
    >
      <div className="flex items-center px-4 md:px-5 pt-4 pb-2">
        <AuthorAvatar post={post} size={42} iconSize={22} />
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              className="font-bold text-base hover:underline text-left"
              style={{ color: "#432817", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); if (!post.user_username) return; router.push(`/user/${post.user_username}`); }}
            >
              {post.user_display_name || post.user_username}
            </button>
            <AuthorBadge post={post} />
            <p className="text-xs" style={{ color: "#8B7355" }}>{formatDate(post.created_at)}</p>
          </div>
        </div>
        <div className="relative">
          <button className="p-1 rounded hover:bg-[#FFF8E2] transition-colors" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
          {mounted && showMenu && (
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
              {!moderatorGlobal && (
                <button className="text-sm font-bold whitespace-nowrap" style={{ color: "#432817" }} onClick={(e) => { e.stopPropagation(); onReport("post", post.id); setShowMenu(false); }}>{feedT("actions.reportPost")}</button>
              )}
            </div>

          )}
        </div>
      </div>

      <div className="px-4 md:px-5 pb-2">
        <LocationWorldCard
          location={post.location}
          region={post.region}
          textStyle={{ color: "#8B7355" }}
          iconColor="#8B7355"
          iconSize={14}
        />
      </div>

      <PostDetailBadge post={post} />

      <h3 className="px-4 md:px-5 pb-2 text-xl font-bold prose prose-sm max-w-none" style={{ color: "#432817" }}>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
      </h3>

      <ExpandableContent content={post.content} className="px-4 md:px-5 pb-2 text-sm leading-relaxed" style={{ color: "#432817" }} />
      <PostTags tags={tags} />

      {imageList.length > 0 && (
        <div className="relative px-0 md:px-4 pb-3" onClick={(e) => e.stopPropagation()}>
          {imgError ? (
            <div className="w-full rounded-none md:rounded-lg flex items-center justify-center" style={{ height: 460, background: "linear-gradient(135deg, #C8A96E, #8B6914)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden rounded-none md:rounded-lg h-[300px] sm:h-[400px] md:h-[460px]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
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
                        <img src={imageUrl} alt={post.title} loading="lazy" decoding="async" className="relative z-10 w-full h-full object-contain" onError={() => setImgError(true)} />
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

      <div className="flex items-center justify-between px-4 md:px-5 py-3" style={{ borderColor: "#F0EAD8" }}>
        <div className="flex items-center gap-5">
          <LongPressGemButton
            postId={post.id}
            count={gemsCount}
            className="flex items-center gap-1.5 text-xs transition-all"
            style={{ color: gemmed ? "#4FC3F7" : "#432817" }}
            onGemClick={handleGem}
          >
            <GemIcon filled={gemmed} active={gemmed} />
            <span>{formatCount(gemsCount)}</span>
          </LongPressGemButton>
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
          <PostQuizButton
            postId={post.id}
            title={post.title}
            buttonStyle={{ color: "#432817" }}
          />
          <button className="flex items-center gap-1.5 text-xs transition-all" style={{ color: saved ? "#8B6914" : "#432817" }} onClick={handleSave}>
            <BookmarkIcon filled={saved} active={saved} />
          </button>
        </div>
      </div>
      {mounted && (
        <ActionConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction === "delete") {
              onDelete?.(post.id);
            } else if (confirmAction === "edit") {
              router.push(`/edit-post?id=${post.id}`);
            }
            setConfirmAction(null);
          }}
          title={confirmAction === "delete" ? "Delete Post" : "Edit Post"}
          message={confirmAction === "delete" ? "Are you sure you want to delete this post? This action cannot be undone." : "Are you sure you want to edit this post?"}
          confirmText={confirmAction === "delete" ? "Delete" : "Edit"}
          confirmColor={confirmAction === "delete" ? "#C0392B" : "#8B6914"}
        />
      )}
    </div>
  );
}

/* ─────────────────── POST CACHE HELPERS ─────────────────── */

const CACHE_KEY = "home_posts_cache";
const CACHE_NEXT_KEY = "home_posts_next";
const CACHE_SCROLL_KEY = "home_posts_scroll";
const GROUPS_CACHE_KEY = "home_popular_groups_cache";
const GROUPS_CACHE_TTL = 10 * 60 * 1000;

type GroupsPayload = {
  data?: { results?: Group[] } | Group[];
  results?: Group[];
};

function unwrapGroups(payload: GroupsPayload | Group[] | null | undefined): Group[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return payload.data?.results ?? payload.results ?? [];
}
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

function saveGroupsToCache(groups: Group[]) {
  if (typeof window === "undefined" || groups.length === 0) return;
  try {
    localStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify({ groups, savedAt: Date.now() }));
  } catch { }
}

function loadGroupsFromCache(): Group[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = JSON.parse(localStorage.getItem(GROUPS_CACHE_KEY) || "null") as
      | { groups?: Group[]; savedAt?: number }
      | null;
    if (!cached?.groups?.length || !cached.savedAt) return [];
    if (Date.now() - cached.savedAt > GROUPS_CACHE_TTL) return [];
    return cached.groups;
  } catch {
    return [];
  }
}

/* ─────────────────── MAIN PAGE ─────────────────── */

export default function HomePageRoute() {
  const pathname = usePathname();
  const t = useTranslations("auth.pages.home");
  const commonT = useTranslations("auth.common");
  const initialHomeCache = useMemo(() => loadPostsFromCache(), []);
  const [posts, setPosts] = useState<ApiPost[]>(() => initialHomeCache?.posts ?? []);
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

  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    targetType: ReportTargetType;
    targetId: string;
  }>({ isOpen: false, targetType: "post", targetId: "" });

  const openReportModal = (type: ReportTargetType, id: string) => {
    setReportModal({ isOpen: true, targetType: type, targetId: id });
  };

  const handleReportSubmit = async (reason: string, description: string) => {
    await submitReport(reportModal.targetType, reportModal.targetId, reason, description);
  };
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [nextUrl, setNextUrl] = useState<string | null>(`${API_URL}/api/posts/`);
  const [postInteractions, setPostInteractions] = useState<Record<string, PostInteraction>>({});
  const [apiGroups, setApiGroups] = useState<Group[]>(() => loadGroupsFromCache());
  const popularGroupsQuery = useQuery({
    queryKey: ["groups", "popular"],
    queryFn: async () => unwrapGroups(await fetchJson<GroupsPayload | Group[]>("/groups/popular/")),
    initialData: () => {
      const cached = loadGroupsFromCache();
      return cached.length > 0 ? cached : undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const initialHomeNextUrl =
    initialHomeCache?.nextUrl &&
      initialHomeCache.nextUrl !== "__react-query-next-page__"
      ? initialHomeCache.nextUrl
      : null;
  const canHydrateReactQueryFromCache = Boolean(initialHomeCache?.posts.length && initialHomeNextUrl);
  const homeFeedQuery = usePosts<ApiPost>("home", {
    enabled: !activeFilters,
    pageSize: 10,
    initialPage: canHydrateReactQueryFromCache && initialHomeCache
      ? { results: initialHomeCache.posts, next: initialHomeNextUrl }
      : undefined,
    prefetchNextPage: true,
    prefetchPages: 5,
  });

  const fetchGroups = async () => {
    try {
      const groupData = unwrapGroups(await fetchJson<GroupsPayload | Group[]>("/groups/popular/"));
      if (groupData.length > 0) {
        setApiGroups(groupData);
        saveGroupsToCache(groupData);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  useEffect(() => {
    const groupData = unwrapGroups(popularGroupsQuery.data);
    if (groupData.length === 0) return;
    setApiGroups(groupData);
    saveGroupsToCache(groupData);
  }, [popularGroupsQuery.data]);

  useEffect(() => {
    if (apiGroups.length > 0 || popularGroupsQuery.isFetching) return;
    fetchGroups();
  }, [apiGroups.length, popularGroupsQuery.isFetching]);

  // Handle notification navigation
  useEffect(() => {
    const handleNavigation = () => {
      const token = getAuthToken();
      if (!token) return;

      // Case 1: open post modal (comment/reply/gem on comment)
      const postId = sessionStorage.getItem("open_post_id");
      const tab = (sessionStorage.getItem("open_post_tab") || "comments") as "comments" | "annotations";

      if (postId) {
        sessionStorage.removeItem("open_post_id");
        sessionStorage.removeItem("open_post_tab");

        fetch(`${API_URL}/api/posts/${postId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            const raw = data?.data ?? data;
            if (raw?.id) {
              setSelectedPost(normalizeApiPost(raw));
              setSelectedPostTab(tab);
            }
          })
          .catch(() => { });
        return;
      }

      // Case 2: highlight post in feed (gem on post / repost)
      const highlightId = sessionStorage.getItem("highlight_post_id");
      if (highlightId) {
        sessionStorage.removeItem("highlight_post_id");
        const tryScroll = (attempts = 0) => {
          const el = document.getElementById(`post-${highlightId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.style.outline = "3px solid #8B6914";
            el.style.borderRadius = "12px";
            setTimeout(() => { if (el) el.style.outline = ""; }, 2000);
          } else if (attempts < 15) {
            setTimeout(() => tryScroll(attempts + 1), 300);
          }
        };
        tryScroll();
      }
    };

    handleNavigation();
    window.addEventListener("highlight-post", handleNavigation);
    return () => window.removeEventListener("highlight-post", handleNavigation);
  }, [pathname]);

  const groups = useMemo<GroupCard[]>(
    () => {
      if (apiGroups.length > 0) {
        return apiGroups.map((g) => ({
          name: g.name,
          desc: g.description,
          image: resolveProfilePictureUrl(g.profile_picture),
          members: formatCount(g.member_count),
          membersLabel: t("guilds.members", { count: g.member_count }),
          _raw: g,
        }));
      }
      return [];
    },
    [t, apiGroups],
  );

  const normalizeApiPost = (raw: any, fallback?: ApiPost): ApiPost => ({
    id: String(raw?.id ?? fallback?.id ?? ""),
    user_id: raw?.user_id ?? fallback?.user_id ?? "",
    user_display_name: raw?.user_display_name ?? fallback?.user_display_name ?? "",
    user_username: raw?.user_username ?? fallback?.user_username ?? "",
    user_profile_picture:
      resolveDedicatedProfilePicture(raw) || resolveDedicatedProfilePicture(fallback),
    user_expertise: raw?.user_expertise ?? fallback?.user_expertise ?? "",
    user_role: raw?.user_role ?? fallback?.user_role ?? "",
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
      gemmed: post.is_gemmed ?? (mounted ? getStoredSet("gemmed_posts").has(post.id) : false),
      gemsCount: post.gems_count,
      saved: post.is_saved ?? (mounted ? getStoredSet("saved_posts").has(post.id) : false),
      reposted: post.is_reposted ?? false,
      repostsCount: post.reposts_count ?? 0,
      commentsCount: post.comments_count ?? 0,
      annotationsCount: post.accepted_annotations_count ?? 0,
    };

  const handleDeletePost = async (postId: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPost?.id === postId) setSelectedPost(null);
      } else {
        const errorData = await res.json().catch(() => null);
        alert(`Failed to delete post. Status: ${res.status}. ${errorData?.message || errorData?.detail || ""}`);
      }
    } catch (err) {
      console.error("Delete post error:", err);
      alert("An error occurred while deleting the post.");
    }
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
  const isFeedLoadingMore = activeFilters
    ? loading
    : Boolean(homeFeedQuery.hasNextPage && homeFeedQuery.isFetchingNextPage);

  /* ── Restore posts from sessionStorage cache on mount ── */
  useEffect(() => {
    if (activeFilters) return;
    const formatted = homeFeedQuery.posts.map((post, index) => ({
      ...normalizeApiPost(post),
      _key: index,
    }));
    setPosts((prev) => {
      if (prev.length === 0) return formatted;

      const incomingById = new Map(formatted.map((post) => [post.id, post]));
      const mergedExisting = prev.map((post, index) => {
        const incoming = incomingById.get(post.id);
        return incoming ? { ...incoming, _key: post._key ?? index } : post;
      });
      const existingIds = new Set(prev.map((post) => post.id));
      const additions = formatted
        .filter((post) => !existingIds.has(post.id))
        .map((post, index) => ({ ...post, _key: mergedExisting.length + index }));

      return additions.length > 0 ? [...mergedExisting, ...additions] : mergedExisting;
    });
    setNextUrl(homeFeedQuery.hasNextPage ? "__react-query-next-page__" : null);
    setLoading(homeFeedQuery.isFetchingNextPage);
  }, [
    activeFilters,
    homeFeedQuery.posts,
    homeFeedQuery.hasNextPage,
    homeFeedQuery.isFetchingNextPage,
  ]);

  useEffect(() => {
    if (activeFilters) return;
    requestAnimationFrame(() => {
      const scrollPos = loadScrollPosition();
      if (feedRef.current && scrollPos > 0) {
        feedRef.current.scrollTop = scrollPos;
      }
    });
  }, [activeFilters]);

  useEffect(() => {
    if (activeFilters || posts.length === 0) return;
    savePostsToCache(posts, homeFeedQuery.hasNextPage ? "__react-query-next-page__" : null);
  }, [activeFilters, posts, homeFeedQuery.hasNextPage]);

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

  const handleApplyFilter = async (filters: { region: string; post_type: string; historical_period: string; monument_type: string; expertise: string }) => {
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
    if (filters.expertise) params.append("expertise", filters.expertise);
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
        if (!activeFilters) {
          if (!homeFeedQuery.hasNextPage) {
            setNextUrl(null);
            return;
          }
          if (!homeFeedQuery.isFetchingNextPage) {
            await homeFeedQuery.fetchNextPage();
          }
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
      { rootMargin: "1800px 0px", threshold: 0.01 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [
    nextUrl,
    loading,
    posts.length,
    activeFilters,
    homeFeedQuery.hasNextPage,
    homeFeedQuery.isFetchingNextPage,
    homeFeedQuery.fetchNextPage,
  ]);

  return (
    <>
      <div className="flex h-[100dvh] overflow-hidden justify-center w-full" style={{ fontFamily: "var(--font-lato), sans-serif", backgroundColor: "var(--background)" }}>
        <LeftSidebar activePage="home" />
        <div className="flex h-full w-full max-w-[1180px] md:ml-[80px] pb-24 md:pb-0 min-w-0">
          <div className="flex flex-1 flex-col min-h-0 min-w-0">
            <div className="sticky top-0 z-40 px-4 md:px-6 pt-4 pb-3 flex flex-col gap-4" style={{ backgroundColor: "var(--nav-bg)" }}>
              <div className="flex items-center w-full rounded-full px-4 py-2.5 transition-all duration-200" style={{ backgroundColor: "var(--light)", border: isFocused ? "1px solid var(--accent-gold)" : "1px solid var(--brown)", boxShadow: isFocused ? "0 0 0 3px rgba(82, 65, 30, 0.18)" : "0 0px 0px rgba(20,12,6,0.1)" }}>
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

            <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
              <main ref={feedRef} className="flex-1 overflow-y-auto feed-scroll px-0 md:px-6 py-2 pb-24 md:pb-6 min-w-0" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <MobileGroupsStrip groups={groups} title={t("guilds.title")} />
                {homeFeedQuery.isInitialLoading && !activeFilters && posts.length === 0 && (
                  <PostsSkeletonList count={3} />
                )}
                {posts.map((post, index) => (
                  <div id={`post-${post.id}`} key={`${post.id}-${index}`}>
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
                      onDelete={handleDeletePost}
                      onReport={openReportModal}
                    />
                  </div>
                ))}
                {isFeedLoadingMore && (
                  <div className="flex justify-center py-6">
                    <div className="w-8 h-8 rounded-full border-3 border-t-transparent loader-spin" style={{ borderColor: "var(--border-soft)", borderTopColor: "var(--accent-gold)" }} />
                  </div>
                )}
                <div ref={sentinelRef} className="h-4" />
              </main>
              <RightSidebar
                groups={groups}
                title={t("guilds.title")}
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
          onInteractionChange={(update) => updateInteraction(selectedPost.id, update)}
          onClose={() => setSelectedPost(null)}
          onReport={openReportModal}
        />
      )}

      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleReportSubmit}
        targetType={reportModal.targetType}
      />
    </>
  );
}
