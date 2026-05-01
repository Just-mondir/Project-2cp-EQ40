"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const PLATFORM_BROWN = "#432817";
const PLATFORM_BEIGE = "#F6EAD2";
const PLATFORM_BROWN_MUTED = "#8B7355";
const PLATFORM_BEIGE_MUTED = "#BFAF96";

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function formatCount(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}

function resolveProfilePictureUrl(profilePicture?: string): string {
  const value = String(profilePicture ?? "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  return value;
}

function useIsDarkTheme() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const syncTheme = () => setIsDarkTheme(root.dataset.theme === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return isDarkTheme;
}

function RepostIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? "2.45" : "2.05"}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: "stroke-width 0.18s" }}
    >
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a3 3 0 0 1 3-3h15" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
      {active && <path d="m9 12.5 2.1 2.1L15.5 10" strokeWidth="2.35" />}
    </svg>
  );
}

type RepostUser = {
  id: string;
  username: string;
  display_name: string;
  profile_picture?: string;
  badge?: string;
};

function RepostUsersModal({
  postId,
  count,
  activeColor,
  onClose,
}: {
  postId: string;
  count: number;
  activeColor: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<RepostUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/api/posts/${postId}/reposts/users/`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || body?.detail || "Could not load repost users.");
        const payload = body?.data ?? body;
        const list = payload?.users ?? payload?.results ?? payload ?? [];
        if (!cancelled) setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load repost users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="relative z-[121] w-full max-w-[390px] overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: "var(--panel-bg, #FFF8E2)", border: "1px solid var(--border-soft, #E0D5C5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft, #E0D5C5)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ color: activeColor, backgroundColor: "rgba(67, 40, 23, 0.08)" }}>
              <RepostIcon size={18} active />
            </div>
            <div>
              <p className="m-0 text-sm font-black uppercase tracking-wider" style={{ color: "var(--foreground, #432817)" }}>
                Reposts
              </p>
              <p className="m-0 text-xs" style={{ color: "var(--text-muted, #8B7355)" }}>
                {count} member{count === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            style={{ color: "var(--foreground, #432817)" }}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--border-soft, #E0D5C5)", borderTopColor: activeColor }} />
            </div>
          )}
          {!loading && error && <p className="px-2 py-6 text-center text-sm font-semibold text-red-600">{error}</p>}
          {!loading && !error && users.length === 0 && (
            <p className="px-2 py-6 text-center text-sm font-semibold" style={{ color: "var(--text-muted, #8B7355)" }}>
              No reposts yet.
            </p>
          )}
          {!loading && !error && users.map((user) => {
            const imageUrl = resolveProfilePictureUrl(user.profile_picture);
            return (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-black/5"
                onClick={() => {
                  onClose();
                  if (user.username) router.push(`/user/${user.username}`);
                }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={user.display_name || user.username} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "var(--avatar-surface, #E0D5C5)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-muted, #8B7355)" stroke="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm font-bold" style={{ color: "var(--foreground, #432817)" }}>
                    {user.display_name || user.username}
                  </p>
                  <p className="m-0 truncate text-xs" style={{ color: "var(--text-muted, #8B7355)" }}>
                    @{user.username}
                  </p>
                </div>
                {user.badge && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "rgba(67, 40, 23, 0.12)", color: activeColor }}>
                    {user.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function RepostButton({
  postId,
  initialReposted = false,
  initialCount = 0,
  className = "flex items-center gap-1.5 text-xs transition-colors hover:text-[#5C7A3E] cursor-pointer",
  style,
  showCount = true,
  iconSize = 18,
  onChange,
}: {
  postId: string;
  initialReposted?: boolean;
  initialCount?: number;
  className?: string;
  style?: React.CSSProperties;
  showCount?: boolean;
  iconSize?: number;
  onChange?: (update: { reposted: boolean; repostsCount: number }) => void;
}) {
  const [reposted, setReposted] = useState(initialReposted);
  const [count, setCount] = useState(initialCount);
  const [showUsers, setShowUsers] = useState(false);
  const longPressedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDarkTheme = useIsDarkTheme();
  const activeColor = isDarkTheme ? PLATFORM_BEIGE : PLATFORM_BROWN;
  const inactiveColor = isDarkTheme ? PLATFORM_BEIGE_MUTED : PLATFORM_BROWN_MUTED;

  const clearPressTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const startPress = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    longPressedRef.current = false;
    clearPressTimer();
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      setShowUsers(true);
    }, 600);
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    const previousReposted = reposted;
    const previousCount = count;
    const nextReposted = !previousReposted;
    const nextCount = nextReposted ? previousCount + 1 : Math.max(previousCount - 1, 0);

    setReposted(nextReposted);
    setCount(nextCount);
    onChange?.({ reposted: nextReposted, repostsCount: nextCount });

    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/repost/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error("Failed to toggle repost");
      const serverReposted = Boolean(data?.data?.reposted ?? nextReposted);
      const serverCount = Number(data?.data?.reposts_count ?? nextCount);
      setReposted(serverReposted);
      setCount(serverCount);
      onChange?.({ reposted: serverReposted, repostsCount: serverCount });
    } catch {
      setReposted(previousReposted);
      setCount(previousCount);
      onChange?.({ reposted: previousReposted, repostsCount: previousCount });
    }
  };

  return (
    <>
      <button
        className={className}
        style={{
          ...style,
          color: reposted ? activeColor : style?.color ?? inactiveColor,
          opacity: 1,
          fontWeight: reposted ? 800 : style?.fontWeight,
          transition: "color 0.18s",
        }}
        onPointerDown={startPress}
        onPointerUp={clearPressTimer}
        onPointerCancel={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          clearPressTimer();
          setShowUsers(true);
        }}
        onClick={handleClick}
        title={reposted ? "Remove repost" : "Repost"}
        aria-label={reposted ? "Remove repost" : "Repost this post"}
      >
        <RepostIcon size={iconSize} active={reposted} />
        {showCount && <span>{formatCount(count)}</span>}
      </button>
      {showUsers && <RepostUsersModal postId={postId} count={count} activeColor={activeColor} onClose={() => setShowUsers(false)} />}
    </>
  );
}

export { RepostIcon };
