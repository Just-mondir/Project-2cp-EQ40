

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import LeftSidebar from "@/components/LeftSidebar";
import DOMPurify from "dompurify";
import { PostCard as GlobalPostCard, PostModal as GlobalPostModal } from "@/components/SharedFeed";
import GroupeMenu from "@/components/GroupeMenu";
import GroupHeader from "@/components/GroupHeader";  // ← ADDED
import JoinRequestSentModal from "@/components/JoinRequestModel";
import InviteUsersModal, { type User } from "@/components/InviteUsersModal";
import GroupAddPostModal from "@/components/GroupAddPostModal";
import { useTranslations } from "next-intl";
import { useLocaleSettings } from "@/components/LocaleProvider";
import { localizeLocationLabel } from "@/components/LocationWorldCard";
import { Copy, Mic, Pause, Pencil, Pin, PinOff, Play, Reply, Square, Trash2, type LucideIcon } from "lucide-react";
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

const GemIcon = ({ className = "", size = 18, filled = false, active = false }: { className?: string; size?: number; filled?: boolean; active?: boolean; strokeWidth?: number }) => (
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
      transform: active ? "scale(1.12)" : "scale(1)",
    }}
  >
    <path d="M6 3h12l4 6-10 13L2 9z" />
    <path d="M2 9h20" />
    <path d="M12 22L6 9l3-6" />
    <path d="M12 22l6-13-3-6" />
  </svg>
);
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

function formatGroupDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
}

function normalizeGroupText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function translateGroupRules(rules: string, t: ReturnType<typeof useTranslations>) {
  const ruleKeys: Record<string, string> = {
    "share content related to roman monuments and archaeology.": "community.rules.shareRoman",
    "include historical context when posting monuments or artifacts.": "community.rules.includeContext",
    "respect accuracy and cite sources when possible.": "community.rules.respectAccuracy",
    "encourage discussion on preservation and restoration.": "community.rules.encourageDiscussion",
    "no off-topic posts or unrelated promotion.": "community.rules.noOffTopic",
  };

  return rules
    .split(/\r?\n/)
    .map((line) => {
      const key = ruleKeys[normalizeGroupText(line)];
      return key ? t(key as any) : line;
    })
    .join("\n");
}

function translateGroupValue(value: string, locale: string, t: ReturnType<typeof useTranslations>) {
  const key = normalizeGroupText(value);
  const translatedByLocale: Record<string, Record<string, string>> = {
    fr: {
      "archaeology": "Archéologie",
      "ancient civilizations": "Civilisations anciennes",
      "historical sites": "Sites historiques",
      "world heritage sites": "Sites du patrimoine mondial",
      "ruins": "Ruines",
      "architectural heritage": "Patrimoine architectural",
      "cultural landmarks": "Monuments culturels",
      "monuments": "Monuments",
      "castles": "Châteaux",
      "fortresses": "Forteresses",
      "religious sites": "Sites religieux",
      "museums": "Musées",
      "palaces": "Palais",
      "temples": "Temples",
      "historic towns": "Villes historiques",
      "prehistoric sites": "Sites préhistoriques",
      "colonial architecture": "Architecture coloniale",
      "monument preservation": "Préservation des monuments",
      "intangible heritage": "Patrimoine immatériel",
      "heritage restoration": "Restauration du patrimoine",
      "cultural experience": "Expérience culturelle",
      "local history": "Histoire locale",
      "prehistory": "Préhistoire",
      "protohistory": "Protohistoire",
      "numidian period": "Période numide",
      "punic (carthaginian) period": "Période punique (carthaginoise)",
      "roman period": "Période romaine",
      "vandal period": "Période vandale",
      "byzantine period": "Période byzantine",
      "early islamic period": "Début de la période islamique",
      "rostamid dynasty": "Dynastie rostémide",
      "zirid dynasty": "Dynastie ziride",
      "hammadid dynasty": "Dynastie hammadide",
      "almohad dynasty": "Dynastie almohade",
      "zayyanid dynasty": "Dynastie zianide",
      "ottoman period": "Période ottomane",
      "french colonization": "Colonisation française",
      "war of independence": "Guerre d'indépendance",
      "independent algeria": "Algérie indépendante",
      "contemporary period": "Période contemporaine",
    },
    ar: {
      "archaeology": "علم الآثار",
      "ancient civilizations": "الحضارات القديمة",
      "historical sites": "المواقع التاريخية",
      "world heritage sites": "مواقع التراث العالمي",
      "ruins": "الآثار",
      "architectural heritage": "التراث المعماري",
      "cultural landmarks": "المعالم الثقافية",
      "monuments": "المعالم",
      "castles": "القلاع",
      "fortresses": "الحصون",
      "religious sites": "المواقع الدينية",
      "museums": "المتاحف",
      "palaces": "القصور",
      "temples": "المعابد",
      "historic towns": "المدن التاريخية",
      "prehistoric sites": "مواقع ما قبل التاريخ",
      "colonial architecture": "العمارة الاستعمارية",
      "monument preservation": "حفظ المعالم",
      "intangible heritage": "التراث اللامادي",
      "heritage restoration": "ترميم التراث",
      "cultural experience": "تجربة ثقافية",
      "local history": "التاريخ المحلي",
      "prehistory": "ما قبل التاريخ",
      "protohistory": "فجر التاريخ",
      "numidian period": "الفترة النوميدية",
      "punic (carthaginian) period": "الفترة البونية (القرطاجية)",
      "roman period": "الفترة الرومانية",
      "vandal period": "الفترة الوندالية",
      "byzantine period": "الفترة البيزنطية",
      "early islamic period": "بداية الفترة الإسلامية",
      "rostamid dynasty": "الدولة الرستمية",
      "zirid dynasty": "الدولة الزيرية",
      "hammadid dynasty": "الدولة الحمادية",
      "almohad dynasty": "الدولة الموحدية",
      "zayyanid dynasty": "الدولة الزيانية",
      "ottoman period": "الفترة العثمانية",
      "french colonization": "الاستعمار الفرنسي",
      "war of independence": "حرب الاستقلال",
      "independent algeria": "الجزائر المستقلة",
      "contemporary period": "الفترة المعاصرة",
    },
  };
  if (locale?.toLowerCase().startsWith("fr")) return translatedByLocale.fr[key] ?? value;
  if (locale?.toLowerCase().startsWith("ar")) return translatedByLocale.ar[key] ?? value;
  const valueKeys: Record<string, string> = {
    "ancient civilizations": "community.values.ancientCivilizations",
    "roman period": "community.values.romanPeriod",
  };
  const messageKey = valueKeys[key];
  return messageKey ? t(messageKey as any) : value;
}

function getTextDirection(locale: string) {
  return locale?.toLowerCase().startsWith("ar") ? "rtl" : "ltr";
}

function groupAboutCopy(locale: string) {
  if (locale?.toLowerCase().startsWith("ar")) {
    return {
      about: "حول المجموعة",
      noDescription: "لم يتم تقديم وصف.",
      rules: "القواعد والإرشادات",
      noRules: "لم تتم إضافة أي قواعد لهذه المجموعة بعد.",
      members: "الأعضاء",
      membersText: "مجتمع متنام من المهتمين بالتراث.",
      posts: "المنشورات",
      postsText: "صور وقصص ونقاشات حول التراث الثقافي.",
      tags: "الوسوم الموضوعية",
      managedBy: "يديره",
      unknownAdmin: "مشرف غير معروف",
      activeSince: "نشط منذ",
    };
  }
  if (locale?.toLowerCase().startsWith("fr")) {
    return {
      about: "À propos",
      noDescription: "Aucune description fournie.",
      rules: "Règles et consignes",
      noRules: "Aucune règle n'a encore été ajoutée pour ce groupe.",
      members: "Membres",
      membersText: "Une communauté grandissante de passionnés du patrimoine.",
      posts: "Publications",
      postsText: "Photos, récits et discussions autour du patrimoine culturel.",
      tags: "Tags thématiques",
      managedBy: "Géré par",
      unknownAdmin: "Admin inconnu",
      activeSince: "Actif depuis",
    };
  }
  return {
    about: "About",
    noDescription: "No description provided.",
    rules: "Rules & Guidelines",
    noRules: "No rules have been added for this group yet.",
    members: "Members",
    membersText: "A growing community of heritage enthusiasts.",
    posts: "Posts",
    postsText: "Photos, stories, and discussions about cultural heritage.",
    tags: "Thematic tags",
    managedBy: "Managed By",
    unknownAdmin: "Unknown admin",
    activeSince: "Active since",
  };
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
  tags?: string[];
  visibility?: string;
  created_at: string;
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

type ChatMessage = {
  id: string;
  user_id: string;
  user_username: string;
  user_display_name: string;
  user_profile_picture?: string;
  text: string;
  image?: string;
  audio?: string;
  reply_to?: {
    id: string;
    user_id: string;
    user_display_name: string;
    text: string;
    image?: string;
    audio?: string;
    is_deleted?: boolean;
  } | null;
  gems_count?: number;
  is_gemmed?: boolean;
  is_pinned?: boolean;
  is_deleted?: boolean;
  edited_at?: string | null;
  created_at: string;
};

type ChatMuteStatus = {
  is_muted: boolean;
  muted_until: string | null;
  muted_forever: boolean;
};

const CHAT_MUTE_OPTIONS: Array<{ value: string; label?: string; labelKey?: "untilChanged" }> = [
  { value: "1h", label: "1h" },
  { value: "8h", label: "8h" },
  { value: "24h", label: "24h" },
  { value: "until_changed", labelKey: "untilChanged" },
];

const CHAT_TEXT = {
  en: {
    mute: "Mute",
    muteActive: "Muted",
    mutedUntil: "Muted until",
    unmute: "Deactivate",
    untilChanged: "Until changed",
    groupChat: "Group chat",
    pinnedMessages: "Pinned messages",
    messageDeleted: "Message deleted",
    replyFallback: "Reply",
    photo: "Photo",
    voice: "Voice message",
    edited: "edited",
    pinned: "pinned",
    reply: "Reply",
    copy: "Copy",
    gem: "Gem",
    removeGem: "Remove gem",
    pin: "Pin",
    unpin: "Unpin",
    edit: "Edit",
    delete: "Delete",
    deleteTitle: "Delete message",
    deleteMessageConfirm: "Are you sure you want to delete this message? This action cannot be undone.",
    cancel: "Cancel",
    report: "Report message",
    reportPrompt: "Why are you reporting this message?",
    reportSent: "Message report sent to the group admin.",
    reportFailed: "Could not report this message.",
    membersOnly: "Members only",
    joinToChat: "Join this group to chat with its members.",
    startConversation: "Start the conversation",
    emptyChat: "Share updates, questions, and photos with the group.",
    editMessage: "Edit message",
    replyTo: "Reply to",
    placeholder: "Message the group...",
    addPhoto: "Add photo",
    recordVoice: "Record voice message",
    stopRecording: "Stop recording",
    pauseRecording: "Pause recording",
    resumeRecording: "Resume recording",
    removeVoice: "Remove voice message",
    recording: "Recording...",
    paused: "Paused",
    sendMessage: "Send message",
  },
  fr: {
    mute: "Sourdine",
    muteActive: "Sourdine active",
    mutedUntil: "Muet jusqu'a",
    unmute: "Desactiver",
    untilChanged: "Jusqu'a modification",
    groupChat: "Chat du groupe",
    pinnedMessages: "Messages epingles",
    messageDeleted: "Message supprime",
    replyFallback: "Reponse",
    photo: "Photo",
    voice: "Message vocal",
    edited: "modifie",
    pinned: "epingle",
    reply: "Repondre",
    copy: "Copier",
    gem: "Gemme",
    removeGem: "Retirer gemme",
    pin: "Epingler",
    unpin: "Retirer epingle",
    edit: "Modifier",
    delete: "Supprimer",
    deleteTitle: "Supprimer le message",
    deleteMessageConfirm: "Es-tu sur de vouloir supprimer ce message ? Cette action est definitive.",
    cancel: "Annuler",
    report: "Signaler le message",
    reportPrompt: "Pourquoi veux-tu signaler ce message ?",
    reportSent: "Le signalement a ete envoye a l'admin du groupe.",
    reportFailed: "Impossible de signaler ce message.",
    membersOnly: "Membres uniquement",
    joinToChat: "Rejoins ce groupe pour discuter avec ses membres.",
    startConversation: "Commencer la conversation",
    emptyChat: "Partage des nouvelles, des questions et des photos avec le groupe.",
    editMessage: "Modifier le message",
    replyTo: "Repondre a",
    placeholder: "Message au groupe...",
    addPhoto: "Ajouter une photo",
    recordVoice: "Enregistrer un message vocal",
    stopRecording: "Arreter l'enregistrement",
    pauseRecording: "Mettre en pause",
    resumeRecording: "Reprendre",
    removeVoice: "Retirer le message vocal",
    recording: "Enregistrement...",
    paused: "En pause",
    sendMessage: "Envoyer le message",
  },
  ar: {
    mute: "كتم",
    muteActive: "تم الكتم",
    mutedUntil: "مكتوم إلى",
    unmute: "إلغاء الكتم",
    untilChanged: "حتى التعديل",
    groupChat: "دردشة المجموعة",
    pinnedMessages: "الرسائل المثبتة",
    messageDeleted: "تم حذف الرسالة",
    replyFallback: "رد",
    photo: "صورة",
    voice: "رسالة صوتية",
    edited: "معدل",
    pinned: "مثبت",
    reply: "رد",
    copy: "نسخ",
    gem: "جوهرة",
    removeGem: "إزالة الجوهرة",
    pin: "تثبيت",
    unpin: "إزالة التثبيت",
    edit: "تعديل",
    delete: "حذف",
    deleteTitle: "حذف الرسالة",
    deleteMessageConfirm: "هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    report: "الإبلاغ عن الرسالة",
    reportPrompt: "لماذا تريد الإبلاغ عن هذه الرسالة؟",
    reportSent: "تم إرسال البلاغ إلى مشرف المجموعة.",
    reportFailed: "تعذر الإبلاغ عن هذه الرسالة.",
    membersOnly: "للأعضاء فقط",
    joinToChat: "انضم إلى هذه المجموعة للدردشة مع أعضائها.",
    startConversation: "ابدأ المحادثة",
    emptyChat: "شارك التحديثات والأسئلة والصور مع المجموعة.",
    editMessage: "تعديل الرسالة",
    replyTo: "رد على",
    placeholder: "اكتب رسالة للمجموعة...",
    addPhoto: "إضافة صورة",
    recordVoice: "تسجيل رسالة صوتية",
    stopRecording: "إيقاف التسجيل",
    removeVoice: "إزالة الرسالة الصوتية",
    recording: "جارٍ التسجيل...",
    sendMessage: "إرسال الرسالة",
  },
};

type ChatText = typeof CHAT_TEXT.en;

function getChatText(locale: string) {
  if (locale?.toLowerCase().startsWith("ar")) return { ...CHAT_TEXT.en, ...CHAT_TEXT.ar };
  if (locale?.toLowerCase().startsWith("fr")) return { ...CHAT_TEXT.en, ...CHAT_TEXT.fr };
  return CHAT_TEXT.en;
}

function formatVoiceDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatChatMuteLabel(status: ChatMuteStatus, text: ChatText, locale: string) {
  if (!status.is_muted) return text.mute;
  if (status.muted_forever) return text.muteActive;
  if (!status.muted_until) return text.muteActive;
  const date = new Date(status.muted_until);
  if (Number.isNaN(date.getTime())) return text.muteActive;
  const dateLocale = locale?.startsWith("ar") ? "ar" : locale?.startsWith("fr") ? "fr-FR" : "en-US";
  return `${text.mutedUntil} ${date.toLocaleString(dateLocale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
}

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

const memberExpertiseStyles: Record<string, { label: string; color: string; background: string; text: string }> = {
  amateur: { label: "Amateur", color: "#C8A96E", background: "#C8A96E", text: "#1a0f00" },
  student: { label: "Student", color: "#5C7A3E", background: "#E3EAD8", text: "#263816" },
  researcher: { label: "Researcher", color: "#4A6FA5", background: "#DDE8F5", text: "#1F3655" },
  historian: { label: "Historian", color: "#8B4513", background: "#EEDCCD", text: "#432817" },
  guide: { label: "Tour Guide", color: "#E07B39", background: "#F8E3D6", text: "#5A2C10" },
  architect: { label: "Architect", color: "#6B5B95", background: "#E8E2F1", text: "#32284F" },
  unknown: { label: "No expertise", color: "#E0D5C5", background: "#F3EEE6", text: "#5B4630" },
};

function normalizeMemberExpertise(value?: string) {
  const normalized = (value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (normalized === "tour guide") return "guide";
  return normalized || "unknown";
}

function getMemberStyle(member: Member) {
  if (member.is_admin) return { label: "Admin", background: "#E8C98B", text: "#3b2314", ring: "linear-gradient(135deg, #E0B86A, #C87945)" };
  const style = memberExpertiseStyles[normalizeMemberExpertise(member.expertise)] ?? memberExpertiseStyles.unknown;
  return { ...style, ring: style.color };
}

function MemberAvatarWithRing({ member, size }: { member: Member; size: number }) {
  const style = getMemberStyle(member);
  return (
    <div className="rounded-full flex-shrink-0 p-[3px]" style={{ background: style.ring }}>
      <Avatar src={member.profile_picture} size={size} />
    </div>
  );
}

function MemberExpertiseBadge({ member }: { member: Member }) {
  const style = getMemberStyle(member);
  return (
    <span className="mt-1 w-fit max-w-full rounded-full px-2 py-0.5 text-[10px] font-bold leading-none truncate" style={{ backgroundColor: style.background, color: style.text }}>
      {style.label}
    </span>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.pages.home");
  const { locale } = useLocaleSettings();
  const textDirection = getTextDirection(locale);
  const textAlign = textDirection === "rtl" ? "right" : "left";
  const requestedTab = searchParams.get("tab");
  const initialTab =
    requestedTab === "posts" ||
      requestedTab === "questions" ||
      requestedTab === "chat" ||
      requestedTab === "about" ||
      requestedTab === "my posts"
      ? requestedTab
      : "posts";

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"posts" | "questions" | "chat" | "about" | "my posts">(initialTab);
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
    if (tab === "about" || tab === "chat") return;
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
  const aboutCopy = groupAboutCopy(locale);

  return (
    <div className="flex min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--background)" }}>
      <LeftSidebar activePage="communities" />
      <div className="flex flex-col flex-1 md:ml-[68px] min-w-0 overflow-x-hidden">
        <div className="flex-1 min-w-0 overflow-x-hidden">

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
          <div className="max-w-6xl mx-auto flex flex-col gap-6 px-4 pt-5 pb-24 items-stretch sm:px-6 lg:flex-row lg:gap-10 lg:px-7 lg:pt-7 lg:pb-8 lg:items-start min-w-0 overflow-x-hidden">

            {/* ─ Left: Posts ─ */}
            <div className="flex-[1.4] min-w-0 overflow-x-hidden">
              {tab === "chat" ? (
                <GroupChatSection group={group} messagesKey={groupId} />
              ) : tab === "about" ? (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "var(--panel-bg)", boxShadow: "0 2px 14px rgba(67,40,23,0.08)" }}
                >
                  <div className="px-5 pt-5 pb-4">
                    <h2 className="localized-container-title font-bold text-[18px]" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                      {aboutCopy.about}
                    </h2>
                  </div>

                  <div className="mx-5 border-b" style={{ borderColor: "var(--border-soft)" }} />

                  <section className="px-5 pt-4 pb-5">
                    <h3 className="localized-container-title mb-3 text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                      {group.name}
                    </h3>
                    <p className="localized-container-text text-sm leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                      {group.description || aboutCopy.noDescription}
                    </p>
                  </section>

                  <div className="mx-5 border-b" style={{ borderColor: "var(--border-soft)" }} />

                  <section className="px-5 pt-4 pb-5">
                    <h3 className="localized-container-title mb-3 text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                      {aboutCopy.rules}
                    </h3>
                    {group.rules ? (
                      <ul className="localized-container-text list-disc space-y-1 pl-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                        {translateGroupRules(group.rules, t)
                          .split(/\r?\n/)
                          .filter(Boolean)
                          .map((rule, index) => (
                            <li key={index}>{rule}</li>
                          ))}
                      </ul>
                    ) : (
                      <p className="localized-container-text text-sm leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                        {aboutCopy.noRules}
                      </p>
                    )}
                  </section>

                  <div className="mx-5 border-b" style={{ borderColor: "var(--border-soft)" }} />

                  <section className="px-5 pt-4 pb-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="localized-container-title text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                          {fmtCount(group.member_count)} {aboutCopy.members}
                        </p>
                        <p className="localized-container-text mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                          {aboutCopy.membersText}
                        </p>
                      </div>
                      <div>
                        <p className="localized-container-title text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                          {fmtCount(group.post_count)} {aboutCopy.posts}
                        </p>
                        <p className="localized-container-text mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                          {aboutCopy.postsText}
                        </p>
                      </div>
                    </div>
                  </section>

                  <div className="mx-5 border-b" style={{ borderColor: "var(--border-soft)" }} />

                  <section className="px-5 pt-4 pb-5">
                    <h3 className="localized-container-title mb-3 text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                      {aboutCopy.tags}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(group.tags?.length ? group.tags : [group.category, group.region, group.historical_period].filter(Boolean))
                        .map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="rounded-full px-3 py-1 text-[11px] font-bold"
                            style={{ backgroundColor: "var(--border-soft)", color: "var(--text-muted)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}
                          >
                            #{tag.toString().replace(/\s+/g, "").toLowerCase()}
                          </span>
                        ))}
                    </div>
                  </section>

                  <div className="mx-5 border-b" style={{ borderColor: "var(--border-soft)" }} />

                  <section className="px-5 pt-4 pb-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="localized-container-title flex-shrink-0 text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                          {aboutCopy.managedBy}
                        </span>
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#E3D9C4]">
                          <img
                            src={resolveUrl(adminMember?.profile_picture)}
                            alt={adminMember?.display_name || adminMember?.username || aboutCopy.unknownAdmin}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="localized-container-text truncate text-sm font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                          {adminMember?.display_name || adminMember?.username || aboutCopy.unknownAdmin}
                        </span>
                      </div>
                      <p className="localized-container-text flex-shrink-0 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
                        {aboutCopy.activeSince} {formatGroupDate(group.created_at)}
                      </p>
                    </div>
                  </section>
                </div>
              ) : (
                <>
                  {posts.length === 0 && !postsLoading && (
                    <div className="flex flex-col items-center py-16">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-soft)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                      <p className="mt-4 font-semibold" style={{ color: "var(--text-muted)" }}>{t("community.noPostsTitle")}</p>
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
                      showAuthorMarkers={false}
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
                    <span className="localized-member-count">{t("community.members", { count: fmtCount(group.member_count) })}</span>
                  </h2>
                  <button
                    className="text-[10px] px-4 py-1 rounded-full font-bold transition-colors"
                    style={{ backgroundColor: "var(--border-soft)", color: "var(--text-muted)", cursor: "pointer" }}
                    onClick={() => router.push(`/group/${groupId}/members`)}>
                    {t("community.viewAll")}
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
                      <span className="localized-container-title text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>{t("community.admin")}</span>
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
                    <span className="localized-container-title text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>{t("community.membersTitle")}</span>
                  </div>
                  {regularMembers.length > 0 ? (
                    regularMembers.slice(0, 20).map(m => <MemberRow key={m.id} member={m} router={router} />)
                  ) : (
                    <div className="flex flex-col items-center py-6">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--border-soft)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <p className="mt-2 text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>{t("community.noMembers")}</p>
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
          isGroupAdmin={group?.is_admin ?? false}
          showAuthorMarkers={false}
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
          excludedUserIds={members.map((member) => member.id)}
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

function GroupChatSection({ group, messagesKey }: { group: GroupDetail; messagesKey: string }) {
  const { locale } = useLocaleSettings();
  const chatText = getChatText(locale);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showMuteMenu, setShowMuteMenu] = useState(false);
  const [muteStatus, setMuteStatus] = useState<ChatMuteStatus>({ is_muted: false, muted_until: null, muted_forever: false });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBottomRef = useRef(true);
  const isChatNearBottomRef = useRef(true);
  const authUser = getAuthUser();
  const canChat = group.is_member || group.is_admin;
  const imagePreview = React.useMemo(() => imageFile ? URL.createObjectURL(imageFile) : "", [imageFile]);
  const audioPreview = React.useMemo(() => audioFile ? URL.createObjectURL(audioFile) : "", [audioFile]);
  const pinnedMessages = messages.filter(message => message.is_pinned && !message.is_deleted);

  const updateMessage = (messageId: string, update: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(message => message.id === messageId ? { ...message, ...update } : message));
  };

  const fetchMessages = useCallback(async (quiet = false) => {
    if (!canChat) return;
    if (!quiet) setLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/groups/${group.id}/chat/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.detail || "Could not load chat.");
      const list = data?.data ?? data ?? [];
      setMessages(Array.isArray(list) ? list : []);
      setError("");
    } catch (err) {
      if (!quiet) setError(err instanceof Error ? err.message : "Could not load chat.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [group.id, canChat]);

  const scrollChatToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const list = chatListRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior });
  }, []);

  const scrollToChatMessage = (messageId?: string) => {
    if (!messageId) return;
    const list = chatListRef.current;
    const element = document.getElementById(`chat-message-${messageId}`);
    if (!list || !element) return;
    list.scrollTo({ top: element.offsetTop - list.offsetTop - 80, behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();
    const interval = window.setInterval(() => fetchMessages(true), 5000);
    return () => window.clearInterval(interval);
  }, [fetchMessages, messagesKey]);

  useEffect(() => {
    if (!canChat) return;
    const token = getToken();
    fetch(`${API_URL}/api/groups/${group.id}/chat/mute/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const status = data?.data ?? data;
        if (status) setMuteStatus(status);
      })
      .catch(() => undefined);
  }, [group.id, canChat]);

  useEffect(() => {
    if (shouldScrollToBottomRef.current || isChatNearBottomRef.current) {
      scrollChatToBottom(shouldScrollToBottomRef.current ? "smooth" : "auto");
      shouldScrollToBottomRef.current = false;
    }
  }, [messages.length, scrollChatToBottom]);

  useEffect(() => {
    if (!recording || recordingPaused) return;
    const timer = window.setInterval(() => setRecordingSeconds(seconds => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording, recordingPaused]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (audioPreview) URL.revokeObjectURL(audioPreview);
    };
  }, [audioPreview]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const sendMessage = async () => {
    if (!canChat || sending) return;
    if (editingMessage && !messageText.trim()) return;
    if (!messageText.trim() && !imageFile && !audioFile) return;
    setSending(true);
    setError("");
    const token = getToken();
    const formData = new FormData();
    formData.append("text", messageText.trim());
    if (replyTo) formData.append("reply_to", replyTo.id);
    if (imageFile) formData.append("image", imageFile);
    if (audioFile) formData.append("audio", audioFile);

    try {
      const res = editingMessage
        ? await fetch(`${API_URL}/api/groups/${group.id}/chat/${editingMessage.id}/`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text: messageText.trim() }),
        })
        : await fetch(`${API_URL}/api/groups/${group.id}/chat/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.detail || "Could not send message.");
      const created = data?.data ?? data;
      if (editingMessage) {
        updateMessage(editingMessage.id, created);
      } else {
        shouldScrollToBottomRef.current = true;
        setMessages(prev => [...prev, created]);
      }
      setMessageText("");
      setImageFile(null);
      setAudioFile(null);
      setRecordingSeconds(0);
      setRecordingPaused(false);
      setReplyTo(null);
      setEditingMessage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const copyMessage = async (message: ChatMessage) => {
    const value = message.text.trim();
    if (!value) return;
    await navigator.clipboard?.writeText(value);
    setOpenMenuId(null);
  };

  const startVoiceRecording = async () => {
    if (editingMessage || recording || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      audioStreamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const extension = mimeType.includes("mp4") ? "m4a" : "webm";
        if (blob.size > 0) setAudioFile(new File([blob], `voice-message.${extension}`, { type: mimeType }));
        stream.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        setRecordingPaused(false);
      };
      recorder.start();
      setAudioFile(null);
      setRecordingSeconds(0);
      setRecordingPaused(false);
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start voice recording.");
    }
  };

  const togglePauseVoiceRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      setRecordingPaused(true);
    } else if (recorder.state === "paused") {
      recorder.resume();
      setRecordingPaused(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const startReply = (message: ChatMessage) => {
    setReplyTo(message);
    setEditingMessage(null);
    setOpenMenuId(null);
  };

  const startEdit = (message: ChatMessage) => {
    setEditingMessage(message);
    setReplyTo(null);
    setMessageText(message.text);
    setOpenMenuId(null);
  };

  const deleteMessage = async (message: ChatMessage) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/groups/${group.id}/chat/${message.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Could not delete message.");
      updateMessage(message.id, data?.data ?? { is_deleted: true, text: "", image: "" });
      setOpenMenuId(null);
      setMessageToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete message.");
    }
  };

  const requestDeleteMessage = (message: ChatMessage) => {
    setOpenMenuId(null);
    setMessageToDelete(message);
  };

  const toggleGemMessage = async (message: ChatMessage) => {
    const token = getToken();
    const nextGemmed = !message.is_gemmed;
    const nextCount = Math.max(0, (message.gems_count ?? 0) + (nextGemmed ? 1 : -1));
    updateMessage(message.id, { is_gemmed: nextGemmed, gems_count: nextCount });
    try {
      const res = await fetch(`${API_URL}/api/groups/${group.id}/chat/${message.id}/gem/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Could not gem message.");
      updateMessage(message.id, {
        is_gemmed: Boolean(data?.data?.liked),
        gems_count: Number(data?.data?.gems_count ?? nextCount),
      });
    } catch (err) {
      updateMessage(message.id, { is_gemmed: message.is_gemmed, gems_count: message.gems_count });
      setError(err instanceof Error ? err.message : "Could not gem message.");
    }
  };

  const togglePinMessage = async (message: ChatMessage) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/groups/${group.id}/chat/${message.id}/pin/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Could not pin message.");
      updateMessage(message.id, data?.data ?? {});
      setOpenMenuId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pin message.");
    }
  };

  const reportMessage = async (message: ChatMessage) => {
    const reason = window.prompt(chatText.reportPrompt);
    if (!reason?.trim()) {
      setOpenMenuId(null);
      return;
    }
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/groups/${group.id}/chat/${message.id}/report/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || chatText.reportFailed);
      window.alert(chatText.reportSent);
      setOpenMenuId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : chatText.reportFailed);
    }
  };

  const setMuteDuration = async (duration: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/groups/${group.id}/chat/mute/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ duration }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Could not update mute setting.");
      setMuteStatus(data?.data ?? { is_muted: false, muted_until: null, muted_forever: false });
      setShowMuteMenu(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update mute setting.");
    }
  };

  if (!canChat) {
    return (
      <div className="rounded-2xl px-6 py-12 text-center" style={{ backgroundColor: "var(--panel-bg)", color: "var(--text-muted)" }}>
        <p className="font-bold" style={{ color: "var(--foreground)" }}>{chatText.membersOnly}</p>
        <p className="mt-2 text-sm">{chatText.joinToChat}</p>
      </div>
    );
  }

  return (
    <section
      className="relative flex h-[620px] flex-col overflow-hidden rounded-2xl"
      style={{ backgroundColor: "var(--panel-bg)", boxShadow: "0 2px 14px rgba(67,40,23,0.08)" }}
      onClick={() => {
        if (openMenuId) setOpenMenuId(null);
      }}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border-soft)" }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "var(--border-soft)", color: "var(--foreground)" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="m-0 text-base font-black" style={{ color: "var(--foreground)" }}>{group.name}</h2>
          <p className="m-0 text-xs" style={{ color: "var(--text-muted)" }}>{chatText.groupChat}</p>
        </div>
        <div className="relative ml-auto">
          <button
            type="button"
            className="flex max-w-[210px] items-center gap-2 rounded-full px-3 py-2 text-xs font-black transition-colors hover:opacity-85"
            style={{ backgroundColor: muteStatus.is_muted ? "var(--foreground)" : "var(--border-soft)", color: muteStatus.is_muted ? "var(--background)" : "var(--foreground)" }}
            onClick={() => setShowMuteMenu(prev => !prev)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {muteStatus.is_muted ? (
                <>
                  <path d="M11 5 6 9H2v6h4l5 4z" />
                  <path d="m23 9-6 6" />
                  <path d="m17 9 6 6" />
                </>
              ) : (
                <>
                  <path d="M11 5 6 9H2v6h4l5 4z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </>
              )}
            </svg>
            <span className="truncate">{formatChatMuteLabel(muteStatus, chatText, locale)}</span>
          </button>
          {showMuteMenu && (
            <div className="absolute right-0 top-full z-[80] mt-2 w-52 overflow-hidden rounded-xl py-1 shadow-xl" style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-soft)" }}>
              {muteStatus.is_muted && <ChatAction label={chatText.unmute} onClick={() => setMuteDuration("off")} />}
              {CHAT_MUTE_OPTIONS.map(option => (
                <ChatAction key={option.value} label={option.labelKey ? chatText[option.labelKey] : option.label ?? option.value} onClick={() => setMuteDuration(option.value)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {pinnedMessages.length > 0 && (
        <div className="border-b px-5 py-3" style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--background)" }}>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 4 5 5-4 4 1 6-2 2-6-6-4 4-2-2 4-4-6-6 2-2 6 1z" />
            </svg>
            {chatText.pinnedMessages}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pinnedMessages.map(message => (
              <button
                key={message.id}
                className="min-w-[180px] max-w-[230px] rounded-xl px-3 py-2 text-left"
                style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-soft)" }}
                onClick={() => scrollToChatMessage(message.id)}
              >
                <p className="m-0 truncate text-[11px] font-bold" style={{ color: "var(--foreground)" }}>
                  {message.user_display_name || message.user_username}
                </p>
                <p className="m-0 mt-1 line-clamp-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {message.text || (message.audio ? chatText.voice : chatText.photo)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={chatListRef}
        className="flex-1 overflow-y-auto px-5 py-4"
        onScroll={(event) => {
          const target = event.currentTarget;
          isChatNearBottomRef.current = target.scrollHeight - target.scrollTop - target.clientHeight < 120;
        }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--border-soft)", borderTopColor: "#8B6914" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--border-soft)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            </svg>
            <p className="mt-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>{chatText.startConversation}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{chatText.emptyChat}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              const isMine = authUser?.id && String(authUser.id) === String(message.user_id);
              const canDeleteMessage = Boolean(isMine || group.is_admin);
              if (message.is_deleted) {
                return (
                  <div key={message.id} id={`chat-message-${message.id}`} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className="rounded-2xl px-3 py-2 text-xs italic" style={{ backgroundColor: "var(--border-soft)", color: "var(--text-muted)" }}>
                      {chatText.messageDeleted}
                    </div>
                  </div>
                );
              }
              return (
                <div key={message.id} id={`chat-message-${message.id}`} className={`group/message relative flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                  {!isMine && <Avatar src={message.user_profile_picture} size={34} />}
                  <div className={`max-w-[76%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                    {!isMine && (
                      <span className="mb-1 px-1 text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
                        {message.user_display_name || message.user_username}
                      </span>
                    )}
                    <div
                      className="rounded-2xl px-3.5 py-2"
                      style={{
                        backgroundColor: isMine ? "var(--foreground)" : "var(--border-soft)",
                        color: isMine ? "var(--background)" : "var(--foreground)",
                        borderTopRightRadius: isMine ? 4 : 16,
                        borderTopLeftRadius: isMine ? 16 : 4,
                      }}
                    >
                      {message.reply_to && (
                        <button
                          type="button"
                          className="mb-2 block w-full rounded-xl border-l-4 px-3 py-2 text-left"
                          style={{
                            backgroundColor: isMine ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.05)",
                            borderColor: isMine ? "var(--background)" : "var(--foreground)",
                          }}
                          onClick={() => scrollToChatMessage(message.reply_to?.id)}
                        >
                          <span className="block truncate text-[11px] font-black opacity-80">
                            {message.reply_to.user_display_name || chatText.replyFallback}
                          </span>
                          <span className="block truncate text-xs opacity-75">
                            {message.reply_to.is_deleted ? chatText.messageDeleted : message.reply_to.text || (message.reply_to.audio ? chatText.voice : chatText.photo)}
                          </span>
                        </button>
                      )}
                      {message.image && (
                        <img
                          src={resolveUrl(message.image)}
                          alt=""
                          className="mb-2 max-h-[260px] w-full rounded-xl object-cover"
                        />
                      )}
                      {message.audio && (
                        <audio
                          controls
                          src={resolveUrl(message.audio)}
                          className="mt-1 block w-[240px] max-w-full"
                        >
                          {chatText.voice}
                        </audio>
                      )}
                      {message.text && <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>}
                    </div>
                    <div className={`relative mt-1 flex items-center gap-2 px-1 text-[10px] ${isMine ? "justify-end" : "justify-start"}`} style={{ color: "var(--text-muted)" }}>
                      <span>{new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      {message.edited_at && <span>{chatText.edited}</span>}
                      {message.is_pinned && <span>{chatText.pinned}</span>}
                      <button
                        type="button"
                        className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full opacity-55 transition hover:opacity-100"
                        style={{ backgroundColor: "transparent", color: "var(--text-muted)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === message.id ? null : message.id);
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="19" cy="12" r="1.8" />
                        </svg>
                      </button>
                      {openMenuId === message.id && (
                        <div
                          className={`absolute top-6 z-[90] w-36 overflow-hidden rounded-lg py-1.5 shadow-2xl ${isMine ? "right-0" : "left-0"}`}
                          style={{ backgroundColor: "var(--panel-bg)", border: "1px solid rgba(255,255,255,0.12)" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChatAction icon={GemIcon} active={message.is_gemmed} label={message.is_gemmed ? chatText.removeGem : chatText.gem} onClick={() => { toggleGemMessage(message); setOpenMenuId(null); }} />
                          <ChatAction icon={Reply} label={chatText.reply} onClick={() => startReply(message)} />
                          {message.text.trim() && <ChatAction icon={Copy} label={chatText.copy} onClick={() => copyMessage(message)} />}
                          <ChatAction icon={message.is_pinned ? PinOff : Pin} label={message.is_pinned ? chatText.unpin : chatText.pin} onClick={() => togglePinMessage(message)} />
                          {isMine && <ChatAction icon={Pencil} label={chatText.edit} onClick={() => startEdit(message)} />}
                          {canDeleteMessage && <ChatAction icon={Trash2} danger label={chatText.delete} onClick={() => requestDeleteMessage(message)} />}
                        </div>
                      )}
                      {(message.gems_count ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <GemIcon size={10} filled={message.is_gemmed} active={message.is_gemmed} />
                          {message.gems_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="mx-5 mb-2 text-xs font-semibold text-red-500">{error}</p>}

      {imagePreview && (
        <div className="mx-5 mb-3 flex items-center gap-3 rounded-xl p-2" style={{ backgroundColor: "var(--border-soft)" }}>
          <img src={imagePreview} alt="" className="h-14 w-14 rounded-lg object-cover" />
          <span className="min-w-0 flex-1 truncate text-xs font-bold" style={{ color: "var(--foreground)" }}>
            {imageFile?.name}
          </span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: "var(--foreground)" }}
            onClick={() => {
              setImageFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}

      {(recording || audioPreview) && (
        <div className="mx-5 mb-3 flex items-center gap-3 rounded-xl p-2" style={{ backgroundColor: "var(--border-soft)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "var(--panel-bg)", color: "var(--foreground)" }}>
            <Mic size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-bold" style={{ color: "var(--foreground)" }}>
              {recording ? (recordingPaused ? chatText.paused : chatText.recording) : chatText.voice}
              <span className="ml-2 font-black tabular-nums" style={{ color: "var(--text-muted)" }}>
                {formatVoiceDuration(recordingSeconds)}
              </span>
            </p>
            {audioPreview && <audio controls src={audioPreview} className="mt-1 block w-full max-w-[280px]" />}
          </div>
          {recording && (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--panel-bg)", color: "var(--foreground)" }}
              onClick={togglePauseVoiceRecording}
              aria-label={recordingPaused ? chatText.resumeRecording : chatText.pauseRecording}
            >
              {recordingPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}
            </button>
          )}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: "var(--foreground)" }}
            onClick={() => {
              if (recording) stopVoiceRecording();
              else {
                setAudioFile(null);
                setRecordingSeconds(0);
              }
            }}
            aria-label={recording ? chatText.stopRecording : chatText.removeVoice}
          >
            {recording ? <Square size={15} fill="currentColor" /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            )}
          </button>
        </div>
      )}

      {(replyTo || editingMessage) && (
        <div className="mx-5 mb-3 flex items-center gap-3 rounded-xl px-3 py-2" style={{ backgroundColor: "var(--border-soft)" }}>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[11px] font-black uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
              {editingMessage ? chatText.editMessage : `${chatText.replyTo} ${replyTo?.user_display_name || replyTo?.user_username}`}
            </p>
            <p className="m-0 truncate text-xs" style={{ color: "var(--text-muted)" }}>
              {editingMessage?.text || replyTo?.text || (replyTo?.audio ? chatText.voice : chatText.photo)}
            </p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: "var(--foreground)" }}
            onClick={() => {
              setReplyTo(null);
              setEditingMessage(null);
              if (editingMessage) setMessageText("");
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border-soft)" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-80"
          style={{ backgroundColor: "var(--border-soft)", color: "var(--foreground)" }}
          onClick={() => fileInputRef.current?.click()}
          disabled={Boolean(editingMessage) || recording}
          aria-label={chatText.addPhoto}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <button
          type="button"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-80"
          style={{ backgroundColor: recording ? "#EB5757" : "var(--border-soft)", color: recording ? "#fff" : "var(--foreground)" }}
          onClick={recording ? stopVoiceRecording : startVoiceRecording}
          disabled={Boolean(editingMessage)}
          aria-label={recording ? chatText.stopRecording : chatText.recordVoice}
        >
          {recording ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
        </button>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={chatText.placeholder}
          rows={1}
          className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none"
          style={{ backgroundColor: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border-soft)" }}
        />
        <button
          type="button"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
          onClick={sendMessage}
          disabled={sending || recording || (editingMessage ? !messageText.trim() : (!messageText.trim() && !imageFile && !audioFile))}
          aria-label={chatText.sendMessage}
        >
          {sending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--background)", borderTopColor: "transparent" }} />
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4Z" />
            </svg>
          )}
        </button>
      </div>
      {messageToDelete && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[380px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="h-1.5 bg-[#EB5757]" />
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100"
              onClick={() => setMessageToDelete(null)}
              aria-label={chatText.cancel}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <div className="flex flex-col items-center px-7 py-8 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#EB575740] text-[#EB5757]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <h2 className="mb-2 text-[20px] font-bold leading-tight text-[#432817]">{chatText.deleteTitle}</h2>
              <p className="mb-7 max-w-[290px] text-[14px] leading-relaxed text-[#8B7355]">{chatText.deleteMessageConfirm}</p>
              <div className="flex w-full max-w-[200px] flex-col gap-3">
                <button
                  type="button"
                  className="w-full rounded-lg bg-black py-3 text-[15px] font-bold text-white transition-all hover:bg-black/90 active:scale-[0.98]"
                  onClick={() => {
                    if (messageToDelete) void deleteMessage(messageToDelete);
                  }}
                >
                  {chatText.delete}
                </button>
                <button
                  type="button"
                  className="w-full bg-transparent py-2 text-[15px] font-semibold text-[#432817] transition-all hover:opacity-70"
                  onClick={() => setMessageToDelete(null)}
                >
                  {chatText.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type ChatActionIcon = LucideIcon | typeof GemIcon;

function ChatAction({ label, onClick, icon: Icon, active = false, danger = false }: { label: string; onClick: () => void; icon?: ChatActionIcon; active?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-semibold leading-none transition-colors hover:bg-black/5"
      style={{ color: danger ? "#ef4444" : "var(--foreground)" }}
      onClick={onClick}
    >
      {Icon === GemIcon ? (
        <GemIcon size={14} filled={active} active={active} className="flex-shrink-0" />
      ) : (
        Icon && <Icon size={14} strokeWidth={2.2} className="flex-shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

function MemberRow({ member, router }: { member: Member; router: ReturnType<typeof useRouter> }) {
  const t = useTranslations("auth.pages.home");
  return (
    <div
      className="flex items-start sm:items-center gap-3 sm:gap-4 py-3 px-2 rounded-xl transition-colors cursor-pointer"
      style={{ backgroundColor: "transparent" }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      onClick={() => router.push(`/user/${member.username}`)}
    >
      <MemberAvatarWithRing member={member} size={46} />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-bold text-[13px] truncate leading-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
          {member.display_name || member.username}
        </span>
        <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>@{member.username}</span>
        <div className="mt-2 sm:mt-1 flex items-center justify-between gap-2">
          <MemberExpertiseBadge member={member} />
          <button
            className="sm:hidden text-[10px] px-3 py-1 rounded-full font-bold flex-shrink-0 transition-colors"
            style={{ backgroundColor: "var(--border-soft)", color: "var(--foreground)" }}
            onClick={e => { e.stopPropagation(); router.push(`/user/${member.username}`); }}
          >
            {t("community.viewProfile")}
          </button>
        </div>
      </div>
      <button
        className="hidden sm:block text-[10px] px-3 py-1 rounded-full font-bold flex-shrink-0 transition-colors"
        style={{ backgroundColor: "var(--border-soft)", color: "var(--foreground)" }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--panel-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--border-soft)'; }}
        onClick={e => { e.stopPropagation(); router.push(`/user/${member.username}`); }}
      >
        {t("community.viewProfile")}
      </button>

    </div>
  );
}

