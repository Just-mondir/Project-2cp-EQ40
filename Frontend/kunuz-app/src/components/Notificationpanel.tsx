"use client";

import { useEffect, useState } from "react";
import { CircleX } from "lucide-react";

interface Notification {
  id: number;
  type: "user" | "system";
  image?: string;
  avatar?: string;
  username?: string;
  action: string;
  time: string;
}

const STATIC_NOTIFICATIONS: Notification[] = [
  { id: 9, type: "user",   username: "User498783887838", action: "gemed your post",               time: "3 min ago",   avatar: "/Camera man.jpg"  },
  { id: 8, type: "system", action: "Your monument report was verified",       time: "1 hour ago",        image: "/timgad.jpg"                              },
  { id: 7, type: "user",   username: "User498783887838", action: "commented on your post",        time: "4 hours ago", avatar: "/Canon camera.jpg" },
  { id: 6, type: "system", action: "Your monument report was verified", time: "1 hour ago",        image: "/download 2.jpg"                          },
  { id: 5, type: "user",   username: "User498783887838", action: "gemed your post",               time: "1 day",       avatar: "/Camera man.jpg"   },
  { id: 4, type: "system", action: "Your monument report was verified",       time: "3 days",            image: "/timgad.jpg"                              },
  { id: 3, type: "user",   username: "User498783887838", action: "commented on your post",        time: "11 days",     avatar: "/Canon camera.jpg" },
  { id: 2, type: "user",   username: "User498783887838", action: "gemed your post",               time: "01/01/2026",  avatar: "/Camera man.jpg"   },
  { id: 1, type: "user",   username: "User498783887838", action: "commented on your post",        time: "11/11/2025",  avatar: "/Canon camera.jpg" },
  { id: 0, type: "user",   username: "User498783887838", action: "commented on your post",        time: "11/12/2025",  avatar: "/Camera man.jpg" },
];

function groupNotifications(list: Notification[]) {
  const today: Notification[]     = [];
  const thisMonth: Notification[] = [];
  const earlier: Notification[]   = [];

  list.forEach((n) => {
    if (n.time.includes("min") || n.time.includes("hour")) today.push(n);
    else if (n.time.includes("day"))                        thisMonth.push(n);
    else                                                    earlier.push(n);
  });

  return { today, thisMonth, earlier };
}

/* ── User avatar ── */
function UserAvatar({ avatar }: { avatar?: string }) {
  return (
    <div
      style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        border: "0px solid #432817",
        boxShadow: "0px 4px 4px 0px #00000059",
        flexShrink: 0,
        overflow: "hidden",
        backgroundColor: "#E0D5C5",
      }}
    >
      {avatar ? (
        <img src={avatar} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="#8B7355" />
            <circle cx="12" cy="7" r="4" fill="#8B7355" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ── System thumbnail ── */
function SystemImage({ image }: { image?: string }) {
  return (
    <div
      style={{
        width: "50px",
        height: "48px",
        borderRadius: "7px",
        overflow: "hidden",
        flexShrink: 0,
        backgroundColor: "#C8B89A",
      }}
    >
      {image ? (
        <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", backgroundColor: "#432817", opacity: 0.4 }} />
      )}
    </div>
  );
}

/* ── Single notification row ── */
function NotificationItem({ notification }: { notification: Notification }) {
  const isUser = notification.type === "user";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "16px",
        minHeight: "52px",
        cursor: "pointer",
        borderRadius: "8px",
        padding: "6px 8px",
        backgroundColor: hovered ? "rgba(67, 40, 23, 0.12)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {isUser ? <UserAvatar avatar={notification.avatar} /> : <SystemImage image={notification.image} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: "#000000", fontFamily: "'Lato', bold", fontSize: "16px", lineHeight: "1.8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {isUser && <span style={{ fontWeight: 700 }}>{notification.username} </span>}
          <span style={{ fontWeight: 400 }}>{notification.action}</span>
        </p>
        <p style={{ margin: 0, marginTop: "2px", color: "#432817", fontFamily: "'Lato', sans-serif", fontSize: "13px", lineHeight: "1.2" }}>
          {notification.time}
        </p>
      </div>
    </div>
  );
}

/* ── Section divider — brown line + label + top padding ── */
function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ paddingTop: "16px" }}>
      <div style={{ borderBottom: "1px solid #432817" }} />
      <p style={{ margin: 0, paddingTop: "8px", color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 500, fontSize: "22px", lineHeight: "43px" }}>
        {title}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main panel
══════════════════════════════════════════════ */
export default function NotificationPanel({ onClose }: { onClose: () => void }) {

  const [notifications, setNotifications] = useState<Notification[]>(STATIC_NOTIFICATIONS);
  const [loading, setLoading]             = useState(false);

  /*
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${yourAuthToken}` },
    })
      .then((res) => res.json())
      .then((data: Notification[]) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  */

  /*
  useEffect(() => {
    if (!WS_URL) return;
    const ws = new WebSocket(`${WS_URL}/ws/notifications`);
    ws.onmessage = (event) => {
      const newNotif: Notification = JSON.parse(event.data);
      setNotifications((prev) => [newNotif, ...prev]);
    };
    ws.onerror = (err) => console.error("WebSocket error:", err);
    return () => ws.close();
  }, []);
  */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { today, thisMonth, earlier } = groupNotifications(notifications);
  const SIDEBAR_LEFT = 16;   // left-4
const SIDEBAR_WIDTH = 56;  // w-[56px]
const GAP = 16;

const PANEL_LEFT = SIDEBAR_LEFT + SIDEBAR_WIDTH + GAP; // = 88
  return (
    <>
      {/* Dark overlay */}
      <div
  onClick={onClose}
  style={{
    position: "fixed",
    top: 0,
    left: `${PANEL_LEFT}px`,
    right: 0,
    bottom: 0,
    zIndex: 30,
    backgroundColor: "rgba(0,0,0,0.8)",
  }}
/>

      {/* Sliding panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: `${PANEL_LEFT}px`,
          height: "100vh",
          width: "650px",
          backgroundColor: "#FFF8E2",
          boxShadow: "1.4px 2.8px 4.2px 0px #000000",
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          animation: "slideInLeft 0.25s ease",
        }}
      >
        {/* CircleX close button — lucide, #432817 at 50% opacity */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px 4px 16px", flexShrink: 0 }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", opacity: 0.5 }}
          >
            <CircleX size={24} color="#432817" strokeWidth={1.5} />
          </button>
        </div>

        {/* "Notifications" heading — NO bottom border line */}
        <div style={{ padding: "0 24px", flexShrink: 0 }}>
          <h2 style={{ margin: 0, paddingBottom: "20px", color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "27px", lineHeight: "43px" }}>
            Notifications
          </h2>
        </div>

        {/* Loading state */}
        {loading && (
          <p style={{ padding: "16px 24px", color: "#8B7355", fontFamily: "'Lato', sans-serif", fontSize: "14px" }}>
            Loading...
          </p>
        )}

        {/* Scrollable list */}
        {!loading && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px", scrollbarWidth: "none" }}>

            {/* TODAY — top padding on the label */}
            {today.length > 0 && (
              <div style={{ paddingBottom: "20px" }}>
                <p style={{ margin: 0, paddingTop: "12px", color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 500, fontSize: "22px", lineHeight: "43px" }}>
                  Today
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {today.map((n) => <NotificationItem key={n.id} notification={n} />)}
                </div>
              </div>
            )}

            {/* THIS MONTH */}
            {thisMonth.length > 0 && (
              <div style={{ paddingBottom: "20px" }}>
                <SectionDivider title="This month" />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "6px" }}>
                  {thisMonth.map((n) => <NotificationItem key={n.id} notification={n} />)}
                </div>
              </div>
            )}

            {/* EARLIER */}
            {earlier.length > 0 && (
              <div style={{ paddingBottom: "20px" }}>
                <SectionDivider title="Earlier" />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "6px" }}>
                  {earlier.map((n) => <NotificationItem key={n.id} notification={n} />)}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
