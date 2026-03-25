"use client";

import Link from "next/link";
import { useState } from "react";
import NotificationPanel from "@/components/Notificationpanel";

/**
 * LeftSidebar — floating pill sidebar, identical style to home/profile pages.
 * Pass activePage to highlight the active icon:
 * "home" | "communities" | "monuments" | "add-post" | "notifications" | "profile"
 *
 * For add-post: background #F7F5EF (matches page), icons/logo brown (#432817)
 * For all other uses: keep the original home/profile cream style.
 */
export default function LeftSidebar({ activePage = "home", variant = "default" }) {
  const [showNotifications, setShowNotifications] = useState(false);

  // Colours based on variant
  const isAddPost = activePage === "add-post" || activePage === "edit-profile";
  const sidebarBg = isAddPost ? "#F7F5EF" : "#FFF8E2";
  const iconDefault = "#432817";
  const iconHover = isAddPost ? "#ede9df" : "#F0E8CC";

  const navItems = [
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
      href: "#",
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
      href: "#",
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
      href: "/profile",
      path: (
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ),
    },
  ];

  return (
    <>
      <aside
        className="fixed left-4 top-4 w-[56px] flex flex-col items-center py-6 z-50 rounded-2xl"
        style={{
          backgroundColor: sidebarBg,
          boxShadow: "0 4px 24px rgba(67,40,23,0.12)",
        }}
      >
        {/* Logo */}
        <Link href="/home-page" className="mb-6 px-1">
          <img src="/kunuz-icon.svg" alt="Kunuz" width={42} height={42} />
        </Link>

        {/* Nav */}
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
                >
                  {item.path}
                </svg>

                {item.hasBadge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </>
            );

            return (
              <div key={item.key} className="relative group">
                {item.key === "notifications" ? (
                  <button
                    onClick={() => setShowNotifications(true)}
                    className={`relative p-2.5 rounded-xl transition-all duration-200 block ${bgClass}`}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = iconHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {iconEl}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`relative p-2.5 rounded-xl transition-all duration-200 block ${bgClass}`}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = iconHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {iconEl}
                  </Link>
                )}

                {/* Tooltip */}
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

          {/* Spacer */}
          <div className="h-40" />

          {/* Help */}
          <div className="relative group">
            <Link
              href="/Help"
              className="p-2.5 rounded-xl transition-all duration-200 block"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = iconHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconDefault} strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </Link>

            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50"
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

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}