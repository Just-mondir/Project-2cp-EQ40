"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSidebar from "@/components/LeftSidebar";
import GroupHeader from "@/components/GroupHeader";
import GroupeMenu from "@/components/GroupeMenu";
import { useLocaleSettings } from "@/components/LocaleProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
}

function getAuthUser(): { role?: string; is_staff?: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("user_data") || localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function currentUserIsModerator() {
  const user = getAuthUser();
  if (!user) return false;
  const role = String((user as any).role || (user as any).user_role || (user as any).Role || (user as any).group_role || "").toLowerCase();
  return (
    role === "moderator" ||
    role === "admin" ||
    (user as any).is_staff === true ||
    (user as any).is_staff === 1 ||
    (user as any).is_staff === "true" ||
    (user as any).is_admin === true ||
    (user as any).is_admin === 1 ||
    (user as any).is_admin === "true" ||
    (user as any).is_superuser === true ||
    (user as any).is_moderator === true ||
    (user as any).is_moderator === 1
  );
}

function fmtCount(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}

function resolveUrl(src?: string | null) {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return `${API_URL}${src}`;
  return src;
}

function unwrapData<T>(payload: { data?: T } | T): T {
  if (payload && typeof payload === "object" && "data" in payload && payload.data !== undefined) return payload.data;
  return payload as T;
}

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

type AboutDetail = {
  id: string;
  name: string;
  description: string;
  category: string;
  historical_period: string;
  region: string;
  profile_picture?: string;
  banner_image?: string;
  rules?: string;
  member_count: number;
  post_count: number;
  managed_by?: {
    id: string;
    username: string;
    display_name?: string;
    profile_picture?: string | null;
  } | null;
  active_since?: string | null;
};

type Member = {
  id: string;
  username: string;
  display_name: string;
  profile_picture?: string;
  expertise?: string;
  is_admin: boolean;
  role: string;
};

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ padding: "6px 14px 4px" }}>
      <span
        className="localized-container-title"
        style={{
          fontFamily: "Lato, sans-serif",
          fontWeight: 600,
          fontSize: "12px",
          color: "#8B7355",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function tagValue(value?: string) {
  if (!value) return "";
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function aboutTags(about: AboutDetail) {
  return [about.category, about.region, about.historical_period].map(tagValue).filter(Boolean);
}

function localeKey(locale: string) {
  if (locale?.toLowerCase().startsWith("ar")) return "ar";
  if (locale?.toLowerCase().startsWith("fr")) return "fr";
  return "en";
}

function textDirection(locale: string) {
  return localeKey(locale) === "ar" ? "rtl" : "ltr";
}

const ABOUT_TEXT = {
  en: {
    unknownAdmin: "Unknown admin",
    description: "Description",
    noDescription: "No description provided.",
    whatFind: "What You'll Find Here",
    findItems: [
      "Photos of historical landmarks and monuments",
      "Architecture and cultural heritage photography",
      "Stories and historical context behind locations",
      "Photography tips and techniques",
      "Community discussions about heritage preservation",
    ],
    rules: "Rules & Guidelines",
    noRules: "No rules have been added for this group yet.",
    members: "Members",
    membersText: "A growing community of heritage enthusiasts.",
    posts: "Posts",
    postsText: "Photos, stories, and discussions about cultural heritage.",
    tags: "Thematic tags",
    noTags: "No tags specified.",
    managedBy: "Managed By",
    activeSince: "Active since",
    groupNotFound: "Group not found.",
  },
  fr: {
    unknownAdmin: "Admin inconnu",
    description: "Description",
    noDescription: "Aucune description fournie.",
    whatFind: "Ce que vous trouverez ici",
    findItems: [
      "Photos de monuments et sites historiques",
      "Photographie d'architecture et de patrimoine culturel",
      "Histoires et contexte historique des lieux",
      "Conseils et techniques de photographie",
      "Discussions autour de la preservation du patrimoine",
    ],
    rules: "Règles et consignes",
    noRules: "Aucune règle n'a encore été ajoutée pour ce groupe.",
    members: "Membres",
    membersText: "Une communauté grandissante de passionnés du patrimoine.",
    posts: "Publications",
    postsText: "Photos, récits et discussions autour du patrimoine culturel.",
    tags: "Tags thématiques",
    noTags: "Aucun tag spécifié.",
    managedBy: "Géré par",
    activeSince: "Actif depuis",
    groupNotFound: "Groupe introuvable.",
  },
  ar: {
    unknownAdmin: "مشرف غير معروف",
    description: "الوصف",
    noDescription: "لم يتم تقديم وصف.",
    whatFind: "ما ستجده هنا",
    findItems: [
      "صور للمعالم والمواقع التاريخية",
      "تصوير معماري وتراث ثقافي",
      "قصص وسياق تاريخي حول المواقع",
      "نصائح وتقنيات في التصوير",
      "نقاشات مجتمعية حول الحفاظ على التراث",
    ],
    rules: "القواعد والإرشادات",
    noRules: "لم تتم إضافة أي قواعد لهذا المجموعة بعد.",
    members: "الأعضاء",
    membersText: "مجتمع متنام من المهتمين بالتراث.",
    posts: "المنشورات",
    postsText: "صور وقصص ونقاشات حول التراث الثقافي.",
    tags: "الوسوم الموضوعية",
    noTags: "لم يتم تحديد أي وسوم.",
    managedBy: "يديره",
    activeSince: "نشط منذ",
    groupNotFound: "المجموعة غير موجودة.",
  },
} as const;

function AboutInfoPanel({ about, admin, locale }: { about: AboutDetail; admin?: Member; locale: string }) {
  const copy = ABOUT_TEXT[localeKey(locale)];
  const direction = textDirection(locale);
  const manager = about.managed_by;
  const managerName = manager?.display_name || manager?.username || admin?.display_name || admin?.username || copy.unknownAdmin;
  const managerAvatar = resolveUrl(manager?.profile_picture || admin?.profile_picture);
  const tags = aboutTags(about);

  return (
    <div
      style={{
        backgroundColor: "var(--panel-bg, #FFF8E2)",
        borderRadius: "14px",
        padding: "24px 28px",
        width: "100%",
        boxShadow: "0 2px 12px rgba(67,40,23,0.07)",
        direction,
        textAlign: direction === "rtl" ? "right" : "left",
      }}
    >
      <div style={{ borderBottom: "1px solid #D8C8B1", paddingBottom: "12px", marginBottom: "12px" }}>
        <span style={{ fontFamily: "Lato, sans-serif", fontWeight: 700, fontSize: "18px", color: "#432817" }}>
          {about.name}
        </span>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <SectionLabel label={copy.description} />
        <p style={{ margin: "8px 14px 18px", color: "#432817", fontFamily: "Lato, sans-serif", fontSize: "14px", lineHeight: 1.55 }}>
          {about.description || copy.noDescription}
        </p>
      </div>

      <div style={{ borderTop: "1px solid #EDE0CC", margin: "8px 0" }} />

      <div style={{ marginBottom: "8px" }}>
        <SectionLabel label={copy.whatFind} />
        <ul style={{ margin: "8px 14px 18px", paddingInlineStart: "20px", color: "#432817", fontFamily: "Lato, sans-serif", fontSize: "14px", lineHeight: 1.55 }}>
          {copy.findItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <div style={{ borderTop: "1px solid #EDE0CC", margin: "8px 0" }} />

      <div style={{ marginBottom: "8px" }}>
        <SectionLabel label={copy.rules} />
        {about.rules ? (
          <ul style={{ margin: "8px 14px 18px", paddingInlineStart: "20px", color: "#432817", fontFamily: "Lato, sans-serif", fontSize: "14px", lineHeight: 1.55 }}>
            {about.rules.split(/\r?\n/).filter(Boolean).map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: "8px 14px 18px", color: "#8B7355", fontFamily: "Lato, sans-serif", fontSize: "14px", lineHeight: 1.55 }}>
            {copy.noRules}
          </p>
        )}
      </div>

      <div style={{ borderTop: "1px solid #EDE0CC", margin: "8px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", padding: "14px" }}>
        <div>
          <p style={{ margin: 0, color: "#432817", fontFamily: "Lato, sans-serif", fontSize: "14px", fontWeight: 700 }}>
            {fmtCount(about.member_count)} {copy.members}
          </p>
          <p style={{ margin: "6px 0 0", color: "#8B7355", fontFamily: "Lato, sans-serif", fontSize: "13px", lineHeight: 1.45 }}>
            {copy.membersText}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, color: "#432817", fontFamily: "Lato, sans-serif", fontSize: "14px", fontWeight: 700 }}>
            {fmtCount(about.post_count)} {copy.posts}
          </p>
          <p style={{ margin: "6px 0 0", color: "#8B7355", fontFamily: "Lato, sans-serif", fontSize: "13px", lineHeight: 1.45 }}>
            {copy.postsText}
          </p>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #EDE0CC", margin: "8px 0" }} />

      <div style={{ marginBottom: "8px" }}>
        <SectionLabel label={copy.tags} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "8px 14px 18px" }}>
          {tags.length ? tags.map(tag => (
            <span
              key={tag}
              style={{
                padding: "5px 10px",
                borderRadius: "999px",
                backgroundColor: "rgba(67,40,23,0.12)",
                color: "#8B7355",
                fontFamily: "Lato, sans-serif",
                fontWeight: 700,
                fontSize: "11px",
              }}
            >
              #{tag}
            </span>
          )) : (
            <span style={{ color: "#8B7355", fontFamily: "Lato, sans-serif", fontSize: "13px" }}>{copy.noTags}</span>
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #EDE0CC", margin: "8px 0 12px" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "10px 14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <span style={{ color: "#8B7355", fontFamily: "Lato, sans-serif", fontSize: "13px" }}>{copy.managedBy}</span>
          <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", backgroundColor: "#E0D5C5", flexShrink: 0 }}>
            {managerAvatar ? (
              <img src={managerAvatar} alt={managerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : null}
          </div>
          <span style={{ color: "#432817", fontFamily: "Lato, sans-serif", fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {managerName}
          </span>
        </div>
        <span style={{ color: "#8B7355", fontFamily: "Lato, sans-serif", fontSize: "12px", flexShrink: 0 }}>
          {about.active_since ? `${copy.activeSince} ${about.active_since}` : ""}
        </span>
      </div>
    </div>
  );
}

export default function GroupAboutPage() {
  const router = useRouter();
  const params = useParams();
  const { locale } = useLocaleSettings();
  const copy = ABOUT_TEXT[localeKey(locale)];
  const groupId = params?.groupId as string;
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [about, setAbout] = useState<AboutDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "questions" | "chat" | "about" | "my posts">("about");
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<"idle" | "pending" | "member">("idle");

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    const token = getToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    async function loadAboutPage() {
      setLoading(true);
      try {
        const requestInit: RequestInit = Object.keys(headers).length ? { headers } : {};
        const [groupRes, aboutRes, membersRes] = await Promise.all([
          fetch(`${API_URL}/api/groups/${groupId}/`, requestInit),
          fetch(`${API_URL}/api/groups/${groupId}/about/`, requestInit),
          fetch(`${API_URL}/api/groups/${groupId}/members/`, requestInit),
        ]);

        if (!groupRes.ok) throw new Error("Failed to load group.");
        if (!aboutRes.ok) throw new Error("Failed to load group about.");
        if (!membersRes.ok) throw new Error("Failed to load members.");

        const groupPayload = await groupRes.json();
        const aboutPayload = await aboutRes.json();
        const membersPayload = await membersRes.json();
        if (cancelled) return;

        const loadedGroup = unwrapData<GroupDetail>(groupPayload);
        setGroup(loadedGroup);
        setAbout(unwrapData<AboutDetail>(aboutPayload));
        setMembers(Array.isArray((membersPayload as any).data) ? (membersPayload as any).data : []);
        setJoinStatus(loadedGroup.is_member ? "member" : "idle");
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAboutPage();

    return () => {
      cancelled = true;
    };
  }, [groupId]);

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
    } catch (error) {
      console.error(error);
    } finally {
      setJoining(false);
    }
  };

  const handleTabChange = (nextTab: "posts" | "questions" | "chat" | "about" | "my posts") => {
    setTab(nextTab);
    if (nextTab === "about") router.push(`/group/${groupId}/about`);
    else if (nextTab === "posts") router.push(`/group/${groupId}`);
    else router.push(`/group/${groupId}?tab=${nextTab}`);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #D8C8B1", borderTopColor: "#8B6914", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!group || !about) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#8B7355" }}>{copy.groupNotFound}</p>
      </div>
    );
  }

  const adminMember = members.find(member => member.is_admin || String(member.id) === String(group.admin_id));

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
          GroupeMenuComponent={
            <GroupeMenu
              groupId={group.id}
              groupName={group.name}
              isAdmin={group.is_admin}
              isMember={group.is_member}
              isModerator={currentUserIsModerator()}
            />
          }
        />

        <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "24px 40px 48px" }}>
          <AboutInfoPanel about={about} admin={adminMember} locale={locale} />
        </div>
      </main>
    </div>
  );
}
