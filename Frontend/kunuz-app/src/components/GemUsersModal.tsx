"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || process.env.NEXT_PUBLIC_TOKEN || "";
}

function resolveProfilePictureUrl(profilePicture?: string): string {
  const value = String(profilePicture ?? "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  return value;
}

type GemUser = {
  id: string;
  username: string;
  display_name: string;
  profile_picture?: string;
  badge?: string;
  expertise?: string;
};

function UserAvatar({ user }: { user: GemUser }) {
  const imageUrl = resolveProfilePictureUrl(user.profile_picture);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={user.display_name || user.username}
        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "var(--avatar-surface, #E0D5C5)" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-muted, #8B7355)" stroke="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

export function GemUsersModal({
  postId,
  count,
  onClose,
}: {
  postId: string;
  count: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<GemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/api/posts/${postId}/gems/`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.message || body?.detail || "Could not load gem users.");
        }
        const payload = body?.data ?? body;
        const list = payload?.users ?? payload?.results ?? payload ?? [];
        if (!cancelled) setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load gem users.");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ color: "#4FC3F7", backgroundColor: "rgba(67, 40, 23, 0.08)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 13L2 9z" />
                <path d="M2 9h20" />
                <path d="M12 22L6 9l3-6" />
                <path d="M12 22l6-13-3-6" />
              </svg>
            </div>
            <div>
              <p className="m-0 text-sm font-black uppercase tracking-wider" style={{ color: "var(--foreground, #432817)" }}>
                Gems
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
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--border-soft, #E0D5C5)", borderTopColor: "#4FC3F7" }} />
            </div>
          )}
          {!loading && error && <p className="px-2 py-6 text-center text-sm font-semibold text-red-600">{error}</p>}
          {!loading && !error && users.length === 0 && (
            <p className="px-2 py-6 text-center text-sm font-semibold" style={{ color: "var(--text-muted, #8B7355)" }}>
              No diamonds yet.
            </p>
          )}
          {!loading && !error && users.map((user) => (
            <button
              key={user.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-black/5"
              onClick={() => {
                onClose();
                if (user.username) router.push(`/user/${user.username}`);
              }}
            >
              <UserAvatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-bold" style={{ color: "var(--foreground, #432817)" }}>
                  {user.display_name || user.username}
                </p>
                <p className="m-0 truncate text-xs" style={{ color: "var(--text-muted, #8B7355)" }}>
                  @{user.username}
                </p>
              </div>
              {user.badge && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "rgba(79, 195, 247, 0.16)", color: "#0369A1" }}>
                  {user.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LongPressGemButton({
  postId,
  count,
  children,
  className,
  style,
  onGemClick,
}: {
  postId: string;
  count: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onGemClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [showUsers, setShowUsers] = useState(false);
  const longPressedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const startPress = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    longPressedRef.current = false;
    clearTimer();
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      setShowUsers(true);
    }, 600);
  };

  const endPress = () => clearTimer();

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onPointerLeave={endPress}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          clearTimer();
          setShowUsers(true);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (longPressedRef.current) {
            longPressedRef.current = false;
            return;
          }
          onGemClick(e);
        }}
      >
        {children}
      </button>
      {showUsers && <GemUsersModal postId={postId} count={count} onClose={() => setShowUsers(false)} />}
    </>
  );
}
