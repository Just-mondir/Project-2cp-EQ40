"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LeftSidebar from "@/components/LeftSidebar";
import GroupHeader from "@/components/GroupHeader";
import GroupeMenu from "@/components/GroupeMenu";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : ""; }

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

/* ───────────────── DETAILS CONTENT ───────────────── */
function DetailsContent({ group }: { group: GroupDetail }) {
  return (
    <div style={{
      backgroundColor: "var(--panel-bg, #FFF8E2)",
      borderRadius: "14px",
      padding: "24px 28px",
      width: "100%",
      boxShadow: "0 2px 12px rgba(67,40,23,0.07)",
    }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #D8C8B1", paddingBottom: "12px", marginBottom: "16px" }}>
        <span style={{ fontFamily: "Lato, sans-serif", fontWeight: 700, fontSize: "18px", color: "#432817" }}>
          About this group
        </span>
      </div>

      {/* Description */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontFamily: "Lato, sans-serif", fontWeight: 600, fontSize: "14px", color: "#8B7355", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Description
        </h3>
        <p style={{ fontFamily: "Lato, sans-serif", fontSize: "15px", color: "#432817", lineHeight: 1.6 }}>
          {group.description || "No description provided."}
        </p>
      </div>

      {/* Category */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontFamily: "Lato, sans-serif", fontWeight: 600, fontSize: "14px", color: "#8B7355", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Category
        </h3>
        <p style={{ fontFamily: "Lato, sans-serif", fontSize: "15px", color: "#432817" }}>
          {group.category || "Uncategorized"}
        </p>
      </div>

      {/* Historical Period */}
      {group.historical_period && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontFamily: "Lato, sans-serif", fontWeight: 600, fontSize: "14px", color: "#8B7355", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Historical Period
          </h3>
          <p style={{ fontFamily: "Lato, sans-serif", fontSize: "15px", color: "#432817" }}>
            {group.historical_period}
          </p>
        </div>
      )}

      {/* Region */}
      {group.region && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontFamily: "Lato, sans-serif", fontWeight: 600, fontSize: "14px", color: "#8B7355", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Region
          </h3>
          <p style={{ fontFamily: "Lato, sans-serif", fontSize: "15px", color: "#432817" }}>
            {group.region}
          </p>
        </div>
      )}

      {/* Rules */}
      {group.rules && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontFamily: "Lato, sans-serif", fontWeight: 600, fontSize: "14px", color: "#8B7355", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Group Rules
          </h3>
          <p style={{ fontFamily: "Lato, sans-serif", fontSize: "15px", color: "#432817", lineHeight: 1.6 }}>
            {group.rules}
          </p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: "24px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #EDE0CC" }}>
        <div>
          <span style={{ fontFamily: "Lato, sans-serif", fontWeight: 700, fontSize: "18px", color: "#432817" }}>
            {group.member_count}
          </span>
          <span style={{ fontFamily: "Lato, sans-serif", fontSize: "14px", color: "#8B7355", marginLeft: "6px" }}>
            members
          </span>
        </div>
        <div>
          <span style={{ fontFamily: "Lato, sans-serif", fontWeight: 700, fontSize: "18px", color: "#432817" }}>
            {group.post_count}
          </span>
          <span style={{ fontFamily: "Lato, sans-serif", fontSize: "14px", color: "#8B7355", marginLeft: "6px" }}>
            posts
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [tab, setTab] = useState<"posts" | "questions" | "about" | "my posts">("about");
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<"idle" | "pending" | "member">("idle");

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

  /* join handler */
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

  /* tab change handler */
  const handleTabChange = (t: "posts" | "questions" | "about" | "my posts") => {
    setTab(t);
    if (t === "posts") router.push(`/group/${groupId}`);
    else if (t === "questions") router.push(`/group/${groupId}?tab=questions`);
    else if (t === "my posts") router.push(`/group/${groupId}?tab=my-posts`);
    else if (t === "about") router.push(`/group/${groupId}/details`);
  };

  /* invite handler */
  const handleInvite = () => {
    // Could open an invite modal here
    console.log("Invite clicked");
  };

  /* add post handler */
  const handleAddPost = () => {
    router.push(`/group/${groupId}/add-post`);
  };

  /* loading state */
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
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
      <LeftSidebar activePage="communities" />

      <div className="flex flex-col flex-1 overflow-hidden ml-[68px]">
        <GroupHeader
          group={group}
          members={members}
          joining={joining}
          joinStatus={joinStatus}
          onJoin={handleJoin}
          onInvite={handleInvite}
          onAddPost={handleAddPost}
          tab={tab}
          onTabChange={handleTabChange}
          GroupeMenuComponent={
            <GroupeMenu
              groupId={group.id}
              groupName={group.name}
              isAdmin={group.is_admin}
              isMember={group.is_member}
            />
          }
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto px-10 pb-8 max-w-6xl mx-auto w-full">
          {loadingMembers ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#8B7355", fontSize: "14px" }}>
              Loading details...
            </div>
          ) : (
            <DetailsContent group={group} />
          )}
        </div>
      </div>
    </div>
  );
}