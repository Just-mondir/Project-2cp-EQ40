"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LeftSidebar from "@/components/LeftSidebar";
import GroupHeader from "@/components/GroupHeader";
import { useTranslations } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : ""; }
function fmtCount(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}

/* ───────────────── TYPES ───────────────── */
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

/* ───────────────── AVATAR ───────────────── */
function MemberAvatar({ member, size = 42 }: { member: Member; size?: number }) {
  if (member.profile_picture) {
    return (
      <img
        src={member.profile_picture}
        alt={member.display_name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      backgroundColor: "#E0D5C5", display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="#8B7355" stroke="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

/* ───────────────── MEMBER ROW ───────────────── */
function MemberRow({
  member,
  currentUserIsAdmin,
  onViewProfile,
  onRemove,
  removing,
}: {
  member: Member;
  currentUserIsAdmin: boolean;
  onViewProfile: (username: string) => void;
  onRemove?: (id: string) => void;
  removing?: string | null;
}) {
  const t = useTranslations("auth.pages.home");
  const isBeingRemoved = removing === member.id;

  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      borderRadius: "10px",
      backgroundColor: "var(--panel-bg, #FFF8E2)",
      transition: "background 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F5EDD8")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--panel-bg, #FFF8E2)")}
    >
      {/* Left: avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <MemberAvatar member={member} size={42} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontFamily: "Lato, sans-serif", fontWeight: 700, fontSize: "14px", color: "#432817" }}>
            {member.display_name || member.username}
          </span>
          <span style={{ fontFamily: "Lato, sans-serif", fontWeight: 400, fontSize: "12px", color: "#8B7355" }}>
            @{member.username}
          </span>
        </div>
      </div>

      {/* Right: buttons */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => onViewProfile(member.username)}
          style={{
            height: "30px", padding: "0 12px",
            backgroundColor: "rgba(67,40,23,0.12)", border: "none",
            borderRadius: "8px", fontFamily: "Lato, sans-serif",
            fontWeight: 600, fontSize: "12px", color: "#432817",
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          {t("community.viewProfile")}
        </button>

       {currentUserIsAdmin && !member.is_admin && onRemove && (
  <button
    onClick={() => onRemove(member.id)}
    disabled={isBeingRemoved}
    style={{
      height: "30px", padding: "0 12px",
      backgroundColor: isBeingRemoved ? "rgba(67,40,23,0.06)" : "rgba(67,40,23,0.12)",
      border: "none", borderRadius: "8px",
      fontFamily: "Lato, sans-serif", fontWeight: 600,
      fontSize: "12px", color: isBeingRemoved ? "#aaa" : "#432817",
      cursor: isBeingRemoved ? "not-allowed" : "pointer",
      whiteSpace: "nowrap",
    }}
  >
    {isBeingRemoved ? t("community.removing") : t("community.remove")}
  </button>
)}
      </div>
    </div>
  );
}

/* ───────────────── SECTION LABEL ───────────────── */
function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px 4px" }}>
      {icon}
      <span className="localized-container-title" style={{ fontFamily: "Lato, sans-serif", fontWeight: 600, fontSize: "12px", color: "#8B7355", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </span>
    </div>
  );
}

/* ───────────────── MEMBERS LIST ───────────────── */
function MembersList({
  members,
  totalCount,
  currentUserIsAdmin,
  onViewProfile,
  onRemove,
  removing,
  loading,
}: {
  members: Member[];
  totalCount: number;
  currentUserIsAdmin: boolean;
  onViewProfile: (username: string) => void;
  onRemove?: (id: string) => void;
  removing?: string | null;
  loading: boolean;
}) {
  const t = useTranslations("auth.pages.home");
  const adminMember = members.find(m => m.is_admin);
  const regularMembers = members.filter(m => !m.is_admin);

  return (
    <div style={{
  backgroundColor: "var(--panel-bg, #FFF8E2)",
  borderRadius: "14px",
  padding: "24px 28px",
  width: "100%",
  boxShadow: "0 2px 12px rgba(67,40,23,0.07)",
}}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #D8C8B1", paddingBottom: "12px", marginBottom: "12px" }}>
        <span style={{ fontFamily: "Lato, sans-serif", fontWeight: 700, fontSize: "18px", color: "#432817" }}>
          <span className="localized-member-count">{t("community.members", { count: fmtCount(totalCount) })}</span>
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#8B7355", fontSize: "14px" }}>
          {t("community.loadingMembers")}
        </div>
      ) : (
        <>
          {/* Admin */}
          {adminMember && (
            <div style={{ marginBottom: "8px" }}>
              <SectionLabel
                label={t("community.admin")}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  </svg>
                }
              />
              <MemberRow
                member={adminMember}
                currentUserIsAdmin={false}
                onViewProfile={onViewProfile}
                removing={removing}
              />
            </div>
          )}

          {/* Divider */}
          {adminMember && regularMembers.length > 0 && (
            <div style={{ borderTop: "1px solid #EDE0CC", margin: "8px 0" }} />
          )}

          {/* Regular members */}
          {regularMembers.length > 0 && (
            <div>
              <SectionLabel
                label={t("community.membersTitle")}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {regularMembers.map(member => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    currentUserIsAdmin={currentUserIsAdmin}
                    onViewProfile={onViewProfile}
                    onRemove={onRemove}
                    removing={removing}
                  />
                ))}
              </div>
            </div>
          )}

          {members.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#8B7355", fontSize: "14px" }}>
              {t("community.noMembers")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
function RemoveMemberModal({
  member,
  onConfirm,
  onCancel,
  removing,
}: {
  member: Member;
  onConfirm: () => void;
  onCancel: () => void;
  removing: boolean;
}) {
  const FONT = "var(--font-lato), 'Lato', sans-serif";
  const RED = "#C0392B";

  return (
    <>
      <div
        onClick={onCancel}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 200 }}
      />
      <div
        style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onCancel}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#FFF8E2",
            borderRadius: "20px",
            padding: "36px 32px 28px",
            width: "400px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            fontFamily: FONT,
          }}
        >
          {/* Icon */}
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            border: `1.5px solid ${RED}`,
            backgroundColor: "rgba(192,57,43,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "16px",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="18" y1="8" x2="23" y2="13" />
              <line x1="23" y1="8" x2="18" y2="13" />
            </svg>
          </div>

          {/* Title */}
          <p style={{ margin: "0 0 6px", color: "#432817", fontFamily: FONT, fontWeight: 700, fontSize: "22px", textAlign: "center" }}>
            Remove member?
          </p>

          {/* Subtitle */}
          <p style={{ margin: "0 0 24px", color: "#8B7355", fontFamily: FONT, fontWeight: 400, fontSize: "14px", textAlign: "center", lineHeight: 1.5 }}>
            Are you sure you want to remove<br />
            <span style={{ fontWeight: 700, color: "#432817" }}>
              {member.display_name || member.username}
            </span>{" "}
            from this group?
          </p>

          {/* Confirm button */}
          <button
            onClick={onConfirm}
            disabled={removing}
            style={{
              width: "100%", height: "50px", borderRadius: "10px", border: "none",
              backgroundColor: removing ? "rgba(192,57,43,0.5)" : RED,
              color: "#FFFFFF", fontFamily: FONT, fontWeight: 700, fontSize: "16px",
              cursor: removing ? "not-allowed" : "pointer",
              transition: "background 0.18s", marginTop: "6px",
            }}
            onMouseEnter={(e) => { if (!removing) e.currentTarget.style.backgroundColor = "#a93226"; }}
            onMouseLeave={(e) => { if (!removing) e.currentTarget.style.backgroundColor = RED; }}
          >
            {removing ? "Removing…" : "Remove"}
          </button>

          {/* Cancel button */}
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#432817", fontFamily: FONT, fontWeight: 600,
              fontSize: "15px", marginTop: "12px", opacity: 0.75,
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
/* ───────────────── MAIN PAGE ───────────────── */
export default function GroupMembersPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [tab, setTab] = useState<"posts" | "questions" | "about" | "my posts">("posts");
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<"idle" | "pending" | "member">("idle");
  const [removing, setRemoving] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  /* fetch group */
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
        setJoinStatus(g.is_member ? "member" : "idle");
      })
      .catch(console.error)
      .finally(() => setLoadingGroup(false));
  }, [groupId]);

  /* fetch members */
  useEffect(() => {
    if (!groupId) return;
    const token = getToken();
    setLoadingMembers(true);
    fetch(`${API_URL}/api/groups/${groupId}/members/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => setMembers(Array.isArray(data.data) ? data.data : []))
      .catch(console.error)
      .finally(() => setLoadingMembers(false));
  }, [groupId]);

  /* remove member */
  const handleRemove = async () => {
  if (!groupId || !memberToRemove) return;
  setRemoving(memberToRemove.id);
  const token = getToken();
  try {
    const res = await fetch(`${API_URL}/api/groups/${groupId}/members/${memberToRemove.id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
      if (group) setGroup(prev => prev ? { ...prev, member_count: prev.member_count - 1 } : prev);
    }
  } catch (e) { console.error(e); }
  finally {
    setRemoving(null);
    setMemberToRemove(null);
  }
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
      if (res.ok || res.status === 201) setJoinStatus("pending");
    } catch (e) { console.error(e); }
    finally { setJoining(false); }
  };

  const handleTabChange = (t: "posts" | "questions" | "about" | "my posts") => {
    setTab(t);
    if (t !== "posts") router.push(`/group/${groupId}?tab=${t}`);
    else router.push(`/group/${groupId}`);
  };

  if (loadingGroup) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #D8C8B1", borderTopColor: "#8B6914", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!group) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#8B7355" }}>Group not found.</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", fontFamily: "Lato, sans-serif" }}>
      <LeftSidebar activePage="communities" />

      <main style={{ paddingLeft: "68px" }}>
        <GroupHeader
          group={group}
          members={members}
          joining={joining}
          joinStatus={joinStatus}
          onJoin={handleJoin}
          tab={tab}
          onTabChange={handleTabChange}
          GroupeMenuComponent={<div />}
        />

        <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "24px 40px 48px" }}>
          <MembersList
            members={members}
            totalCount={group.member_count}
            currentUserIsAdmin={group.is_admin}
            onViewProfile={(username) => router.push(`/user/${username}`)}
            onRemove={group.is_admin ? (id) => {
  const m = members.find(m => m.id === id);
  if (m) setMemberToRemove(m);
} : undefined}
            removing={removing}
            loading={loadingMembers}
          />
        </div>
      </main>
      {memberToRemove && (
  <RemoveMemberModal
    member={memberToRemove}
    onConfirm={handleRemove}
    onCancel={() => setMemberToRemove(null)}
    removing={!!removing}
  />
)}
    </div>
  );
}
