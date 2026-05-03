"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CircleX, Loader2, RefreshCcw, CheckCheck, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocaleSettings } from "@/components/LocaleProvider";


type NotificationItem = {
  id: string;
  recipient_id: string;
  actor_id: string;
  actor_display_name: string;
  actor_username: string;
  actor_profile_picture: string;
  event_type: string;
  event_label: string;
  target_type: string;
  target_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  extra?: { request_id?: string; invitation_id?: string };
};

type NotificationResponse = {
  success: boolean;
  data?: {
    results?: NotificationItem[];
    unread_count?: number;
    next?: string | null;
  };
  unread_count?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";
const NOTIFICATIONS_CACHE_KEY = "kunuz.notifications.cache.v1";
const NOTIFICATIONS_LIMIT = 40;

function readCachedNotifications(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: NotificationItem[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function writeCachedNotifications(items: NotificationItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify({ items, cachedAt: Date.now() }));
  } catch {
    // Storage can be unavailable; the panel still works without cache.
  }
}

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function groupByRecency(items: NotificationItem[]) {
  const today: NotificationItem[] = [];
  const thisMonth: NotificationItem[] = [];
  const older: NotificationItem[] = [];

  const now = Date.now();
  items.forEach((item) => {
    const createdAt = new Date(item.created_at).getTime();
    const diffDays = Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) today.push(item);
    else if (diffDays < 31) thisMonth.push(item);
    else older.push(item);
  });

  return { today, thisMonth, older };
}

function Avatar({ item }: { item: NotificationItem }) {
  const initials = (item.actor_display_name || item.actor_username || "S").slice(0, 1).toUpperCase();
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#D1BFA5] bg-[#EFE4D2] shadow-[0_2px_5px_rgba(45,28,16,0.18)]">
      {item.actor_profile_picture ? (
        <img src={item.actor_profile_picture} alt={item.actor_display_name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[#5E432C]">{initials}</div>
      )}
      {item.is_read === false && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-[#FFF8E2] bg-[#C76B2E]" />}
    </div>
  );
}

function SectionTitle({ title, withDivider = false }: { title: string; withDivider?: boolean }) {
  return (
    <div className={withDivider ? "border-t border-[#9D8564] pt-3" : "pt-1"}>
      <p className="m-0 text-[15px] font-bold text-[#3A2A1D]">{title}</p>
    </div>
  );
}

function NotificationRow({ item, onRead, relativeTimeLabel, someoneLabel }: {
  item: NotificationItem;
  onRead: (id: string) => void;
  relativeTimeLabel: string;
  someoneLabel: string;
}) {
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`notification_responded_${item.id}`) === "true";
  });

  const handleRespond = async (status: "accepted" | "refused", e: React.MouseEvent) => {
    e.stopPropagation();
    setResponding(true);
    try {
      const invitationId = item.extra?.invitation_id ?? item.target_id;
      await fetch(`${API_URL}/api/groups/invitations/${invitationId}/respond/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      setResponded(true);
      localStorage.setItem(`notification_responded_${item.id}`, "true");
      onRead(item.id);
    } catch {
      // silent fail
    } finally {
      setResponding(false);
    }
  };

  const isInvite = item.event_type === "group_invite_received";
  const isJoinRequest = item.event_type === "group_join_request";
  const label = item.event_label || item.message;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRead(item.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onRead(item.id); }}
      className={`flex w-full items-start gap-3.5 rounded-xl px-0 py-2.5 text-left transition-all cursor-pointer hover:bg-[#F3E9D0]/80 ${item.is_read === true ? "opacity-85" : "opacity-100"}`}
    >
      <Avatar item={item} />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[14px] leading-[1.55] text-[#5D5144]">
          <span className="font-bold text-[#432817]">{item.actor_display_name || item.actor_username || someoneLabel}</span>{" "}
          <span>{label}</span>
        </p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-[#82715E]">
          <span>{relativeTimeLabel}</span>
        </div>

        {isInvite && !responded && (
          <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={responding}
              onClick={(e) => handleRespond("accepted", e)}
              className="rounded-full px-3 py-1 text-[11px] font-bold transition-all"
              style={{ backgroundColor: "#432817", color: "#FFF8E2", border: "none", cursor: responding ? "not-allowed" : "pointer", opacity: responding ? 0.6 : 1 }}
            >
              Accept
            </button>
            <button
              type="button"
              disabled={responding}
              onClick={(e) => handleRespond("refused", e)}
              className="rounded-full px-3 py-1 text-[11px] font-bold transition-all"
              style={{ backgroundColor: "transparent", color: "#432817", border: "1px solid #D8C1A3", cursor: responding ? "not-allowed" : "pointer", opacity: responding ? 0.6 : 1 }}
            >
              Decline
            </button>
          </div>
        )}

        {isJoinRequest && !responded && (
          <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={responding}
              onClick={async (e) => {
                e.stopPropagation();
                setResponding(true);
                try {
                  await fetch(
                    `${API_URL}/api/groups/${item.target_id}/requests/${item.extra?.request_id}/review/`,
                    {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ status: "approved" }),
                    }
                  );
                  setResponded(true);
                  localStorage.setItem(`notification_responded_${item.id}`, "true");
                  onRead(item.id);
                } catch { }
                finally { setResponding(false); }
              }}
              className="rounded-full px-3 py-1 text-[11px] font-bold transition-all"
              style={{ backgroundColor: "#432817", color: "#FFF8E2", border: "none", cursor: responding ? "not-allowed" : "pointer", opacity: responding ? 0.6 : 1 }}
            >
              Approve
            </button>
            <button
              type="button"
              disabled={responding}
              onClick={async (e) => {
                e.stopPropagation();
                setResponding(true);
                try {
                  await fetch(
                    `${API_URL}/api/groups/${item.target_id}/requests/${item.extra?.request_id}/review/`,
                    {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ status: "rejected" }),
                    }
                  );
                  setResponded(true);
                  localStorage.setItem(`notification_responded_${item.id}`, "true");
                  onRead(item.id);
                } catch { }
                finally { setResponding(false); }
              }}
              className="rounded-full px-3 py-1 text-[11px] font-bold transition-all"
              style={{ backgroundColor: "transparent", color: "#432817", border: "1px solid #D8C1A3", cursor: responding ? "not-allowed" : "pointer", opacity: responding ? 0.6 : 1 }}
            >
              Reject
            </button>
          </div>
        )}

        {(isInvite || isJoinRequest) && responded && (
          <p className="mt-2 text-[11px] font-semibold" style={{ color: "#8B6914" }}>
            Response sent ✓
          </p>
        )}
      </div>
    </div>
  );
}

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const t = useTranslations("auth.notificationPanel");
  const { locale } = useLocaleSettings();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const rtf = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale]);

  const formatRelativeTime = useCallback((isoDate: string): string => {
    const date = new Date(isoDate);
    const diffSeconds = Math.floor((date.getTime() - Date.now()) / 1000);
    const absSeconds = Math.abs(diffSeconds);

    if (absSeconds < 60) return t("time.justNow");
    if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
    if (absSeconds < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
    return rtf.format(Math.round(diffSeconds / 86400), "day");
  }, [rtf, t]);

  const navigateFromNotification = async (notification: NotificationItem) => {
    const { event_type, target_id } = notification;

    if (event_type === "gem_on_post" || event_type === "repost_on_post") {
      sessionStorage.setItem("highlight_post_id", target_id);
      router.replace("/home-page");
      window.dispatchEvent(new Event("highlight-post"));
      onClose();
    } else if (event_type === "comment_on_post") {
      sessionStorage.setItem("open_post_id", target_id);
      sessionStorage.setItem("open_post_tab", "comments");
      router.replace("/home-page");
      window.dispatchEvent(new Event("highlight-post"));
      onClose();
    } else if (event_type === "reply_to_comment" || event_type === "gem_on_comment") {
      try {
        const res = await fetch(`${API_URL}/api/posts/comments/${target_id}/`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const commentData = data?.data ?? data;
        const postId = typeof commentData?.post === "string"
          ? commentData.post
          : String(commentData?.post?.id ?? commentData?.post?._id ?? "");
        if (postId) {
          sessionStorage.setItem("open_post_id", postId);
          sessionStorage.setItem("open_post_tab", "comments");
          router.replace("/home-page");
          window.dispatchEvent(new Event("highlight-post"));
          onClose();
        }
      } catch { }
    } else if (
      event_type === "group_join_request" ||
      event_type === "group_join_request_approved" ||
      event_type === "group_join_request_rejected" ||
      event_type === "group_invite_received" ||
      event_type === "group_chat_message"
    ) {
      if (event_type === "group_chat_message") {
        router.replace(`/group/${target_id}?tab=chat`);
      } else {
        router.replace(`/group/${target_id}`);
      }
      onClose();
    }
  };

  const fetchNotifications = useCallback(async (url: string | null = `${API_URL}/api/notifications/`, isInitial = true) => {
    if (!url) return;
    const token = getAuthToken();
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    if (!isInitial) setLoadingMore(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [listRes, unreadRes] = await Promise.all(
        isInitial
          ? [
            fetch(url, { headers }),
            fetch(`${API_URL}/api/notifications/unread-count/`, { headers }),
          ]
          : [fetch(url, { headers }), Promise.resolve(null)]
      );

      const listJson = await listRes.json().catch(() => null);
      const unreadJson = unreadRes ? await unreadRes.json().catch(() => null) : null;

      const nextItems = listJson?.data?.results ?? [];
      setNotifications(prev => {
        if (isInitial) return nextItems;
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueItems = nextItems.filter((n: NotificationItem) => !existingIds.has(n.id));
        return [...prev, ...uniqueItems];
      });
      setNextUrl(listJson?.data?.next ?? null);

      if (isInitial) {
        const rawCount = unreadJson?.data?.unread_count ?? unreadJson?.unread_count ?? 0;
        setUnreadCount(Number(rawCount));
        window.dispatchEvent(new CustomEvent("refresh-unread-count", { detail: Number(rawCount) }));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const timer = window.setInterval(() => {
      void fetchNotifications();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && nextUrl) {
          void fetchNotifications(nextUrl, false);
        }
      },
      { threshold: 1.0 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextUrl, loadingMore, fetchNotifications]);

  const markAsRead = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    const notification = notifications.find(n => n.id === id);
    setNotifications((current) => {
      const nextItems = current.map((item) => (item.id === id ? { ...item, is_read: true } : item));
      writeCachedNotifications(nextItems);
      return nextItems;
    });

    try {
      await fetch(`${API_URL}/api/notifications/${id}/read/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      void fetchNotifications();
    } catch {
      void fetchNotifications();
    }

    if (notification) {
      await navigateFromNotification(notification);
    }
  };

  const markAllRead = async () => {
    const token = getAuthToken();
    if (!token) return;
    setNotifications((current) => current.map(item => ({ ...item, is_read: true })));
    try {
      await fetch(`${API_URL}/api/notifications/read-all/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      void fetchNotifications();
    } catch { }
  };

  const { today, thisMonth, older } = groupByRecency(notifications);

  return (
    <div className="notification-panel-overlay fixed inset-0 z-[100] flex justify-start bg-black/60 backdrop-blur-[3px]" onClick={onClose}>
      <div
        className="flex h-full w-[440px] max-w-[94vw] flex-col bg-[#FFF8E2] px-8 py-5 text-[#432817] shadow-[18px_0_45px_rgba(14,9,5,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <h2 className="m-0 text-[18px] font-bold text-[#342417]">{t("title")}</h2>
            {unreadCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-[#8B6A4B] px-2 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={t("actions.close")}
            className="rounded-full p-0.5 text-[#9B8165] transition hover:bg-[#EFE2C6] hover:text-[#432817]"
          >
            <CircleX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex h-full items-center justify-center text-[12px] text-[#8B7355]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-3 py-16 text-center text-[#7F654B]">
              <Bell className="mb-3 h-8 w-8 text-[#C7A981]" />
              <p className="m-0 text-[14px] font-semibold text-[#432817]">{t("empty.title")}</p>
              <p className="mt-2 text-[11px] leading-5 text-[#84694E]">
                {t("empty.description")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#A07850] transition hover:text-[#432817]"
                >
                  {t("actions.markAllRead")}
                </button>
              </div>

              {today.length > 0 && (
                <section className="space-y-2">
                  <SectionTitle title={t("sections.today")} />
                  <div className="space-y-1">
                    {today.map((item) => (
                      <NotificationRow
                        key={item.id}
                        item={item}
                        onRead={markAsRead}
                        relativeTimeLabel={formatRelativeTime(item.created_at)}
                        someoneLabel={t("someone")}
                      />
                    ))}
                  </div>
                </section>
              )}

              {thisMonth.length > 0 && (
                <section className="space-y-2">
                  <SectionTitle title={t("sections.thisMonth")} withDivider />
                  <div className="space-y-1">
                    {thisMonth.map((item) => (
                      <NotificationRow
                        key={item.id}
                        item={item}
                        onRead={markAsRead}
                        relativeTimeLabel={formatRelativeTime(item.created_at)}
                        someoneLabel={t("someone")}
                      />
                    ))}
                  </div>
                </section>
              )}

              {older.length > 0 && (
                <section className="space-y-2 pb-6">
                  <SectionTitle title={t("sections.earlier")} withDivider />
                  <div className="space-y-1">
                    {older.map((item) => (
                      <NotificationRow
                        key={item.id}
                        item={item}
                        onRead={markAsRead}
                        relativeTimeLabel={formatRelativeTime(item.created_at)}
                        someoneLabel={t("someone")}
                      />
                    ))}
                  </div>
                </section>
              )}
              {loadingMore && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-[#8B7355]" /></div>}
              <div ref={sentinelRef} className="h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
