

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSidebar from "@/components/LeftSidebar";
import DOMPurify from "dompurify";
import { PostCard as GlobalPostCard, PostModal as GlobalPostModal } from "@/components/SharedFeed";
import GroupeMenu from "@/components/GroupeMenu";
import GroupHeader from "@/components/GroupHeader";  // ← ADDED
import JoinRequestSentModal from "@/components/JoinRequestModel";
import InviteUsersModal, { type User } from "@/components/InviteUsersModal";
import GroupAddPostModal from "@/components/GroupAddPostModal";
const API_URL = "http://127.0.0.1:8000";

/* ─── helpers ─── */
function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}
function getAuthUser(): { id?: string; username?: string; role?: string; is_staff?: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("user_data") || localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function resolveUrl(src?: string): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return `${API_URL}${src}`;
  return src;
}
function sanitize(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br", "p", "span", "ul", "ol", "li"] });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}
function fmtCount(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}

/* ─── types ─── */
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
type Post = {
  id: string;
  title: string;
  content: string;
  user_username?: string;
  user_display_name?: string;
  user_profile_picture?: string;
  created_at: string;
  gems_count: number;
  comments_count: number;
  images?: { id: string; image: string }[];
  location?: string;
  region?: string;
};

/* ─── Avatar ─── */
function Avatar({ src, size }: { src?: string; size: number }) {
  const url = resolveUrl(src);
  if (url) return <img src={url} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, backgroundColor: "var(--border-soft)" }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="var(--text-muted)" stroke="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"posts" | "questions" | "about" | "my posts">("posts");
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<"idle" | "pending" | "member">("idle");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedPostTab, setSelectedPostTab] = useState<"comments" | "annotations">("comments");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* fetch group details */
  useEffect(() => {
    if (!groupId) return;
    const token = getToken();
    fetch(`${API_URL}/api/groups/${groupId}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        const g = data.data ?? data;
        setGroup(g);
        setJoinStatus(prev => {
          if (prev === "pending") return "pending"; // don't override pending
          return g.is_member ? "member" : "idle";
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const token = getToken();
    fetch(`${API_URL}/api/groups/${groupId}/members/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => setMembers(Array.isArray(data.data) ? data.data : []))
      .catch(console.error);
  }, [groupId]);


  /* fetch posts */
  const fetchPosts = useCallback(async (url: string, append = false) => {
    setPostsLoading(true);
    const token = getToken();
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const results = data.data?.results ?? data.results ?? [];
      const next = data.data?.next ?? data.next ?? null;
      setPosts(prev => {
        if (!append) return results;
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNew = results.filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setNextUrl(next);
    } catch (e) { console.error(e); }
    finally { setPostsLoading(false); }
  }, []);

  useEffect(() => {
    if (!groupId) return;
    if (tab === "about") return;
    const base = tab === "questions"
      ? `${API_URL}/api/groups/${groupId}/questions/`
      : tab === "my posts"
        ? `${API_URL}/api/groups/${groupId}/my-posts/`
        : `${API_URL}/api/groups/${groupId}/posts/`;
    setPosts([]);
    fetchPosts(base);
  }, [groupId, tab, fetchPosts]);

  /* infinite scroll */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextUrl && !postsLoading) fetchPosts(nextUrl, true);
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [nextUrl, postsLoading, fetchPosts]);
  const handleInvite = async (users: User[]) => {
    if (!group || users.length === 0) return;
    const token = getToken();
    await Promise.allSettled(
      users.map(u =>
        fetch(`${API_URL}/api/groups/${group.id}/invite/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ recipient_id: u.id }),
        })
      )
    );
  };

  const handleJoin = async () => {
    if (!group || joining) return;
    setJoining(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/groups/${group.id}/join/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok || res.status === 201) {
        setJoinStatus("pending");
        setGroup(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : prev);
        setShowJoinModal(true);
      }
    } catch (e) { console.error(e); }
    finally { setJoining(false); }
  };
  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--border-soft)", borderTopColor: "#8B6914" }} />
    </div>
  );

  if (!group) return (
    <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
      <p style={{ color: "var(--text-muted)" }}>Group not found.</p>
    </div>
  );

  const adminMember = members.find(m => m.is_admin);
  const regularMembers = members.filter(m => !m.is_admin);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <LeftSidebar activePage="communities" />
      <div className="flex flex-col flex-1 ml-[68px]">
        <div className="flex-1">

          {/* ── GROUP HEADER COMPONENT ── */}
          <GroupHeader
            group={group}
            members={members}
            joining={joining}
            joinStatus={joinStatus}
            onJoin={handleJoin}
            onInvite={() => setShowInviteModal(true)}
            onAddPost={() => setShowAddPost(true)}
            tab={tab}
            onTabChange={setTab}
            GroupeMenuComponent={
              <GroupeMenu
                groupId={group.id}
                groupName={group.name}
                isAdmin={group.is_admin}
                isMember={group.is_member}
                isModerator={(() => {
                  const user = getAuthUser();
                  if (!user) return false;
                  const role = String(user.role || (user as any).user_role || (user as any).Role || (user as any).group_role || "").toLowerCase();
                  const isStaff = (user as any).is_staff === true || (user as any).is_staff === 1 || (user as any).is_staff === "true" ||
                    (user as any).is_admin === true || (user as any).is_admin === 1 || (user as any).is_admin === "true" ||
                    (user as any).is_superuser === true || (user as any).is_moderator === true || (user as any).is_moderator === 1;
                  return role === "moderator" || role === "admin" || isStaff;
                })()}
              />
            }
          />

          {/* ══ TWO-COLUMN AREA ══ */}
          <div className="max-w-6xl mx-auto flex gap-10 px-7 pt-7 pb-8 items-start">

            {/* ─ Left: Posts ─ */}
            <div className="flex-[1.4] min-w-0">
              {tab === "about" ? (
                <div className="max-w-xl">
                  {group.rules && (
                    <div className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: "var(--panel-bg)", boxShadow: "0 1px 6px rgba(67,40,23,0.06)" }}>
                      <h3 className="font-bold mb-2 text-sm" style={{ color: "var(--foreground)" }}>Group Rules</h3>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-muted)" }}>{group.rules}</p>
                    </div>
                  )}
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--panel-bg)", boxShadow: "0 1px 6px rgba(67,40,23,0.06)" }}>
                    <h3 className="font-bold mb-3 text-sm" style={{ color: "var(--foreground)" }}>Details</h3>
                    {[
                      { label: "Category", value: group.category },
                      { label: "Region", value: group.region },
                      { label: "Period", value: group.historical_period },
                    ].filter(d => d.value).map(d => (
                      <div key={d.label} className="flex justify-between py-2 border-b last:border-0 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                        <span style={{ color: "var(--text-muted)" }}>{d.label}</span>
                        <span className="font-semibold" style={{ color: "var(--foreground)" }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {posts.length === 0 && !postsLoading && (
                    <div className="flex flex-col items-center py-16">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-soft)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                      <p className="mt-4 font-semibold" style={{ color: "var(--text-muted)" }}>No posts yet</p>
                    </div>
                  )}
                  {posts.map((post, idx) => (
                    <GlobalPostCard
                      key={`${post.id}-${idx}`}
                      post={post as any}
                      isNew={false}
                      groupDetails={group}
                      onCommentClick={() => { setSelectedPost(post); setSelectedPostTab("comments"); }}
                      onAnnotationClick={() => { setSelectedPost(post); setSelectedPostTab("annotations"); }}
                      interaction={{
                        gemmed: (post as any).is_gemmed || false,
                        gemsCount: post.gems_count,
                        saved: (post as any).is_saved || false,
                        reposted: (post as any).is_reposted || false,
                        repostsCount: (post as any).reposts_count || 0,
                        commentsCount: post.comments_count,
                        annotationsCount: (post as any).accepted_annotations_count || 0
                      }}
                      onInteractionChange={(update) => {
                        setPosts(prev => prev.map(p => p.id === post.id ? {
                          ...p,
                          ...update,
                          is_gemmed: update.gemmed ?? (p as any).is_gemmed,
                          gems_count: update.gemsCount ?? p.gems_count,
                          is_reposted: update.reposted ?? (p as any).is_reposted,
                          reposts_count: update.repostsCount ?? (p as any).reposts_count,
                          comments_count: update.commentsCount ?? p.comments_count,
                        } : p));
                      }}
                      onDelete={(postId) => {
                        setPosts(prev => prev.filter(p => p.id !== postId));
                      }}
                    />
                  ))}
                  {postsLoading && (
                    <div className="flex justify-center py-6">
                      <div className="w-7 h-7 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "var(--border-soft)", borderTopColor: "#8B6914" }} />
                    </div>
                  )}
                  <div ref={sentinelRef} className="h-4" />
                </>
              )}
            </div>


            <div className="flex-1 min-w-[320px] max-w-[380px] hidden lg:block sticky top-[60px]">
              <div
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: "var(--panel-bg)", boxShadow: "0 2px 14px rgba(67,40,23,0.08)" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <h2 className="font-bold text-[18px]" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                    {fmtCount(group.member_count)} Members
                  </h2>
                  <button
                    className="text-[10px] px-4 py-1 rounded-full font-bold transition-colors"
                    style={{ backgroundColor: "var(--border-soft)", color: "var(--text-muted)", cursor: "pointer" }}
                    onClick={() => router.push(`/group/${groupId}/members`)}>
                    View all
                  </button>
                </div>

                <div className="mx-5 border-b" style={{ borderColor: "var(--border-soft)" }} />

                {/* Admin */}
                {adminMember && (
                  <div className="px-5 pt-4 pb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      </svg>
                      <span className="text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>Admin</span>
                    </div>
                    <MemberRow member={adminMember} router={router} />
                  </div>
                )}

                <div className="mx-5 border-b" style={{ borderColor: "var(--border-soft)" }} />

                {/* Members */}
                <div className="px-5 pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>Members</span>
                  </div>
                  {regularMembers.length > 0 ? (
                    regularMembers.slice(0, 20).map(m => <MemberRow key={m.id} member={m} router={router} />)
                  ) : (
                    <div className="flex flex-col items-center py-6">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--border-soft)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <p className="mt-2 text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>No members</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedPost && (
        <GlobalPostModal
          post={selectedPost as any}
          onClose={() => setSelectedPost(null)}
          initialTab={selectedPostTab}
          interaction={{
            gemmed: selectedPost.is_gemmed || false,
            gemsCount: selectedPost.gems_count,
            saved: selectedPost.is_saved || false,
            reposted: selectedPost.is_reposted || false,
            repostsCount: selectedPost.reposts_count || 0,
            commentsCount: selectedPost.comments_count,
            annotationsCount: selectedPost.accepted_annotations_count || 0
          }}
          onInteractionChange={(update) => {
            setPosts(prev => prev.map(p => p.id === selectedPost.id ? {
              ...p,
              ...update,
              is_gemmed: update.gemmed ?? (p as any).is_gemmed,
              gems_count: update.gemsCount ?? p.gems_count,
              is_reposted: update.reposted ?? (p as any).is_reposted,
              reposts_count: update.repostsCount ?? (p as any).reposts_count,
              comments_count: update.commentsCount ?? p.comments_count,
            } : p));
            setSelectedPost((prev: any) => prev ? {
              ...prev,
              ...update,
              is_gemmed: update.gemmed ?? prev.is_gemmed,
              gems_count: update.gemsCount ?? prev.gems_count,
              is_reposted: update.reposted ?? prev.is_reposted,
              reposts_count: update.repostsCount ?? prev.reposts_count,
              comments_count: update.commentsCount ?? prev.comments_count,
            } : null);
          }}
          onDelete={(postId) => {
            setPosts(prev => prev.filter(p => p.id !== postId));
          }}
        />
      )}
      {showJoinModal && (
        <JoinRequestSentModal onClose={() => setShowJoinModal(false)} />
      )}
      {showInviteModal && (
        <InviteUsersModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onConfirm={handleInvite}
        />
      )}
      {showAddPost && (
        <GroupAddPostModal
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowAddPost(false)}
          onSuccess={() => {
            setShowAddPost(false);
            fetchPosts(`${API_URL}/api/groups/${groupId}/posts/`);
          }}
        />
      )}
    </div>
  );
}

function MemberRow({ member, router }: { member: Member; router: ReturnType<typeof useRouter> }) {
  return (
    <div
      className="flex items-center gap-4 py-3 px-2 rounded-xl transition-colors cursor-pointer"
      style={{ backgroundColor: "transparent" }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      onClick={() => router.push(`/user/${member.username}`)}
    >
      <Avatar src={member.profile_picture} size={46} />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-bold text-[13px] truncate leading-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
          {member.display_name || member.username}
        </span>
        <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>@{member.username}</span>
      </div>
      <button
        className="text-[10px] px-3 py-1 rounded-full font-bold flex-shrink-0 transition-colors"
        style={{ backgroundColor: "var(--border-soft)", color: "var(--text-muted)" }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#d5c9b5'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--border-soft)'; }}
        onClick={e => { e.stopPropagation(); router.push(`/user/${member.username}`); }}
      >
        View profile
      </button>

    </div>
  );
}

