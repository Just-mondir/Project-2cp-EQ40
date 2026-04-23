"use client";

import React from "react";

/* ─── types (same as page) ─── */
type GroupDetail = {
  id: string;
  name: string;
  description: string;
  category: string;
  historical_period: string;
  region: string;
  profile_picture?: string;
  banner_image?: string;
  admin_id: string;
  member_count: number;
  post_count: number;
  is_member: boolean;
  is_admin: boolean;
  rules?: string;
};

type Member = {
  id: string;
  username: string;
  display_name: string;
  profile_picture?: string;
  is_admin: boolean;
  role: string;
};

/* ─── helpers (same as page) ─── */
function resolveUrl(src?: string): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${src}`;
  return src;
}

function fmtCount(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}

/* ─── props ─── */
type GroupHeaderProps = {
  group: GroupDetail;
  members: Member[];
  joining: boolean;
  joinStatus: "idle" | "pending" | "member";
  onJoin: () => void;
  onInvite?: () => void;
  tab: "posts" | "questions" | "about" | "my posts";
  onTabChange: (t: "posts" | "questions" | "about" | "my posts") => void;
  GroupeMenuComponent: React.ReactNode;
};

export default function GroupHeader({
  group,
  members,
  joining,
  joinStatus,
  onJoin,
  onInvite,
  tab,
  onTabChange,
  GroupeMenuComponent,
}: GroupHeaderProps) {
  const avatarUrl = resolveUrl(group.profile_picture);
  const adminMember = members.find(m => m.is_admin);

  // ← visitors see: posts / questions / about
  // ← members see:  posts / questions / my posts
  const tabs = group.is_member
    ? (["posts", "questions", "my posts"] as const)
    : (["posts", "questions", "about"] as const);

  return (
    <>
      {/* ── Header Banner ── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 280 }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "blur(40px) brightness(0.65) saturate(1.1)", transform: "scale(1.3)" }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2c1a0e 0%, #5a3a1a 100%)" }} />
        )}

        {/* Smooth bottom fade-to-background overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 50%, var(--background) 100%)"
          }}
        />

        {/* Centered Banner Content */}
        <div className="max-w-6xl mx-auto px-10 relative z-10 flex items-center gap-8 pt-16 pb-12">
          <div
            className="flex-shrink-0 rounded-full overflow-hidden"
            style={{ width: 140, height: 140, border: "4px solid rgba(255,255,255,0.25)", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={group.name} className="w-full h-full object-cover" style={{ filter: "blur(0.5px)" }} />
              : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#6B3E26" }}>
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
            }
          </div>
          <div className="flex flex-col min-w-0 text-white">
            <h1
              className="font-bold leading-tight"
              style={{ fontFamily: "var(--font-lato), sans-serif", fontSize: 34, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
            >
              {group.name}
            </h1>
            <div className="flex items-center gap-4 mt-2.5">
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{fmtCount(group.member_count)} members</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 20 }}>·</span>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{fmtCount(group.post_count)} Posts</span>
            </div>
            {adminMember && (
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
                Managed by{" "}
                <span style={{ fontWeight: 700, color: "rgba(255,255,255,1)" }}>
                  {adminMember.display_name || adminMember.username}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="max-w-6xl mx-auto px-10 py-6">
        <h2 className="font-bold mb-3" style={{ fontSize: 20, color: "var(--foreground)" }}>Discription</h2>
        <p className="leading-relaxed opacity-90" style={{ fontSize: 16, color: "var(--text-muted)" }}>{group.description}</p>
      </div>

      {/* ── Tabs + Actions ── */}
      <div
        className="flex items-center px-10 border-b-2 border-transparent sticky top-0 z-10 max-w-6xl mx-auto w-full"
        style={{ backgroundColor: "var(--background)" }}
      >
        {tabs.map(t => (
          <button
            key={t}
            className="mr-14 py-6 font-bold capitalize transition-all relative"
            style={{
              fontFamily: "var(--font-lato), sans-serif",
              fontSize: 22,
              color: tab === t ? "#432817" : "rgba(67, 40, 23, 0.45)",
            }}
            onClick={() => onTabChange(t)}
          >
            {t}
            {tab === t && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[4px] rounded-t-full"
                style={{ backgroundColor: "#432817" }}
              />
            )}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-4 py-4">
       <button
  className="text-lg font-bold px-8 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
  style={{ backgroundColor: "#432817", color: "#e8d9c0", boxShadow: "0 4px 12px rgba(67,40,23,0.2)", opacity: joinStatus === "pending" ? 0.6 : 1 }}
  onClick={group.is_member ? onInvite : onJoin}
  disabled={joining || joinStatus === "pending"}
>
  {group.is_member ? "+ Invite" : joinStatus === "pending" ? "Request sent" : joining ? "Joining..." : "Join"}
</button>
          {GroupeMenuComponent}
        </div>
      </div>
    </>
  );
}
