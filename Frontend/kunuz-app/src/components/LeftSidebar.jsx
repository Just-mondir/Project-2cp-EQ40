"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";

/**
 * LeftSidebar — floating pill sidebar, identical style to home/profile pages.
 * Pass `activePage` to highlight the active icon:
 *   "home" | "communities" | "monuments" | "add-post" | "notifications" | "profile"
 *
 * For add-post: background #F7F5EF (matches page), icons/logo brown (#432817)
 * For all other uses: keep the original home/profile cream style.
 */
export default function LeftSidebar({
  activePage = "home",
  variant = "default",
}) {
  const [username, setUsername] = useState("");

  useEffect(() => {
    try {
      const direct =
        localStorage.getItem("username") ||
        localStorage.getItem("user_username") ||
        "";
      if (direct) {
        setUsername(direct);
        return;
      }
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUsername(parsed?.username || parsed?.user_username || "");
      }
    } catch {
      setUsername("");
    }
  }, []);

  useEffect(() => {
    if (!username) {
      // Fetch if not in localStorage
      const fetchUser = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          if (!token) return;
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
          const res = await fetch(`${API_URL}/api/users/me/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const data = await res.json();
          const realUser = data.data ?? data;
          const fetchedUn = realUser.username || realUser.user_username || "";
          if (fetchedUn) {
            setUsername(fetchedUn);
            localStorage.setItem("username", fetchedUn);
          }
        } catch (err) {
          console.error("Error fetching me:", err);
        }
      };
      fetchUser();
    }
  }, [username]);

  // Colours based on variant — add-post uses page-matching bg
  const isSpecialBg = activePage === "add-post" || variant === "add-post";
  const sidebarBg = isSpecialBg ? "#F7F5EF" : "#FFF8E2";
  const iconDefault = "#432817";
  const iconHover = isSpecialBg ? "#ede9df" : "#F0E8CC";
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifContainerRef = useRef(null);

  const fetchMiniNotifications = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setNotifications([]);
      return;
    }

    setNotifLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/notifications/?page_size=4`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setNotifications([]);
        return;
      }
      const data = await response.json();
      setNotifications(data?.data?.results ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (isNotifOpen) {
      fetchMiniNotifications();
    }
  }, [isNotifOpen]);

  useEffect(() => {
    if (!isNotifOpen) return;
    const handleOutsideClick = (event) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isNotifOpen]);

  const navItems = useMemo(
    () => [
      {
        key: "home",
        label: "Home",
        href: "/home-page",
        path: (
          <>
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </>
        ),
      },
      {
        key: "communities",
        label: "Communities",
        href: "#",
        path: (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        ),
      },
      {
        key: "monuments",
        label: "Monuments in Danger",
        href: "/monuments-in-danger",
        path: (
          <>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        ),
      },
      {
        key: "events",
        label: "Events",
        href: "/events",
        path: (
          <>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </>
        ),
      },
      {
        key: "notifications",
        label: "Notifications",
        href: "/notifications",
        hasBadge: true,
        path: (
          <>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </>
        ),
      },
      {
        key: "profile",
        label: "Profile",
        href: username ? `/user/${username}` : "#",
        path: (
          <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </>
        ),
      },
    ],
    [username],
  );

  return (
    <>
      {/* Desktop Sidebar (Floating Pill) */}
      <aside
        className="fixed left-4 top-4 w-[56px] hidden md:flex flex-col items-center py-6 z-50 rounded-2xl"
        style={{
          backgroundColor: sidebarBg,
          boxShadow: "0 4px 24px rgba(67,40,23,0.12)",
        }}
      >
        <Link href="/home-page" className="mb-6 px-1">
          <img src="/kunuz-icon.svg" alt="Kunuz" width={42} height={42} />
        </Link>

        <nav className="flex flex-col items-center gap-5">
          {navItems.map((item) => {
            const isActive = activePage === item.key;
            const strokeCol = isActive ? "#FFF8E2" : iconDefault;
            const fillCol = isActive ? "#FFF8E2" : "none";
            const bgClass = isActive ? "bg-[#432817]" : "";

            const iconEl = (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={fillCol}
                  stroke={strokeCol}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors"
                >
                  {item.path}
                </svg>
                {item.hasBadge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </>
            );

            if (item.key === "notifications") {
              return (
                <div key={item.key} className="relative group" ref={notifContainerRef}>
                  <button
                    type="button"
                    className={`relative p-2.5 rounded-xl transition-all duration-200 block ${bgClass}`}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.backgroundColor = iconHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={() => setIsNotifOpen((prev) => !prev)}
                  >
                    {iconEl}
                  </button>

                  <span
                    className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50"
                    style={{
                      backgroundColor: "#432817",
                      color: "#FFF8E2",
                      boxShadow: "0 2px 8px rgba(67,40,23,0.2)",
                      fontFamily: "var(--font-lato)",
                    }}
                  >
                    {item.label}
                  </span>

                  {isNotifOpen && (
                    <div
                      className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-[320px] rounded-2xl border p-4 z-[70]"
                      style={{
                        backgroundColor: "#FFF8E2",
                        borderColor: "#D7C6AF",
                        boxShadow: "0 16px 36px rgba(46, 25, 11, 0.22)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold" style={{ color: "#432817" }}>
                          Notifications
                        </p>
                        <Bell size={14} color="#8B7355" />
                      </div>

                      {notifLoading ? (
                        <p className="text-xs" style={{ color: "#8B7355" }}>Loading...</p>
                      ) : notifications.length === 0 ? (
                        <p className="text-xs leading-5" style={{ color: "#8B7355" }}>
                          No notifications yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {notifications.map((notification) => (
                            <div key={notification.id} className="rounded-xl p-2.5" style={{ backgroundColor: "#FFFDF8" }}>
                              <p className="text-[12px] font-semibold leading-5" style={{ color: "#432817" }}>
                                {notification.actor_display_name || "Someone"} {notification.event_label || notification.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t" style={{ borderColor: "#E5D8C8" }}>
                        <Link
                          href="/notifications"
                          className="inline-flex items-center justify-center text-xs font-semibold rounded-lg px-3 py-2"
                          style={{ backgroundColor: "#432817", color: "#FFF8E2" }}
                          onClick={() => setIsNotifOpen(false)}
                        >
                          View all
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={item.key} className="relative group">
                <Link
                  href={item.href}
                  className={`relative p-2.5 rounded-xl transition-all duration-200 block ${bgClass}`}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor = iconHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {iconEl}
                </Link>

                <span
                  className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50"
                  style={{
                    backgroundColor: "#432817",
                    color: "#FFF8E2",
                    boxShadow: "0 2px 8px rgba(67,40,23,0.2)",
                    fontFamily: "var(--font-lato)",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}

          <div className="h-40" />

          <div className="relative group">
            <Link
              href="/help"
              className="p-2.5 rounded-xl transition-all duration-200 block"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = iconHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={iconDefault}
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </Link>

            <span
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50"
              style={{
                backgroundColor: "#432817",
                color: "#FFF8E2",
              }}
            >
              Help
            </span>
          </div>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 md:hidden flex items-center justify-around z-[100] px-4 border-t"
        style={{
          backgroundColor: sidebarBg,
          borderColor: "rgba(67,40,23,0.1)",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        }}
      >
        {navItems.map((item) => {
          const isActive = activePage === item.key;
          const strokeCol = isActive ? "#FFF8E2" : iconDefault;
          const fillCol = isActive ? "#FFF8E2" : "none";
          const bgClass = isActive ? "bg-[#432817] scale-110 shadow-md" : "";

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative p-2.5 rounded-xl transition-all duration-300 ${bgClass}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={fillCol}
                stroke={strokeCol}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.path}
              </svg>
              {item.hasBadge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
