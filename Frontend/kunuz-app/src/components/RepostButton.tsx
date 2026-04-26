"use client";

import React, { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function formatCount(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}

function RepostIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a3 3 0 0 1 3-3h15" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
    </svg>
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

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <button
      className={className}
      style={{ ...style, color: reposted ? "#5C7A3E" : style?.color ?? "var(--foreground)" }}
      onClick={handleClick}
      title={reposted ? "Remove repost" : "Repost"}
      aria-label={reposted ? "Remove repost" : "Repost this post"}
    >
      <RepostIcon size={iconSize} active={reposted} />
      {showCount && <span>{formatCount(count)}</span>}
    </button>
  );
}

export { RepostIcon };
