"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, AlertCircle, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import DOMPurify from "dompurify";

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
    return localStorage.getItem("accessToken") || process.env.NEXT_PUBLIC_TOKEN || "";
  }
  return process.env.NEXT_PUBLIC_TOKEN || "";
};
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
  user_display_name?: string;
  user_username?: string;
  title: string;
  content: string;
  post_type: string;
  region: string;
  location: string;
  gems_count: number;
  comments_count: number;
  images: PostImage[];
  tags?: string[];
  historical_period?: string;
  monument_type?: string;
  created_at: string;
  alert_details: AlertDetails | null;
  event_details: EventDetails | null;
  _key?: number;
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

function buildTags(post: ApiPost) {
  if (post.tags && post.tags.length > 0) return post.tags;
  const tags: string[] = [];
  if (post.historical_period) tags.push(post.historical_period);
  if (post.monument_type) tags.push(post.monument_type);
  if (post.region) tags.push(post.region);
  return tags;
}

function mapPost(post: any): ApiPost {
  return {
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

const MOCK_COMMENTS = [
  { id: 1, user: "AminaBen", text: "Incredible architecture! The Roman influence is so well preserved here." },
  { id: 2, user: "YoucefDZ", text: "I visited last summer, the columns are breathtaking in person." },
  { id: 3, user: "LinaHeritage", text: "This site deserves more international recognition." },
  { id: 4, user: "KarimArch", text: "The forum area is my favorite part. So much history in one place." },
  { id: 5, user: "SarahExplorer", text: "Does anyone know the best time of year to visit?" },
  { id: 6, user: "MohamedDZ", text: "The triumphal arches are stunning. Great photo!" },
];

const PROFILE_DATA = {
  bio: "Passionate about preserving Algeria's rich architectural heritage. Exploring the stories behind every stone, arch, and tile. Join me on this journey through time.",
};

/* ───────────────── ICONS ───────────────── */

const GemIcon = ({ size = 18, filled = false, className = "" }: { size?: number; filled?: boolean; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9z" />
    <path d="M2 9h20" />
    <path d="M12 22L6 9l3-6" />
    <path d="M12 22l6-13-3-6" />
  </svg>
);

const CommentIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkIcon = ({ size = 18, filled = false }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const AnnotationIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const GridIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const CalendarIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const DangerIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ───────────────── SPINNER ───────────────── */

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }} />
    </div>
  );
}

/* ───────────────── EMPTY STATE ───────────────── */

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="text-center py-12 flex flex-col items-center" style={{ color: "#8B7355" }}>
      {icon}
      <p className="mt-4 text-sm">{message}</p>
    </div>
  );
}

/* ───────────────── NOTIFICATION MODAL ───────────────── */

function NotificationModal({
  isOpen,
  onClose,
  type = "info",
  title,
  message,
  primaryAction,
  secondaryAction,
}: {
  isOpen: boolean;
  onClose: () => void;
  type?: "info" | "warning" | "success" | "error";
  title?: string;
  message?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  if (!isOpen) return null;

  const STATUS_CONFIG = {
    info: { color: "#000000", icon: <HelpCircle size={48} strokeWidth={1.5} />, iconColor: "#000000" },
    warning: { color: "#F2994A", icon: <AlertTriangle size={48} strokeWidth={1.5} />, iconColor: "#F2994A" },
    success: { color: "#27AE60", icon: <CheckCircle size={48} strokeWidth={1.5} />, iconColor: "#27AE60" },
    error: { color: "#EB5757", icon: <AlertCircle size={48} strokeWidth={1.5} />, iconColor: "#EB5757" },
  };

  const config = STATUS_CONFIG[type] || STATUS_CONFIG.info;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <div style={{ height: "6px", backgroundColor: config.color }} />
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors">
          <X size={20} className="text-gray-400" />
        </button>
        <div className="p-8 flex flex-col items-center text-center">
          <div className="mb-6 flex items-center justify-center p-2 rounded-full border-2" style={{ borderColor: config.iconColor + "40", color: config.iconColor }}>
            {config.icon}
          </div>
          <h2 className="text-[20px] font-bold text-[#432817] mb-2 leading-tight">{title}</h2>
          <p className="text-[14px] text-[#8B7355] mb-8 leading-relaxed max-w-[300px]">{message}</p>
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            {primaryAction && (
              <button onClick={primaryAction.onClick} className="w-full py-3 bg-black text-white text-[15px] font-bold rounded-lg hover:bg-black/90 transition-all active:scale-[0.98]">
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button onClick={secondaryAction.onClick} className="w-full py-2 bg-transparent text-[#432817] text-[15px] font-semibold hover:opacity-70 transition-all">
                {secondaryAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── COMMENT ITEM ───────────────── */

function CommentItem({ comment }: { comment: { id: number; user: string; text: string } }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--light)", boxShadow: "0 1px 6px rgba(67,40,23,0.06)" }}>
      <div className="w-[32px] h-[32px] rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#E0D5C5" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#8B7355" stroke="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <button className="text-sm font-bold hover:underline" style={{ color: "#432817", background: "none", border: "none", padding: 0, cursor: "pointer" }} onClick={() => router.push(`/user/${comment.user}`)}>
            {comment.user}
          </button>
          <div className="relative" ref={menuRef}>
            <button className="p-0.5 rounded hover:bg-[#E0D5C5] text-sm font-bold leading-none" style={{ color: "#8B7355" }} onClick={() => setShowMenu(!showMenu)}>
              ...
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-50" style={{ backgroundColor: "#FFF8E2" }}>
                <button className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={() => setShowMenu(false)}>
                  Report comment
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#432817" }}>{comment.text}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <button className="text-[10px] flex items-center gap-1 hover:text-[#8B6914]" style={{ color: "#8B7355" }}>
            <GemIcon size={12} /><span>10</span>
          </button>
          <button className="text-[10px] flex items-center gap-1 hover:text-[#8B6914]" style={{ color: "#8B7355" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4" />
              <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
            </svg>
            <span>10</span>
          </button>
        </div>
      </div>
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
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
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
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
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

/* ───────────────── POST MODAL ───────────────── */

function PostModal({
  post,
  onClose,
  onUpdatePost,
  onDeletePost,
}: {
  post: ApiPost | null;
  onClose: () => void;
  onUpdatePost: (postId: string, updater: (post: ApiPost) => ApiPost) => void;
  onDeletePost: (postId: string) => void;
}) {
  const [newComment, setNewComment] = useState("");
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [gemmed, setGemmed] = useState(false);
  const [gemsCount, setGemsCount] = useState(post?.gems_count ?? 0);
  const [saved, setSaved] = useState(false);
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const imageScrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (post) {
      setGemsCount(post.gems_count);
      setGemmed(getStoredSet("gemmed_posts").has(post.id));
      setSaved(getStoredSet("saved_posts").has(post.id));
      setContentExpanded(false);
      setCurrentImageIndex(0);
    }
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

  if (!post) return null;

  const imageList = post.images ?? [];
  const tags = buildTags(post);
  const isContentLong = post.content.length > CONTENT_LIMIT;

  const handleDeletePost = () => {
    setShowPostMenu(false);
    setShowDeleteModal(true);
  };

  const confirmDeletePost = async () => {
    setShowDeleteModal(false);
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert("Failed to delete post.");
        return;
      }
      onDeletePost(post.id);
      onClose();
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleGem = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const token = getAuthToken();
    if (!token) {
      alert("Please login to interact with posts.");
      return;
    }

    const previousGemmed = gemmed;
    const previousCount = gemsCount;
    const nextGemmed = !previousGemmed;
    const nextCount = nextGemmed ? previousCount + 1 : previousCount - 1;
    setGemmed(nextGemmed);
    setGemsCount(nextCount);
    toggleStoredItem("gemmed_posts", post.id, nextGemmed);
    onUpdatePost(post.id, (prevPost) => ({ ...prevPost, gems_count: nextCount }));
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/gem/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Failed to toggle gem");
        throw new Error("Failed to toggle gem");
      }
    } catch (err) {
      console.error(err);
      setGemmed(previousGemmed);
      setGemsCount(previousCount);
      toggleStoredItem("gemmed_posts", post.id, previousGemmed);
      onUpdatePost(post.id, (prevPost) => ({ ...prevPost, gems_count: previousCount }));
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const token = getAuthToken();
    if (!token) {
      alert("Please login to interact with posts.");
      return;
    }

    const previousSaved = saved;
    const nextSaved = !previousSaved;
    setSaved(nextSaved);
    toggleStoredItem("saved_posts", post.id, nextSaved);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/save/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Failed to toggle save");
        throw new Error("Failed to toggle save");
      }
    } catch (err) {
      console.error(err);
      setSaved(previousSaved);
      toggleStoredItem("saved_posts", post.id, previousSaved);
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

  const LeftPanel =
    imageList.length > 0 ? (
      <div className="w-1/2 flex-shrink-0 relative overflow-hidden" style={{ backgroundColor: "#000" }} onClick={(e) => e.stopPropagation()}>
        <div ref={imageScrollRef} onScroll={handleImageScroll} className="hide-scrollbar flex w-full h-full overflow-x-scroll overflow-y-hidden snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {imageList.map((img) => {
            const imageUrl = img.image.startsWith("/media/") ? `${API_URL || "http://localhost:8000"}${img.image}` : img.image;
            return (
              <div key={img.id} className="relative w-full h-full flex-shrink-0 snap-center overflow-hidden">
                <div className="absolute inset-0" style={{ backgroundImage: `url("${encodeURI(imageUrl)}")`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", transform: "scale(1.2)" }} />
                <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
                <img src={imageUrl} alt={post.title.replace(/<[^>]*>/g, "")} className="relative z-10 w-full h-full object-contain" />
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
            <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.15)" }}>
              {imageList.map((_, index) => (
                <button key={index} type="button" onClick={(e) => { e.stopPropagation(); scrollToImage(index); }} style={{ width: currentImageIndex === index ? 18 : 8, height: 8, borderRadius: 999, background: currentImageIndex === index ? "#FFF8E2" : "rgba(255,255,255,0.5)" }} />
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-xs" style={{ color: "#8B7355" }}>{post.location || post.region || "Algeria"}</span>
          </div>
          <h3 className="text-base font-bold" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
        </div>
        <PostDetailBadge post={post} />
        <div className="text-sm leading-relaxed flex-1 prose prose-sm max-w-none" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
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
    <>
      <NotificationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="error"
        title="Delete this post?"
        message="This action is permanent and cannot be undone. The post and all its images will be removed."
        primaryAction={{ label: "Delete", onClick: confirmDeletePost }}
        secondaryAction={{ label: "Cancel", onClick: () => setShowDeleteModal(false) }}
      />

      <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative flex w-[900px] max-w-[95vw] max-h-[85vh] rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
          {LeftPanel}

          <div className="w-1/2 flex flex-col" style={{ backgroundColor: "#FFF8E2" }}>
            <div className="flex items-center px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: "#E0D5C5" }}>
              <div className="w-[38px] h-[38px] rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#E0D5C5" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355" stroke="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base" style={{ color: "#432817" }}>{post.user_display_name || post.user_username}</p>
                  <p className="text-[11px]" style={{ color: "#8B7355" }}>{formatDate(post.created_at)}</p>
                </div>
              </div>

              <div className="relative" ref={postMenuRef}>
                <button className="p-1 rounded hover:bg-[#E0D5C5] mr-2" onClick={() => setShowPostMenu(!showPostMenu)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B7355">
                    <circle cx="5" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                  </svg>
                </button>

                {showPostMenu && (
                  <div className="absolute right-0 top-full mt-1 py-2 rounded-lg shadow-lg z-50" style={{ backgroundColor: "#FFF8E2" }}>
                    <button className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap hover:bg-[#F0EAD8]" style={{ color: "#432817" }} onClick={() => { setShowPostMenu(false); router.push(`/edit-post?id=${post.id}`); }}>
                      Edit post
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap hover:bg-[#F0EAD8]" style={{ color: "#C0392B" }} onClick={handleDeletePost}>
                      Delete post
                    </button>
                  </div>
                )}
              </div>

              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#E0D5C5]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto feed-scroll">
              {imageList.length > 0 && (
                <div className="px-5 pt-3 pb-3 border-b" style={{ borderColor: "#E0D5C5" }}>
                  <div className="mb-1">
                    <div className="flex items-center gap-1 mb-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="text-xs" style={{ color: "#8B7355" }}>{post.location || post.region || "Algeria"}</span>
                    </div>
                    <h3 className="text-base font-bold" style={{ color: "#432817" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
                  </div>

                  <PostDetailBadge post={post} />

                  <p className="text-xs leading-relaxed" style={{ color: "#432817" }}>
                    {isContentLong && !contentExpanded ? post.content.slice(0, CONTENT_LIMIT) + "… " : post.content + " "}
                    {isContentLong && (
                      <button className="font-semibold" style={{ color: "#8B6914" }} onClick={() => setContentExpanded(!contentExpanded)}>
                        {contentExpanded ? "See less" : "See more"}
                      </button>
                    )}
                  </p>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag, i) => (
                        <span key={i} className="text-[11px] font-medium" style={{ color: "#A07850" }}>#{tag.toLowerCase().replace(/\s+/g, "_")}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="px-5 py-3 flex flex-col gap-3">
                {MOCK_COMMENTS.map((c) => <CommentItem key={c.id} comment={c} />)}
              </div>
            </div>

            <div className="px-5 py-2 flex items-center justify-between flex-shrink-0 border-t" style={{ borderColor: "#E0D5C5" }}>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-xs transition-all" style={{ color: gemmed ? "#4FC3F7" : "#432817" }} onClick={handleGem}>
                  <GemIcon size={14} filled={gemmed} />
                  {formatCount(gemsCount)}
                </button>
                <span className="flex items-center gap-1 text-xs" style={{ color: "#432817" }}>
                  <CommentIcon size={14} />
                  {formatCount(post.comments_count)}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: "#432817" }}>
                  <AnnotationIcon size={14} />0
                </span>
              </div>
              <button className="transition-all" style={{ color: saved ? "#8B6914" : "#432817" }} onClick={handleSave}>
                <BookmarkIcon size={18} filled={saved} />
              </button>
            </div>

            <div className="px-5 py-3 flex items-center gap-2 flex-shrink-0">
              <input type="text" placeholder="Add a comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 text-xs rounded-xl px-4 py-2.5 outline-none border" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0D5C5", color: "#432817" }} />
              <button className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 hover:opacity-80" style={{ backgroundColor: "#432817" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────────── LEFT SIDEBAR ───────────────── */

function LeftSidebar() {
  const navIcons = [
    { label: "Home", href: "/home-page", path: (<><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><polyline points="9 22 9 12 15 12 15 22" /></>) },
    { label: "Communities", href: "#", path: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>) },
    { label: "Monuments in Danger", href: "#", path: (<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>) },
    { label: "Events", href: "/events", path: (<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>) },
    { label: "Notifications", href: "#", hasBadge: true, path: (<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>) },
    { label: "Profile", href: "/profile", isActive: true, path: (<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>) },
  ];

  return (
    <aside className="fixed left-4 top-4 w-[56px] flex flex-col items-center py-6 z-50 rounded-2xl" style={{ backgroundColor: "#FFF8E2", boxShadow: "0 4px 24px rgba(67,40,23,0.12)" }}>
      <Link href="/home-page" className="mb-6 px-1">
        <img src="/kunuz-icon.svg" alt="Kunuz" width={42} height={42} />
      </Link>
      <nav className="flex flex-col items-center gap-5">
        {navIcons.map((item, i) => (
          <div key={i} className="relative group">
            <Link href={item.href} className={`relative p-2.5 rounded-xl transition-all duration-200 block ${item.isActive ? "bg-[#432817]" : "hover:bg-[#F0E8CC]"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={item.isActive ? "#FFF8E2" : "none"} stroke={item.isActive ? "#FFF8E2" : "#432817"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {item.path}
              </svg>
              {item.hasBadge && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            </Link>
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50" style={{ backgroundColor: "#432817", color: "#FFF8E2" }}>
              {item.label}
            </span>
          </div>
        ))}
        <div className="h-40" />
        <div className="relative group">
          <button className="p-2.5 rounded-xl hover:bg-[#F0E8CC]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
          <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50" style={{ backgroundColor: "#432817", color: "#FFF8E2" }}>
            Help
          </span>
        </div>
      </nav>
    </aside>
  );
}

/* ───────────────── PROFILE HEADER ───────────────── */

function ProfileHeader() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const menuRef = useRef<any>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = ["Change mail", "Change password", "Delete account", "Logout"];

  return (
    <div className="flex flex-col pt-8 pb-6 px-6 relative">
      <div className="absolute top-4 right-6" ref={menuRef}>
        <button className="p-2 rounded hover:bg-[#F0EAD8]" onClick={() => setShowMenu(!showMenu)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 py-2 rounded-lg shadow-lg z-50" style={{ backgroundColor: "#FFF8E2" }}>
            {menuItems.map((item, i) => (
              <button key={i} className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]" style={{ color: "#432817", fontFamily: "var(--font-lato)" }} onClick={() => { setShowMenu(false); if (item === "Logout") setShowLogoutModal(true); if (item === "Delete account") setShowDeleteAccountModal(true); }}>
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <NotificationModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} type="info" title="Are you sure you want to log out?" message="If you continue, you will be redirected to the landing page. You can always log back in anytime." primaryAction={{ label: "Log out", onClick: () => { window.location.href = "/"; } }} secondaryAction={{ label: "Cancel", onClick: () => setShowLogoutModal(false) }} />
      <NotificationModal isOpen={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} type="error" title="Delete your account?" message="This action is permanent and cannot be undone. All your data and posts will be removed." primaryAction={{ label: "Delete Account", onClick: () => { setShowDeleteAccountModal(false); } }} secondaryAction={{ label: "Keep Account", onClick: () => setShowDeleteAccountModal(false) }} />

      <div className="flex items-start gap-8">
        <div className="w-[140px] h-[140px] rounded-full flex-shrink-0 overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(67,40,23,0.15)" }}>
          <img src="/Ellipse 34.jpg" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#432817" }}>User4987838</h1>
          <p className="text-sm mb-4" style={{ color: "#8B7355" }}>@User4987838</p>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-1.5"><span className="font-bold" style={{ color: "#432817" }}>1.6k</span><span className="text-sm" style={{ color: "#8B7355" }}>Posts</span></div>
            <div className="flex items-center gap-1.5"><span className="font-bold" style={{ color: "#432817" }}>1.6k</span><span className="text-sm" style={{ color: "#8B7355" }}>Likes</span></div>
            <div className="flex items-center gap-1.5"><span className="font-bold" style={{ color: "#432817" }}>3</span><span className="text-sm" style={{ color: "#8B7355" }}>Events</span></div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm" style={{ color: "#432817" }}>#Student</span>
            <span className="text-sm" style={{ color: "#432817" }}>#History</span>
            <span className="text-sm" style={{ color: "#432817" }}>#Architecture</span>
          </div>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "#432817" }}>{PROFILE_DATA.bio}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button onClick={() => router.push("/add-post")} className="text-sm font-semibold hover:opacity-90" style={{ backgroundColor: "#432817", color: "#FFF8E2", borderRadius: "8px", width: "400px", height: "40px" }}>
          Add post
        </button>
        <button className="text-sm font-semibold hover:opacity-90" style={{ backgroundColor: "#432817", color: "#FFF8E2", borderRadius: "8px", width: "400px", height: "40px" }}>
          Edit profile
        </button>
      </div>
    </div>
  );
}

/* ───────────────── TABS ───────────────── */

function ProfileTabs({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: string) => void }) {
  const tabs = [
    { id: "grid", icon: <GridIcon size={20} /> },
    { id: "gems", icon: <GemIcon size={20} /> },
    { id: "saved", icon: <BookmarkIcon size={20} /> },
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

function PostGridCard({ post, onClick }: { post: ApiPost; onClick: () => void }) {
  const imageList = post.images ?? [];
  const firstImage = imageList[0];
  const imageUrl = firstImage
    ? firstImage.image.startsWith("/media/") ? `${API_URL || "http://localhost:8000"}${firstImage.image}` : firstImage.image
    : null;

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group" style={{ boxShadow: "0 2px 12px rgba(67,40,23,0.1)" }} onClick={onClick}>
      {imageUrl ? (
        <img src={imageUrl} alt={post.title.replace(/<[^>]*>/g, "")} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center px-3" style={{ background: "linear-gradient(135deg, #e8d9bb, #ded2bc)" }}>
          <div className="text-center text-xs font-semibold leading-snug line-clamp-3" style={{ color: "rgba(0,0,0,0.78)" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5 text-white"><GemIcon size={18} /><span className="font-semibold text-sm">{formatCount(post.gems_count)}</span></div>
        <div className="flex items-center gap-1.5 text-white"><CommentIcon size={18} /><span className="font-semibold text-sm">{formatCount(post.comments_count)}</span></div>
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

/* ───────────────── POSTS GRID ───────────────── */

function PostsGrid({ posts, onPostClick }: { posts: ApiPost[]; onPostClick: (p: ApiPost) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3 px-4 pb-8">
      {posts.map((post) => (
        <PostGridCard key={post.id} post={post} onClick={() => onPostClick(post)} />
      ))}
    </div>
  );
}

/* ───────────────── MAIN PAGE ───────────────── */

export default function ProfilePage() {
  const [loggedInUsername, setLoggedInUsername] = useState("");
  const [activeTab, setActiveTab] = useState("grid");
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);

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

  const updatePostInLists = (postId: string, updater: (post: ApiPost) => ApiPost) => {
    setAllPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
    setGemmedPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
    setSavedPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
    setEventPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
    setAlertPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
    setSelectedPost((prev) => (prev && prev.id === postId ? updater(prev) : prev));
  };

  const deletePostFromLists = (postId: string) => {
    setAllPosts((prev) => prev.filter((p) => p.id !== postId));
    setGemmedPosts((prev) => prev.filter((p) => p.id !== postId));
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
    setEventPosts((prev) => prev.filter((p) => p.id !== postId));
    setAlertPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  useEffect(() => {
    const fetchMe = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setLoggedInUsername(json.data?.username ?? json.username ?? "");
        }
      } catch (err) {
        console.error("Error fetching me:", err);
      }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    const fetchAllPosts = async () => {
      const token = getAuthToken();
      if (!token) return;
      setLoadingPosts(true);
      let url: string | null = `${API_URL}/api/posts/user/me/`;
      const collected: ApiPost[] = [];
      try {
        while (url) {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) break;
          const data = await res.json();
          collected.push(...(data.results ?? []).map(mapPost));
          url = data.next ?? null;
        }
        setAllPosts(collected);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchAllPosts();
  }, []);

  useEffect(() => {
    if (activeTab !== "gems") return;
    const fetch_ = async () => {
      const token = getAuthToken();
      if (!token) return;
      setLoadingGemmed(true);
      try {
        const res = await fetch(`${API_URL}/api/posts/gemed/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setGemmedPosts((data.results ?? data).map(mapPost));
      } catch (err) { console.error(err); }
      finally { setLoadingGemmed(false); }
    };
    fetch_();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "saved") return;
    const fetch_ = async () => {
      const token = getAuthToken();
      if (!token) return;
      setLoadingSaved(true);
      try {
        const res = await fetch(`${API_URL}/api/posts/saved/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setSavedPosts((data.results ?? data).map(mapPost));
      } catch (err) { console.error(err); }
      finally { setLoadingSaved(false); }
    };
    fetch_();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "events") return;
    const fetch_ = async () => {
      const token = getAuthToken();
      if (!token) return;
      setLoadingEvents(true);
      try {
        const res = await fetch(`${API_URL}/api/posts/user/me/events/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setEventPosts((data.results ?? data).map(mapPost));
      } catch (err) { console.error(err); }
      finally { setLoadingEvents(false); }
    };
    fetch_();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "alerts") return;
    const fetch_ = async () => {
      const token = getAuthToken();
      if (!token) return;
      setLoadingAlerts(true);
      try {
        const res = await fetch(`${API_URL}/api/posts/user/me/alerts/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setAlertPosts((data.results ?? data).map(mapPost));
      } catch (err) { console.error(err); }
      finally { setLoadingAlerts(false); }
    };
    fetch_();
  }, [activeTab]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF8E2", fontFamily: "var(--font-lato)" }}>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdatePost={updatePostInLists}
          onDeletePost={deletePostFromLists}
        />
      )}

      <LeftSidebar />

      <main className="pl-[80px] pr-4">
        <div className="max-w-4xl mx-auto">
          <ProfileHeader />
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === "grid" && (loadingPosts ? <Spinner /> : allPosts.length === 0 ? <EmptyState icon={<GridIcon size={48} />} message="No Posts yet" /> : <PostsGrid posts={allPosts} onPostClick={setSelectedPost} />)}
          {activeTab === "gems" && (loadingGemmed ? <Spinner /> : gemmedPosts.length === 0 ? <EmptyState icon={<GemIcon size={48} />} message="Your Treasure is empty" /> : <PostsGrid posts={gemmedPosts} onPostClick={setSelectedPost} />)}
          {activeTab === "saved" && (loadingSaved ? <Spinner /> : savedPosts.length === 0 ? <EmptyState icon={<BookmarkIcon size={48} />} message="Your Collection is empty" /> : <PostsGrid posts={savedPosts} onPostClick={setSelectedPost} />)}
          {activeTab === "events" && (loadingEvents ? <Spinner /> : eventPosts.length === 0 ? <EmptyState icon={<CalendarIcon size={48} />} message="No Events yet" /> : <PostsGrid posts={eventPosts} onPostClick={setSelectedPost} />)}
          {activeTab === "alerts" && (loadingAlerts ? <Spinner /> : alertPosts.length === 0 ? <EmptyState icon={<DangerIcon size={48} />} message="No Monuments in Danger yet" /> : <PostsGrid posts={alertPosts} onPostClick={setSelectedPost} />)}
        </div>
      </main>
    </div>
  );
}