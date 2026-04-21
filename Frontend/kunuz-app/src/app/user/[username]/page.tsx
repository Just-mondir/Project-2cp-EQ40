"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { X, AlertCircle, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import DOMPurify from "dompurify";
import LeftSidebar from "@/components/LeftSidebar";
import { logoutClient } from "@/lib/session";

import LocationWorldCard from "@/components/LocationWorldCard";

import { ChangeEmailPopup, ChangePasswordPopup, DashboardPopup } from "@/components/Profilepopups";
import NotificationModal from "@/components/NotificationModal";

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
  return localStorage.getItem("accessToken") || process.env.NEXT_PUBLIC_TOKEN || "";
}

function getAuthUser(): { id?: string; username?: string; display_name?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRefreshToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("refreshToken") || "";
}

async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  return fetch(url, { ...options, headers });
}

/* ───────────────── TYPES ───────────────── */

type PostImage = { id: string; image: string; uploaded_at: string };
type AlertDetails = {
  id: string;
  urgence_level: "low" | "medium" | "high" | "critical";
  current_status: "restored" | "under_intervention" | "destroyed" | "alert";
};
type EventDetails = { id: string; starts_at: string; ends_at: string };

type ApiPost = {
  id: string;
  user_id?: string;
  user_display_name?: string;
  user_username?: string;
  user_profile_picture?: string;
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

// ← Type matching exact backend field names from User model
type ProfileInfo = {
  username: string;
  display_name: string;
  bio: string;
  expertise: string;
  speciality: string;
  profile_picture: string | null;
  badge: string | null;
  is_verified: boolean;
  role: string;
  posts_count: number;
  likes_count: number;
  events_count: number;
};

/* ───────────────── HELPERS ───────────────── */

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

async function submitReport(targetType: ReportTargetType, targetId: string, reason: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/api/reports/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Failed to submit report.");
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function formatCount(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}

function formatEventTime(details: EventDetails) {
  const start = new Date(details.starts_at);
  const end = new Date(details.ends_at);
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const fmtTime = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  return sameDay
    ? `${fmt(start)} · ${fmtTime(start)} – ${fmtTime(end)}`
    : `${fmt(start)} ${fmtTime(start)} → ${fmt(end)} ${fmtTime(end)}`;
}

function buildTags(post: ApiPost) {
  if (post.tags && post.tags.length > 0) return post.tags;
  const tags: string[] = [];
  if (post.historical_period) tags.push(post.historical_period);
  if (post.monument_type) tags.push(post.monument_type);
  if (post.region) tags.push(post.region);
  return tags;
}

function getAcceptedAnnotationsCount(annotations: Annotation[]): number {
  return annotations.filter((a) => a.status === "accepted").length;
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
      style={{ width: size, height: size, backgroundColor: "#E0D5C5" }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="#8B7355" stroke="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function mapPost(post: any): ApiPost {
  return {
    id: String(post.id),
    user_id: post.user_id ?? "",
    user_display_name: post.user_display_name ?? "",
    user_username: post.user_username ?? "",
    user_profile_picture: post.user_profile_picture ?? "",
    title: post.title ?? "",
    content: post.content ?? "",
    post_type: post.post_type ?? "",
    region: post.region ?? "",
    location: post.location ?? "",
    gems_count: post.gems_count ?? 0,
    comments_count: post.comments_count ?? 0,
    accepted_annotations_count: post.accepted_annotations_count ?? 0,
    is_gemmed: post.is_gemmed ?? false,
    is_saved: post.is_saved ?? false,
    images: Array.isArray(post.images) ? post.images : [],
    tags: Array.isArray(post.tags) ? post.tags : [],
    historical_period: post.historical_period ?? "",
    monument_type: post.monument_type ?? "",
    created_at: post.created_at ?? "",
    alert_details: post.alert_details ?? null,
    event_details: post.event_details ?? null,
  };
}

const CONTENT_LIMIT = 160;

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

/* ───────────────── ICONS ───────────────── */

const GemIcon = ({ size = 18, filled = false, className = "", active = false }: { size?: number; filled?: boolean; className?: string; active?: boolean }) => (
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

const CommentIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkIcon = ({ size = 18, filled = false, active = false, className = "" }: { size?: number; filled?: boolean; active?: boolean; className?: string }) => (
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
    style={{ transition: "color 0.2s, transform 0.15s", transform: active ? "scale(1.15)" : "scale(1)" }}
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const AnnotationIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const GridIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const CalendarIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const DangerIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ───────────────── SPINNER / EMPTY ───────────────── */

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }} />
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="text-center py-12 flex flex-col items-center" style={{ color: "#8B7355" }}>
      {icon}
      <p className="mt-4 text-sm">{message}</p>
    </div>
  );
}

/* ───────────────── POST DETAIL BADGE ───────────────── */

function PostDetailBadge({ post }: { post: ApiPost }) {
  if (post.post_type === "event" && post.event_details) {
    return (
      <div className="mb-3 px-4 py-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: "#EAF0E6", border: "1px solid #B8D4A8" }}>
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
      <div className="mb-3 px-4 py-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: level.bg, border: `1px solid ${level.border}` }}>
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

/* ───────────────── COMMENT ITEM ───────────────── */

function CommentItem({
  comment, postId, onRefresh, onDelete, isReply = false,
}: {
  comment: CommentNode; postId: string; onRefresh?: () => void;
  onDelete?: (commentId: string) => void; isReply?: boolean;
}) {
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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentUser = getAuthUser();
  const isOwner = String(currentUser?.id ?? "") === String(comment.user_id);

  const handleGemComment = async () => {
    const previousGemmed = gemmed;
    const previousCount = gemsCount;
    const nextGemmed = !previousGemmed;
    setGemmed(nextGemmed);
    setGemsCount((prev) => (nextGemmed ? prev + 1 : Math.max(prev - 1, 0)));
    try {
      const res = await fetch(`${API_URL}/api/posts/comments/${comment.id}/gem/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      setGemmed(Boolean(data?.data?.liked ?? nextGemmed));
      setGemsCount(Number(data?.data?.gems_count ?? previousCount));
    } catch {
      setGemmed(previousGemmed);
      setGemsCount(previousCount);
    }
  };

  const handleDeleteComment = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts/comments/${comment.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok || res.status === 204) { setShowMenu(false); onDelete?.(comment.id); }
    } catch { }
  };

  const handleEditComment = () => { setEditText(comment.content); setIsEditing(true); setShowMenu(false); };

  const handleSaveEditedComment = async () => {
    const nextContent = editText.trim();
    if (!nextContent) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/comments/${comment.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent }),
      });
      if (!res.ok) return;
      setIsEditing(false);
      onRefresh?.();
    } catch { }
  };

  const handleCancelEditComment = () => { setEditText(comment.content); setIsEditing(false); };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText, parent_id: comment.id }),
      });
      if (!res.ok) return;
      setReplyText("");
      setShowReplyInput(false);
      onRefresh?.();
    } catch { }
  };

  const handleReportComment = async () => {
    const reason = window.prompt("Why are you reporting this comment?");
    if (!reason || !reason.trim()) return;
    try {
      await submitReport("comment", comment.id, reason.trim());
      setShowMenu(false);
      window.alert("Comment reported successfully.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to report comment.");
    }
  };

  return (
    <div className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--light)", boxShadow: isReply ? "none" : "0 1px 6px rgba(67,40,23,0.06)", border: isReply ? "2px solid #E0D5C5" : "none" }}>
      <UserAvatar profilePicture={comment.user_profile_picture} size={32} iconSize={16} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <button className="text-sm font-bold hover:underline transition-all cursor-pointer" style={{ color: "#432817", background: "none", border: "none", padding: 0 }} onClick={() => router.push(`/user/${comment.user_username}`)}>
            {comment.user_username}
          </button>
          <div className="relative" ref={menuRef}>
            <button className="p-0.5 rounded hover:bg-[#E0D5C5] transition-colors text-sm font-bold leading-none" style={{ color: "#8B7355" }} onClick={() => setShowMenu(!showMenu)}>...</button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-50" style={{ backgroundColor: "#FFF8E2" }}>
                {isOwner ? (
                  <>
                    <button className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={handleEditComment}>Edit comment</button>
                    <button className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#FDE8E8]" style={{ color: "#432817" }} onClick={handleDeleteComment}>Delete comment</button>
                  </>
                ) : (
                  <button className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={handleReportComment}>Report comment</button>
                )}
              </div>
            )}
          </div>
        </div>
        {isEditing ? (
          <div className="mt-1">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full text-xs rounded-xl px-3 py-2 outline-none border resize-none" rows={3} style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0D5C5", color: "#432817" }} />
            <div className="flex items-center gap-2 mt-2">
              <button className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: "#432817", color: "#FFF8E2" }} onClick={handleSaveEditedComment}>Save</button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: "#E0D5C5", color: "#432817" }} onClick={handleCancelEditComment}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm max-w-none" style={{ color: "#432817" }}>{stripHtml(comment.content)}</div>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <button className="text-[10px] flex items-center gap-1 hover:text-[#8B6914] transition-colors" style={{ color: gemmed ? "#8B6914" : "#8B7355" }} onClick={handleGemComment}>
            <GemIcon size={12} filled={gemmed} active={gemmed} /><span>{gemsCount}</span>
          </button>
          <button className="text-[10px] flex items-center gap-1 hover:text-[#8B6914] transition-colors" style={{ color: "#8B7355" }} onClick={() => setShowReplyInput(!showReplyInput)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></svg>
            <span>Reply</span>
          </button>
        </div>
        {showReplyInput && (
          <div className="flex items-center gap-2 mt-2">
            <input type="text" placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSubmitReply(); }} className="flex-1 text-xs rounded-xl px-3 py-2 outline-none border" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0D5C5", color: "#432817" }} />
            <button onClick={handleSubmitReply} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#432817" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────── ANNOTATION ITEM ───────────────── */

function AnnotationItem({
  annotation, postId, postAuthorId, onDelete, onAccept, onReject, onRefresh,
}: {
  annotation: Annotation; postId: string; postAuthorId?: string;
  onDelete: (id: string) => void; onAccept: (id: string) => void;
  onReject: (id: string) => void; onRefresh: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(annotation.text ?? "");
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = String(getAuthUser()?.id ?? "");
  const isOwner = currentUserId === String(annotation.user_id);
  const isPostAuthor = currentUserId === String(postAuthorId ?? "");

  useEffect(() => { setEditText(annotation.text ?? ""); setIsEditing(false); }, [annotation.id, annotation.text]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/annotations/${annotation.id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (res.ok || res.status === 204) { onDelete(annotation.id); setShowMenu(false); }
    } catch { }
  };

  const handleAccept = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/annotations/${annotation.id}/accept/`, { method: "POST", headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (res.ok) { onAccept(annotation.id); setShowMenu(false); }
    } catch { }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/annotations/${annotation.id}/reject/`, { method: "POST", headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (res.ok) { onReject(annotation.id); setShowMenu(false); }
    } catch { }
  };

  const handleEditAnnotation = () => { setEditText(annotation.text ?? ""); setIsEditing(true); setShowMenu(false); };

  const handleSaveEditedAnnotation = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/annotations/${annotation.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText }),
      });
      if (!res.ok) return;
      setIsEditing(false);
      onRefresh();
    } catch { }
  };

  const handleCancelEditAnnotation = () => { setEditText(annotation.text ?? ""); setIsEditing(false); };

  const handleReportAnnotation = async () => {
    const reason = window.prompt("Why are you reporting this annotation?");
    if (!reason || !reason.trim()) return;
    try {
      await submitReport("annotation", annotation.id, reason.trim());
      setShowMenu(false);
      window.alert("Annotation reported successfully.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to report annotation.");
    }
  };

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#FFF3E0", color: "#E07B39", label: "Pending" },
    accepted: { bg: "#EAF0E6", color: "#5C7A3E", label: "Accepted" },
    rejected: { bg: "#FDE8E8", color: "#C0392B", label: "Rejected" },
  };
  const sc = statusColors[annotation.status] ?? statusColors.pending;
  const imageUrl = annotation.image ? (annotation.image.startsWith("/media/") ? `${API_URL}${annotation.image}` : annotation.image) : "";

  return (
    <div className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--light)", boxShadow: "0 1px 6px rgba(67,40,23,0.06)", border: `1px solid ${sc.bg}` }}>
      <div className="w-[32px] h-[32px] rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#E0D5C5" }}>
        <AnnotationIcon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
          <div className="relative" ref={menuRef}>
            <button className="p-0.5 rounded hover:bg-[#E0D5C5] text-sm font-bold" style={{ color: "#8B7355" }} onClick={() => setShowMenu(!showMenu)}>...</button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[150px]" style={{ backgroundColor: "#FFF8E2" }}>
                {isOwner && (
                  <>
                    <button className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={handleEditAnnotation}>Edit annotation</button>
                    <button className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#FDE8E8]" style={{ color: "#432817" }} onClick={handleDelete}>Delete annotation</button>
                  </>
                )}
                {!isOwner && (
                  <button className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={handleReportAnnotation}>Report annotation</button>
                )}
                {isPostAuthor && annotation.status === "pending" && (
                  <>
                    <button className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#EAF0E6]" style={{ color: "#5C7A3E" }} onClick={handleAccept}>Accept</button>
                    <button className="block w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-[#FDE8E8]" style={{ color: "#C0392B" }} onClick={handleReject}>Reject</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {isEditing ? (
          <div className="mt-1">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full text-xs rounded-xl px-3 py-2 outline-none border resize-none" rows={3} style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0D5C5", color: "#432817" }} />
            <div className="flex items-center gap-2 mt-2">
              <button className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: "#432817", color: "#FFF8E2" }} onClick={handleSaveEditedAnnotation}>Save</button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: "#E0D5C5", color: "#432817" }} onClick={handleCancelEditAnnotation}>Cancel</button>
            </div>
          </div>
        ) : annotation.text ? (
          <p className="text-xs" style={{ color: "#432817" }}>{annotation.text}</p>
        ) : null}
        {imageUrl ? <img src={imageUrl} alt="annotation" className="mt-2 rounded-lg max-w-full" style={{ maxHeight: 160, objectFit: "cover" }} /> : null}
        <span className="text-[10px]" style={{ color: "#8B7355" }}>{formatDate(annotation.created_at)}</span>
      </div>
    </div>
  );
}

/* ───────────────── POST MODAL ───────────────── */

function PostModal({
  post, onClose, interaction, onInteractionChange, onDeletePost, loggedInUsername, initialTab = "comments",
}: {
  post: ApiPost | null;
  onClose: () => void;
  interaction: PostInteraction;
  onInteractionChange: (update: Partial<PostInteraction>) => void;
  onDeletePost: (postId: string) => void;
  loggedInUsername: string;
  initialTab?: "comments" | "annotations";
}) {
  const [activeTab, setActiveTab] = useState<"comments" | "annotations">(initialTab);
  const [newComment, setNewComment] = useState("");
  const [newAnnotationText, setNewAnnotationText] = useState("");
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contentExpanded, setContentExpanded] = useState(false);
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const imageScrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const { gemmed, gemsCount, saved } = interaction;
  const acceptedAnnotationsCount = getAcceptedAnnotationsCount(annotations);

  useEffect(() => {
    if (post) {
      setContentExpanded(false);
      setActiveTab(initialTab);
      setAnnotations([]);
      setComments([]);
      setCurrentImageIndex(0);
    }
  }, [post, initialTab]);

  useEffect(() => {
    if (!post) return;
    fetchComments(post.id);
    fetchAnnotations(post.id);
  }, [post]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) setShowPostMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { onInteractionChange({ commentsCount: comments.length }); }, [comments]);
  useEffect(() => { onInteractionChange({ annotationsCount: getAcceptedAnnotationsCount(annotations) }); }, [annotations]);

  if (!post) return null;

  const isOwner = post.user_username === loggedInUsername;
  const isLoggedIn = !!loggedInUsername;
  const imageList = post.images ?? [];
  const tags = buildTags(post);
  const isContentLong = stripHtml(post.content).length > CONTENT_LIMIT;

  const fetchComments = async (postId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments/`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      const data = await res.json();
      const raw = Array.isArray(data.data) ? data.data : [];
      const normalized = raw.map(normalizeComment);
      setComments(normalized);
      onInteractionChange({ commentsCount: normalized.length });
    } catch { }
  };

  const fetchAnnotations = async (postId: string) => {
    setAnnotationsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/annotations/`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      const data = await res.json();
      const items = Array.isArray(data.data) ? data.data : [];
      setAnnotations(items);
      onInteractionChange({ annotationsCount: getAcceptedAnnotationsCount(items) });
    } catch { } finally {
      setAnnotationsLoading(false);
    }
  };

  const handleGem = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextGemmed = !gemmed;
    const nextCount = nextGemmed ? gemsCount + 1 : gemsCount - 1;
    onInteractionChange({ gemmed: nextGemmed, gemsCount: nextCount });
    toggleStoredItem("gemmed_posts", post.id, nextGemmed);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/gem/`, { method: "POST", headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!res.ok) throw new Error();
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
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/save/`, { method: "POST", headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!res.ok) throw new Error();
    } catch {
      onInteractionChange({ saved });
      toggleStoredItem("saved_posts", post.id, saved);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/comments/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (!res.ok) return;
      setNewComment("");
      await fetchComments(post.id);
    } catch { }
  };

  const handleSubmitAnnotation = async () => {
    if (!newAnnotationText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/annotations/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: newAnnotationText }),
      });
      if (!res.ok) return;
      setNewAnnotationText("");
      await fetchAnnotations(post.id);
    } catch { }
  };

  const handleDeletePost = () => { setShowPostMenu(false); setShowDeleteModal(true); };

  const confirmDeletePost = async () => {
    setShowDeleteModal(false);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!res.ok) { alert("Failed to delete post."); return; }
      onDeletePost(post.id);
      onClose();
    } catch (err) { console.error("Error deleting post:", err); }
  };

  const handleDeleteAnnotation = (id: string) => {
    if (id === "__refresh__") { fetchAnnotations(post.id); return; }
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };
  const handleAcceptAnnotation = (id: string) => setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, status: "accepted" } : a)));
  const handleRejectAnnotation = (id: string) => setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)));

  const handleDeleteComment = (id: string) => {
    setComments((prev) => {
      const toRemove = new Set<string>();
      const collect = (commentId: string) => {
        toRemove.add(commentId);
        prev.forEach((item) => { if (String(item.parent) === String(commentId)) collect(item.id); });
      };
      collect(id);
      return prev.filter((x) => !toRemove.has(x.id));
    });
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
    <div className="w-1/2 flex-shrink-0 relative overflow-hidden" style={{ backgroundColor: "#000" }} onClick={(e) => e.stopPropagation()}>
      <div ref={imageScrollRef} onScroll={handleImageScroll} className="hide-scrollbar flex w-full h-full overflow-x-scroll overflow-y-hidden snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        {imageList.map((img) => {
          const imageUrl = img.image.startsWith("/media/") ? `${API_URL}${img.image}` : img.image;
          return (
            <div key={img.id} className="relative w-full h-full flex-shrink-0 snap-center overflow-hidden">
              <div className="absolute inset-0" style={{ backgroundImage: `url("${encodeURI(imageUrl)}")`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", transform: "scale(1.2)" }} />
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
              <img src={imageUrl} alt={post.title} className="relative z-10 w-full h-full object-contain" />
            </div>
          );
        })}
      </div>
      {imageList.length > 1 && currentImageIndex > 0 && (
        <button type="button" className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); scrollToImage(currentImageIndex - 1); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}
      {imageList.length > 1 && currentImageIndex < imageList.length - 1 && (
        <button type="button" className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); scrollToImage(currentImageIndex + 1); }}>
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
      <PostDetailBadge post={post} />
      <div className="text-sm leading-relaxed flex-1 prose prose-sm max-w-none" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tags.map((tag, i) => <span key={i} className="text-[11px] font-medium" style={{ color: "#A07850" }}>#{tag.toLowerCase().replace(/\s+/g, "_")}</span>)}
        </div>
      )}
    </div>
  );

  return (
    <>
      <NotificationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} type="error" title="Delete this post?" message="This action is permanent and cannot be undone. The post and all its images will be removed." primaryAction={{ label: "Delete", onClick: confirmDeletePost }} secondaryAction={{ label: "Cancel", onClick: () => setShowDeleteModal(false) }} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative flex flex-col md:flex-row w-full max-w-[1000px] max-h-[90vh] h-[90vh] rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
          {LeftPanel}
          <div className="w-1/2 flex flex-col" style={{ backgroundColor: "#FFF8E2" }}>
            <div className="flex items-center px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
              <UserAvatar profilePicture={post.user_profile_picture} size={38} iconSize={20} />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <button className="font-bold text-base hover:underline text-left" style={{ color: "#432817", background: "none", border: "none", padding: 0, cursor: "pointer" }} onClick={() => { if (!post.user_username) return; onClose(); router.push(`/user/${post.user_username}`); }}>
                    {post.user_display_name || post.user_username}
                  </button>
                  <p className="text-[11px]" style={{ color: "#8B7355" }}>{formatDate(post.created_at)}</p>
                </div>
              </div>
              <div className="relative" ref={postMenuRef}>
                <button className="p-1 rounded hover:bg-[#E0D5C5] mr-2" onClick={() => setShowPostMenu(!showPostMenu)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B7355"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                </button>
                {showPostMenu && (
                  <div className="absolute right-0 top-full mt-1 py-2 rounded-lg shadow-lg z-50" style={{ backgroundColor: "#FFF8E2" }}>
                    {isOwner ? (
                      <>
                        <button className="block w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={() => { setShowPostMenu(false); router.push(`/edit-post?id=${post.id}`); }}>Edit</button>
                        <button className="block w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F0EAD8]" style={{ color: "#C0392B" }} onClick={handleDeletePost}>Delete</button>
                      </>
                    ) : (
                      <button className="block w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F0EAD8]" style={{ color: "#C0392B" }} onClick={() => { setShowPostMenu(false); if (!isLoggedIn) { router.push("/login"); return; } }}>Report post</button>
                    )}
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#E0D5C5]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {imageList.length > 0 && (
              <div className="px-5 pt-3 pb-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
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
                    {stripHtml(post.content).slice(0, CONTENT_LIMIT) + "… "}
                    <button className="font-semibold" style={{ color: "#8B6914" }} onClick={() => setContentExpanded(true)}>See more</button>
                  </p>
                ) : (
                  <div className="text-xs leading-relaxed prose prose-sm max-w-none mt-1" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
                )}
                {isContentLong && contentExpanded && (
                  <button className="font-semibold text-xs mt-1" style={{ color: "#8B6914" }} onClick={() => setContentExpanded(false)}>See less</button>
                )}
              </div>
            )}
            <div className="flex border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
              <button className="flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5" style={{ color: activeTab === "comments" ? "#432817" : "#8B7355", borderBottom: activeTab === "comments" ? "2px solid #432817" : "2px solid transparent" }} onClick={() => setActiveTab("comments")}>
                <CommentIcon size={13} /> Comments ({comments.length})
              </button>
              <button className="flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5" style={{ color: activeTab === "annotations" ? "#432817" : "#8B7355", borderBottom: activeTab === "annotations" ? "2px solid #432817" : "2px solid transparent" }} onClick={() => setActiveTab("annotations")}>
                <AnnotationIcon size={13} /> Annotations ({acceptedAnnotationsCount})
              </button>
            </div>
            <div className="flex-1 overflow-y-auto feed-scroll">
              {activeTab === "comments" && (
                <div className="px-5 py-3 flex flex-col gap-3">
                  {topLevelComments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <CommentIcon size={28} className="opacity-30" />
                      <p className="text-xs" style={{ color: "#8B7355" }}>No comments yet. Be the first to comment!</p>
                    </div>
                  ) : topLevelComments.map((comment) => renderCommentThread(comment))}
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
                      <p className="text-xs" style={{ color: "#8B7355" }}>No annotations yet. Be the first to annotate!</p>
                    </div>
                  ) : annotations.map((annotation) => (
                    <AnnotationItem key={annotation.id} annotation={annotation} postId={post.id} postAuthorId={post.user_id} onDelete={handleDeleteAnnotation} onAccept={handleAcceptAnnotation} onReject={handleRejectAnnotation} onRefresh={() => fetchAnnotations(post.id)} />
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-2 flex items-center justify-between flex-shrink-0 border-t" style={{ borderColor: "#E0D5C5" }}>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-xs transition-all" style={{ color: gemmed ? "#4FC3F7" : "#432817" }} onClick={handleGem}>
                  <GemIcon size={14} filled={gemmed} active={gemmed} />{formatCount(gemsCount)}
                </button>
                <button className="flex items-center gap-1 text-xs transition-all" style={{ color: activeTab === "comments" ? "#432817" : "#8B7355" }} onClick={() => setActiveTab("comments")}>
                  <CommentIcon size={14} /> {formatCount(comments.length)}
                </button>
                <button className="flex items-center gap-1 text-xs transition-all" style={{ color: activeTab === "annotations" ? "#432817" : "#8B7355" }} onClick={() => setActiveTab("annotations")}>
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
                  <input type="text" placeholder="Add a comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }} className="flex-1 text-xs rounded-xl px-4 py-2.5 outline-none border" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0D5C5", color: "#432817" }} />
                  <button onClick={handleSubmitComment} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 hover:opacity-80" style={{ backgroundColor: "#432817" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                </>
              ) : (
                <>
                  <input type="text" placeholder="Add an annotation" value={newAnnotationText} onChange={(e) => setNewAnnotationText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSubmitAnnotation(); }} className="flex-1 text-xs rounded-xl px-4 py-2.5 outline-none border" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0D5C5", color: "#432817" }} />
                  <button onClick={handleSubmitAnnotation} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 hover:opacity-80" style={{ backgroundColor: "#432817" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────────── PROFILE HEADER ───────────────── */

function ProfileHeader({
  profileInfo,
  isOwnProfile,
}: {
  profileInfo: ProfileInfo;
  isOwnProfile: boolean;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const menuRef = useRef<any>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = isOwnProfile && (profileInfo.role === "moderator" || profileInfo.role === "admin")
  ? ["Dashboard", "Platform statistics"]
  : ["Dashboard"];

  const handleLogout = async () => {
    await logoutClient();
    setShowLogoutModal(false);
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    try {
      await fetch(`${API_URL}/api/users/me/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: getRefreshToken() }),
      });
    } catch { }
    setShowDeleteAccountModal(false);
    await logoutClient();
    router.push("/");
  };

  return (
    <div className="flex flex-col pt-8 pb-6 px-6 relative">
      <div className="absolute top-4 right-6" ref={menuRef}>
        <button className="profile-dashboard-menu-trigger p-2 rounded hover:bg-[#F0EAD8] transition-colors" onClick={() => setShowMenu(!showMenu)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 py-2 rounded-lg shadow-lg z-50" style={{ backgroundColor: "#FFF8E2" }}>
            {menuItems.map((item, i) => (
  <button key={i} className="profile-dashboard-menu-item block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]" style={{ color: "#432817", fontFamily: "var(--font-lato)" }} onClick={() => { setShowMenu(false); if (item === "Dashboard") setShowDashboardModal(true); if (item === "Platform statistics") router.push("/statistics"); }}>
    {item}
  </button>
))}
          </div>
        )}
      </div>

      {/* ── Popups ── */}
      {showChangeEmailModal && <ChangeEmailPopup onClose={() => setShowChangeEmailModal(false)} />}
      {showChangePasswordModal && <ChangePasswordPopup onClose={() => setShowChangePasswordModal(false)} />}
      {showDashboardModal && (
  <DashboardPopup
    onClose={() => setShowDashboardModal(false)}
    isModerator={profileInfo.role === "moderator" || profileInfo.role === "admin"}  // ← CHANGED
    onChangeEmail={() => setShowChangeEmailModal(true)}
    onChangePassword={() => setShowChangePasswordModal(true)}
    onDeleteAccount={() => setShowDeleteAccountModal(true)}
    onLogout={() => setShowLogoutModal(true)}
    onPlatformStatistics={() => router.push("/statistics")}  // ← ADD THIS LINE
  />
)}
      <NotificationModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} type="info" title="Are you sure you want to log out?" message="If you continue, your token will be cleared and you will be redirected to the landing page." primaryAction={{ label: "Log out", onClick: handleLogout }} secondaryAction={{ label: "Cancel", onClick: () => setShowLogoutModal(false) }} />
      <NotificationModal isOpen={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} type="error" title="Delete your account?" message="This action is permanent and cannot be undone. All your data and posts will be removed." primaryAction={{ label: "Delete Account", onClick: handleDeleteAccount }} secondaryAction={{ label: "Keep Account", onClick: () => setShowDeleteAccountModal(false) }} />

      <div className="flex items-start gap-8">
        <div className="w-[140px] h-[140px] rounded-full flex-shrink-0 overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(67,40,23,0.15)" }}>
          {profileInfo.profile_picture ? (
            <img
              src={profileInfo.profile_picture.startsWith("/media/")
                ? `${API_URL}${profileInfo.profile_picture}`
                : profileInfo.profile_picture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <img src="/Ellipse 34.jpg" alt="Profile" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#432817" }}>
            {profileInfo.display_name || profileInfo.username || "User"}
          </h1>
          <p className="text-sm mb-4" style={{ color: "#8B7355" }}>
            @{profileInfo.username}
          </p>

          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="font-bold" style={{ color: "#432817" }}>{profileInfo.posts_count}</span>
              <span className="text-sm" style={{ color: "#8B7355" }}>Posts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold" style={{ color: "#432817" }}>{profileInfo.likes_count}</span>
              <span className="text-sm" style={{ color: "#8B7355" }}>Likes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold" style={{ color: "#432817" }}>{profileInfo.events_count}</span>
              <span className="text-sm" style={{ color: "#8B7355" }}>Events</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            {profileInfo.expertise && (
              <span className="text-sm" style={{ color: "#432817" }}>#{profileInfo.expertise}</span>
            )}
            {profileInfo.speciality && (
              <span className="text-sm" style={{ color: "#432817" }}>#{profileInfo.speciality}</span>
            )}
          </div>

          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#432817" }}>
           {stripHtml(profileInfo.bio)}
          </p>
        </div>
      </div>

      {isOwnProfile && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => router.push("/add-post")} className="text-sm font-semibold hover:opacity-90" style={{ backgroundColor: "#432817", color: "#FFF8E2", borderRadius: "8px", width: "400px", height: "40px" }}>Add post</button>
          <button onClick={() => router.push("/edit-profile")} className="text-sm font-semibold hover:opacity-90" style={{ backgroundColor: "#432817", color: "#FFF8E2", borderRadius: "8px", width: "400px", height: "40px" }}>Edit profile</button>
        </div>
      )}
    </div>
  );
}

/* ───────────────── TABS ───────────────── */

function ProfileTabs({ activeTab, setActiveTab, isOwnProfile }: { activeTab: string; setActiveTab: (t: string) => void; isOwnProfile: boolean }) {
  const tabs = [
    { id: "grid", icon: <GridIcon size={20} /> },
    ...(isOwnProfile ? [{ id: "gems", icon: <GemIcon size={20} /> }, { id: "saved", icon: <BookmarkIcon size={20} /> }] : []),
    { id: "events", icon: <CalendarIcon size={20} /> },
    { id: "alerts", icon: <DangerIcon size={20} /> },
  ];

  return (
    <div className="flex items-center justify-between px-20 py-2 mb-6 border-t" style={{ borderColor: "#E0D5C5" }}>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="p-3 transition-all duration-200 hover:opacity-70 relative" style={{ color: activeTab === tab.id ? "#432817" : "#8B7355" }}>
          {tab.icon}
          {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: "#432817" }} />}
        </button>
      ))}
    </div>
  );
}

/* ───────────────── POST GRID CARD ───────────────── */

function PostGridCard({
  post, interaction, onClick, onCommentClick, onAnnotationClick,
}: {
  post: ApiPost;
  interaction: PostInteraction;
  onClick: () => void;
  onCommentClick: () => void;
  onAnnotationClick: () => void;
}) {
  const imageList = post.images ?? [];
  const firstImage = imageList[0];
  const imageUrl = firstImage ? (firstImage.image.startsWith("/media/") ? `${API_URL}${firstImage.image}` : firstImage.image) : null;
  const { gemsCount, commentsCount, annotationsCount } = interaction;

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group" style={{ boxShadow: "0 2px 12px rgba(67,40,23,0.1)" }} onClick={onClick}>
      {imageUrl ? (
        <img src={imageUrl} alt={stripHtml(post.title)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center px-3" style={{ background: "linear-gradient(135deg, #e8d9bb, #ded2bc)" }}>
          <p className="text-center text-xs font-semibold leading-snug line-clamp-3" style={{ color: "rgba(0,0,0,0.78)" }}>{stripHtml(post.title)}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5 text-white"><GemIcon size={18} /><span className="font-semibold text-sm">{formatCount(gemsCount)}</span></div>
        <button className="flex items-center gap-1.5 text-white" onClick={(e) => { e.stopPropagation(); onCommentClick(); }}>
          <CommentIcon size={18} /><span className="font-semibold text-sm">{formatCount(commentsCount)}</span>
        </button>
        <button className="flex items-center gap-1.5 text-white" onClick={(e) => { e.stopPropagation(); onAnnotationClick(); }}>
          <AnnotationIcon size={18} /><span className="font-semibold text-sm">{formatCount(annotationsCount)}</span>
        </button>
      </div>
      {post.post_type && (
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize" style={{ backgroundColor: post.post_type === "alert" ? "#FEE2E2" : post.post_type === "event" ? "#DCFCE7" : post.post_type === "visit" ? "#FFF0E0" : post.post_type === "question" ? "#EEF2FF" : post.post_type === "discovery" ? "#FFFBEB" : "#FFF8E2", color: post.post_type === "alert" ? "#B91C1C" : post.post_type === "event" ? "#15803D" : post.post_type === "visit" ? "#C2570A" : post.post_type === "question" ? "#3730A3" : post.post_type === "discovery" ? "#B45309" : "#432817" }}>
          {post.post_type}
        </span>
      )}
      {imageList.length > 1 && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md" style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}>
          +{imageList.length - 1}
        </div>
      )}
    </div>
  );
}

function PostsGrid({
  posts, getInteraction, onPostClick, onCommentClick, onAnnotationClick,
}: {
  posts: ApiPost[];
  getInteraction: (post: ApiPost) => PostInteraction;
  onPostClick: (p: ApiPost) => void;
  onCommentClick: (p: ApiPost) => void;
  onAnnotationClick: (p: ApiPost) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-3 px-4 pb-8">
      {posts.map((post) => (
        <PostGridCard
          key={post.id}
          post={post}
          interaction={getInteraction(post)}
          onClick={() => onPostClick(post)}
          onCommentClick={() => onCommentClick(post)}
          onAnnotationClick={() => onAnnotationClick(post)}
        />
      ))}
    </div>
  );
}

/* ───────────────── MAIN PAGE ───────────────── */

export default function ProfilePage() {
  const [loggedInUsername, setLoggedInUsername] = useState("");
  const [activeTab, setActiveTab] = useState("grid");
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);
  const [selectedPostTab, setSelectedPostTab] = useState<"comments" | "annotations">("comments");

  const [allPosts, setAllPosts] = useState<ApiPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [gemmedPosts, setGemmedPosts] = useState<ApiPost[]>([]);
  const [loadingGemmed, setLoadingGemmed] = useState(false);
  const [savedPosts, setSavedPosts] = useState<ApiPost[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [eventPosts, setEventPosts] = useState<ApiPost[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [alertPosts, setAlertPosts] = useState<ApiPost[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const [postInteractions, setPostInteractions] = useState<Record<string, PostInteraction>>({});

  // ← state for real profile info from backend
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    username: "",
    display_name: "",
    bio: "",
    expertise: "",
    speciality: "",
    profile_picture: null,
    badge: null,
    is_verified: false,
    role: "",
    posts_count: 0,
    likes_count: 0,
    events_count: 0,
  });

  const params = useParams();
  const viewedUsername = typeof params?.username === "string" ? params.username : loggedInUsername;
  const isOwnProfile = !!loggedInUsername && !!viewedUsername && loggedInUsername === viewedUsername;

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
      const allPostsFlat = [...allPosts, ...gemmedPosts, ...savedPosts, ...eventPosts, ...alertPosts];
      const sourcePost = allPostsFlat.find((p) => p.id === postId);
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

  const deletePostFromLists = (postId: string) => {
    setAllPosts((prev) => prev.filter((p) => p.id !== postId));
    setGemmedPosts((prev) => prev.filter((p) => p.id !== postId));
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
    setEventPosts((prev) => prev.filter((p) => p.id !== postId));
    setAlertPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  /* ── Fetch logged in user ── */
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/me/`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
        if (res.ok) {
          const json = await res.json();
          setLoggedInUsername(json.data?.username ?? json.username ?? "");
        }
      } catch (err) { console.error("Error fetching me:", err); }
    };
    fetchMe();
  }, []);

  // ← fetch real profile info + likes + events + posts counts
  useEffect(() => {
    if (!viewedUsername) return;
    const fetchProfile = async () => {
      try {
        const endpoint = isOwnProfile
          ? `${API_URL}/api/users/me/`
          : `${API_URL}/api/users/${viewedUsername}/`;
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data ?? json;

          // ← fetch events count
          let eventsCount = 0;
          try {
            const eventsRes = await fetch(
              `${API_URL}/api/posts/user/${viewedUsername}/events/`,
              { headers: { Authorization: `Bearer ${getAuthToken()}` } }
            );
            if (eventsRes.ok) {
              const eventsData = await eventsRes.json();
              eventsCount = eventsData.count ?? (eventsData.results ?? eventsData).length;
            }
          } catch {}

          // ← fetch likes count (sum of gems_count) and posts count — reuse same request
          let likesCount = 0;
          let allPostsCount = 0;
          try {
            const postsRes = await fetch(
              `${API_URL}/api/posts/user/${viewedUsername}/`,
              { headers: { Authorization: `Bearer ${getAuthToken()}` } }
            );
            if (postsRes.ok) {
              const postsData = await postsRes.json();
              const posts = postsData.results ?? postsData;
              likesCount = posts.reduce(
                (sum: number, p: any) => sum + (p.gems_count ?? 0),
                0
              );
              // ← fetch real posts count from same response
              allPostsCount = postsData.count ?? posts.length;
            }
          } catch {}

          setProfileInfo({
            username: data.username ?? "",
            display_name: data.display_name ?? data.username ?? "",
            bio: data.bio ?? "",
            expertise: data.expertise ?? "",
            speciality: data.speciality ?? "",
            profile_picture: data.profile_picture ?? null,
            badge: data.badge ?? null,
            is_verified: data.is_verified ?? false,
            role: data.role ?? "",
            // ← use real fetched count instead of data.posts_count
            posts_count: allPostsCount,
            likes_count: likesCount,
            events_count: eventsCount,
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [viewedUsername, isOwnProfile]);

  /* ── Fetch posts ── */
  useEffect(() => {
    if (!viewedUsername) return;
    const fetchAllPosts = async () => {
      setLoadingPosts(true);
      let url: string | null = `${API_URL}/api/posts/user/${viewedUsername}/`;
      const collected: ApiPost[] = [];
      try {
        while (url) {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
          if (!res.ok) break;
          const data = await res.json();
          collected.push(...(data.results ?? []).map(mapPost));
          url = data.next ?? null;
        }
        setAllPosts(collected);
      } catch (err) { console.error("Error fetching posts:", err); }
      finally { setLoadingPosts(false); }
    };
    fetchAllPosts();
  }, [viewedUsername]);

  useEffect(() => {
    if (!isOwnProfile || activeTab !== "gems") return;
    const fetch_ = async () => {
      setLoadingGemmed(true);
      try {
        const res = await fetch(`${API_URL}/api/posts/gemed/`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
        if (!res.ok) return;
        const data = await res.json();
        setGemmedPosts((data.results ?? data).map(mapPost));
      } catch (err) { console.error(err); }
      finally { setLoadingGemmed(false); }
    };
    fetch_();
  }, [activeTab, isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile || activeTab !== "saved") return;
    const fetch_ = async () => {
      setLoadingSaved(true);
      try {
        const res = await fetch(`${API_URL}/api/posts/saved/`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
        if (!res.ok) return;
        const data = await res.json();
        setSavedPosts((data.results ?? data).map(mapPost));
      } catch (err) { console.error(err); }
      finally { setLoadingSaved(false); }
    };
    fetch_();
  }, [activeTab, isOwnProfile]);

  useEffect(() => {
    if (activeTab !== "events" || !viewedUsername) return;
    const fetch_ = async () => {
      setLoadingEvents(true);
      try {
        const res = await fetch(`${API_URL}/api/posts/user/${viewedUsername}/events/`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
        if (!res.ok) return;
        const data = await res.json();
        setEventPosts((data.results ?? data).map(mapPost));
      } catch (err) { console.error(err); }
      finally { setLoadingEvents(false); }
    };
    fetch_();
  }, [activeTab, viewedUsername]);

  useEffect(() => {
    if (activeTab !== "alerts" || !viewedUsername) return;
    const fetch_ = async () => {
      setLoadingAlerts(true);
      try {
        const res = await fetch(`${API_URL}/api/posts/user/${viewedUsername}/alerts/`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
        if (!res.ok) return;
        const data = await res.json();
        setAlertPosts((data.results ?? data).map(mapPost));
      } catch (err) { console.error(err); }
      finally { setLoadingAlerts(false); }
    };
    fetch_();
  }, [activeTab, viewedUsername]);

  useEffect(() => {
    if (!isOwnProfile && (activeTab === "gems" || activeTab === "saved")) setActiveTab("grid");
  }, [isOwnProfile, activeTab]);

  const openPost = (post: ApiPost, tab: "comments" | "annotations" = "comments") => {
    setSelectedPost(post);
    setSelectedPostTab(tab);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)", fontFamily: "var(--font-lato)" }}>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          initialTab={selectedPostTab}
          interaction={getInteraction(selectedPost)}
          onInteractionChange={(update) => updateInteraction(selectedPost.id, update)}
          onDeletePost={deletePostFromLists}
          onClose={() => setSelectedPost(null)}
          loggedInUsername={loggedInUsername}
        />
      )}

      <LeftSidebar activePage="profile" />

      <main className="pl-[80px] pr-4">
        <div className="max-w-4xl mx-auto">
          <ProfileHeader profileInfo={profileInfo} isOwnProfile={isOwnProfile} />
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} isOwnProfile={isOwnProfile} />

          {activeTab === "grid" && (
            loadingPosts ? <Spinner /> :
              allPosts.length === 0 ? <EmptyState icon={<GridIcon size={48} />} message="No Posts yet" /> :
                <PostsGrid posts={allPosts} getInteraction={getInteraction} onPostClick={(p) => openPost(p)} onCommentClick={(p) => openPost(p, "comments")} onAnnotationClick={(p) => openPost(p, "annotations")} />
          )}
          {isOwnProfile && activeTab === "gems" && (
            loadingGemmed ? <Spinner /> :
              gemmedPosts.length === 0 ? <EmptyState icon={<GemIcon size={48} />} message="Your Treasure is empty" /> :
                <PostsGrid posts={gemmedPosts} getInteraction={getInteraction} onPostClick={(p) => openPost(p)} onCommentClick={(p) => openPost(p, "comments")} onAnnotationClick={(p) => openPost(p, "annotations")} />
          )}
          {isOwnProfile && activeTab === "saved" && (
            loadingSaved ? <Spinner /> :
              savedPosts.length === 0 ? <EmptyState icon={<BookmarkIcon size={48} />} message="Your Collection is empty" /> :
                <PostsGrid posts={savedPosts} getInteraction={getInteraction} onPostClick={(p) => openPost(p)} onCommentClick={(p) => openPost(p, "comments")} onAnnotationClick={(p) => openPost(p, "annotations")} />
          )}
          {activeTab === "events" && (
            loadingEvents ? <Spinner /> :
              eventPosts.length === 0 ? <EmptyState icon={<CalendarIcon size={48} />} message="No Events yet" /> :
                <PostsGrid posts={eventPosts} getInteraction={getInteraction} onPostClick={(p) => openPost(p)} onCommentClick={(p) => openPost(p, "comments")} onAnnotationClick={(p) => openPost(p, "annotations")} />
          )}
          {activeTab === "alerts" && (
            loadingAlerts ? <Spinner /> :
              alertPosts.length === 0 ? <EmptyState icon={<DangerIcon size={48} />} message="No Monuments in Danger yet" /> :
                <PostsGrid posts={alertPosts} getInteraction={getInteraction} onPostClick={(p) => openPost(p)} onCommentClick={(p) => openPost(p, "comments")} onAnnotationClick={(p) => openPost(p, "annotations")} />
          )}
        </div>
      </main>
    </div>
  );
}

