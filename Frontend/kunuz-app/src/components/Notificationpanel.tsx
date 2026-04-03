"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CircleX, Loader2, RefreshCcw, CheckCheck } from "lucide-react";

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
};

type NotificationResponse = {
  success: boolean;
  data?: {
    results?: NotificationItem[];
    unread_count?: number;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function groupByRecency(items: NotificationItem[]) {
  const today: NotificationItem[] = [];
  const thisWeek: NotificationItem[] = [];
  const older: NotificationItem[] = [];

  const now = Date.now();
  items.forEach((item) => {
    const createdAt = new Date(item.created_at).getTime();
    const diffDays = Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) today.push(item);
    else if (diffDays < 7) thisWeek.push(item);
    else older.push(item);
  });

  return { today, thisWeek, older };
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} d ago`;
}

function Avatar({ item }: { item: NotificationItem }) {
  const initials = (item.actor_display_name || item.actor_username || "S").slice(0, 1).toUpperCase();
  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#D4C4AE] bg-[#EFE4D2] shadow-sm">
      {item.actor_profile_picture ? (
        <img src={item.actor_profile_picture} alt={item.actor_display_name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#5E432C]">{initials}</div>
      )}
      {!item.is_read && <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-[#FFF8E2] bg-[#C76B2E]" />}
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="m-0 text-[12px] font-bold uppercase tracking-[0.18em] text-[#8A6A4B]">{title}</p>
      <span className="text-[11px] text-[#A88767]">{count}</span>
    </div>
  );
}

function NotificationRow({ item, onRead }: { item: NotificationItem; onRead: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onRead(item.id)}
      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${item.is_read ? "border-[#E4D8C8] bg-white/70" : "border-[#D8C1A3] bg-[#FFF8E2] shadow-[0_6px_18px_rgba(67,40,23,0.06)]"}`}
    >
      <Avatar item={item} />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[14px] leading-6 text-[#2F2319]">
          <span className="font-bold text-[#432817]">{item.actor_display_name || item.actor_username || "Someone"}</span>{" "}
          <span>{item.event_label || item.message}</span>
        </p>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-[#8A6A4B]">
          <span className="rounded-full bg-[#F3E6D3] px-2 py-0.5 font-medium">{item.event_type.replaceAll("_", " ")}</span>
          <span>{formatRelativeTime(item.created_at)}</span>
        </div>
      </div>
    </button>
  );
}

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const buildHeaders = () => {
    const token = getAuthToken();
    const nextHeaders = new Headers();
    if (token) {
      nextHeaders.set("Authorization", `Bearer ${token}`);
    }
    return nextHeaders;
  };

  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const [listRes, unreadRes] = await Promise.all([
        fetch(`${API_URL}/api/notifications/`, { headers: buildHeaders() }),
        fetch(`${API_URL}/api/notifications/unread-count/`, { headers: buildHeaders() }),
      ]);

      const listJson = (await listRes.json().catch(() => null)) as NotificationResponse | null;
      const unreadJson = (await unreadRes.json().catch(() => null)) as NotificationResponse | null;

      const nextItems = listJson?.data?.results ?? [];
      setNotifications(nextItems);
      setUnreadCount(Number(unreadJson?.data?.unread_count ?? 0));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const markAsRead = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read/`, {
        method: "PATCH",
        headers: buildHeaders(),
      });
      await fetchNotifications();
    } catch {
      await fetchNotifications();
    }
  };

  const markAllRead = async () => {
    const token = getAuthToken();
    if (!token) return;
    await fetch(`${API_URL}/api/notifications/read-all/`, {
      method: "PATCH",
      headers: buildHeaders(),
    });
    await fetchNotifications();
  };

  const { today, thisWeek, older } = groupByRecency(notifications);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-[2px]">
      <div className="flex h-full w-full max-w-[760px] flex-col border-l border-[#D8C8B1] bg-[#FFF8E2] shadow-[0_0_60px_rgba(40,22,9,0.2)]">
        <div className="flex items-start justify-between border-b border-[#E1D3BF] px-6 py-5">
          <div>
            <p className="m-0 text-[12px] font-bold uppercase tracking-[0.22em] text-[#8B6A4B]">Inbox</p>
            <h2 className="m-0 mt-1 text-[28px] font-bold text-[#432817]">Notifications</h2>
            <p className="mt-1 text-[13px] text-[#8B7355]">{unreadCount} unread notifications</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchNotifications}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#D2B893] bg-white px-4 text-[13px] font-semibold text-[#432817] transition hover:bg-[#FAF1DC]"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </button>
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#D2B893] bg-[#432817] px-4 text-[13px] font-semibold text-[#FFF8E2] transition hover:bg-[#5A3720]"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="rounded-full p-2 text-[#432817] transition hover:bg-white/80"
            >
              <CircleX className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-[#8B7355]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#D7C6AF] bg-white/50 px-8 py-16 text-center text-[#7F654B]">
              <Bell className="mb-3 h-10 w-10 text-[#C7A981]" />
              <p className="m-0 text-lg font-semibold text-[#432817]">No notifications yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#84694E]">
                Likes, comments, group invites, badge reviews, and moderation updates will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {today.length > 0 && (
                <section className="space-y-3">
                  <SectionTitle title="Today" count={today.length} />
                  <div className="space-y-3">
                    {today.map((item) => (
                      <NotificationRow key={item.id} item={item} onRead={markAsRead} />
                    ))}
                  </div>
                </section>
              )}

              {thisWeek.length > 0 && (
                <section className="space-y-3">
                  <SectionTitle title="This week" count={thisWeek.length} />
                  <div className="space-y-3">
                    {thisWeek.map((item) => (
                      <NotificationRow key={item.id} item={item} onRead={markAsRead} />
                    ))}
                  </div>
                </section>
              )}

              {older.length > 0 && (
                <section className="space-y-3 pb-6">
                  <SectionTitle title="Earlier" count={older.length} />
                  <div className="space-y-3">
                    {older.map((item) => (
                      <NotificationRow key={item.id} item={item} onRead={markAsRead} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
