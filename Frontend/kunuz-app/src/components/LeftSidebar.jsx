"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { API_BASE_URL } from "@/lib/apiClient";
import { fetchPostsPage } from "@/hooks/usePosts";
import { normalizeThemePathname } from "@/lib/themeRoutes";
import NotificationPanel from "@/components/Notificationpanel";
import ModeratorReportModal from "@/components/ModeratorReportModal";



const API_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000").replace(/\/$/, "");
const QUICK_FEED_TARGETS = {
  home: { section: "home", href: "/home-page", url: `${API_BASE_URL}/posts/?page_size=10` },
  communities: { section: "groups", href: "/communities", url: `${API_BASE_URL}/groups/posts/?page_size=10` },
  monuments: { section: "monuments", href: "/monuments-in-danger", url: `${API_BASE_URL}/posts/monuments-danger/?page_size=10` },
  events: { section: "events", href: "/events", url: `${API_BASE_URL}/posts/events/filter/?page_size=10` },
};
const DEFAULT_PROFILE = {
  displayName: "Ait Abderrahim Maria",
  username: "",
  profilePicture: "",
};

function KunuzSidebarIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 15 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", color: "var(--brown)" }}
    >
      <path d="M32.9043 40.3706C32.2159 40.3074 31.5344 40.1552 30.8793 39.9138C29.8923 41.53 28.5309 42.8914 26.9149 43.8784C26.4688 44.1509 26.0032 44.395 25.5209 44.6079C24.9597 44.8555 24.3757 45.0611 23.7728 45.2207C23.2717 45.3533 22.7574 45.4543 22.2325 45.5211C21.7335 45.5846 21.2248 45.6173 20.7084 45.6173C20.192 45.6173 19.6834 45.5846 19.1846 45.5211C18.913 46.1588 18.8833 46.8628 19.0952 47.5151C19.6246 47.5766 20.1628 47.6082 20.7084 47.6082C21.2542 47.6082 21.7928 47.5764 22.3224 47.5149C22.8801 47.4501 23.4278 47.352 23.9636 47.2229C24.6112 47.0668 25.2413 46.8653 25.8502 46.6219C26.3737 46.4127 26.8815 46.1725 27.3715 45.9036C29.7005 44.6256 31.6264 42.6997 32.9043 40.3706Z" fill="currentColor" />
      <path d="M14.5029 43.879C12.8867 42.8919 11.5252 41.5303 10.5382 39.914C10.2658 39.468 10.022 39.0026 9.80926 38.5203C9.56156 37.959 9.35588 37.3748 9.19626 36.7717C9.06363 36.2706 8.96283 35.7564 8.89604 35.2315C8.83257 34.7326 8.79984 34.2243 8.79984 33.708C8.79984 33.1917 8.83255 32.6832 8.89604 32.1843C8.25815 31.9126 7.55385 31.8827 6.90139 32.0947C6.83989 32.624 6.80828 33.1624 6.80828 33.708C6.80828 34.2536 6.83988 34.7918 6.90139 35.3211C6.96619 35.8789 7.06428 36.4267 7.19339 36.9626C7.34948 37.6104 7.55101 38.2407 7.79454 38.8499C8.00375 39.3732 8.24384 39.8809 8.51264 40.3708C9.79068 42.7001 11.7168 44.626 14.0461 45.904C14.1094 45.2156 14.2615 44.5341 14.5029 43.879Z" fill="currentColor" />
      <path d="M22.4609 20.7787C22.4609 20.4828 22.4145 20.1871 22.3215 19.9011C21.7921 19.8396 21.2535 19.8079 20.7079 19.8079C20.1623 19.8079 19.6241 19.8396 19.0947 19.9011C18.5371 19.9659 17.9894 20.0637 17.4537 20.1928C16.8061 20.3488 16.176 20.5504 15.567 20.7938C15.0435 21.003 14.5355 21.2433 14.0455 21.5122C11.716 22.7903 9.78979 24.7164 8.51178 27.0459C9.20037 27.1091 9.88218 27.2613 10.5375 27.5027C11.5245 25.8864 12.8861 24.5246 14.5024 23.5376C14.9486 23.2651 15.4141 23.0214 15.8966 22.8085C16.4578 22.5609 17.0418 22.3552 17.6447 22.1957C18.1457 22.0631 18.6597 21.9624 19.1844 21.8956C19.6832 21.8322 20.1916 21.7994 20.7079 21.7994C21.2242 21.7994 21.7328 21.8321 22.2317 21.8956C22.3845 21.5373 22.4609 21.158 22.4609 20.7787Z" fill="currentColor" />
      <path d="M34.6084 33.7081C34.6084 33.1625 34.5768 32.6239 34.5153 32.0945C34.4505 31.5368 34.3525 30.9891 34.2235 30.4534C34.0674 29.8058 33.8659 29.1757 33.6225 28.5667C33.4133 28.0434 33.1733 27.5357 32.9046 27.0458C31.6267 24.7165 29.7007 22.7905 27.3716 21.5125C27.3085 22.201 27.1563 22.8827 26.9149 23.538C28.5311 24.525 29.8926 25.8866 30.8796 27.5028C31.1519 27.9487 31.3955 28.4139 31.6083 28.8961C31.8559 29.4572 32.0615 30.0412 32.2211 30.644C32.3538 31.1452 32.4547 31.6595 32.5215 32.1845C32.585 32.6833 32.6177 33.1918 32.6177 33.7081C32.6177 34.2244 32.585 34.7328 32.5215 35.2316C33.1591 35.5036 33.863 35.5338 34.5153 35.3221C34.5769 34.7925 34.6084 34.254 34.6084 33.7081Z" fill="currentColor" />
      <path d="M41.417 33.7086L38.1256 30.4171C37.3336 29.6251 36.3795 29.0874 35.3674 28.8038C35.6117 29.5298 35.8034 30.2796 35.9378 31.0485C36.2495 31.2348 36.5434 31.4622 36.812 31.7307L38.7898 33.7081L36.812 35.6859C36.5434 35.9545 36.2493 36.1819 35.9377 36.3682C35.4048 36.6867 34.8204 36.8851 34.2234 36.9632C33.5536 37.0508 32.8679 36.987 32.2212 36.772C31.7181 36.6048 31.2386 36.346 30.8086 35.9958C30.6901 35.8992 30.5753 35.7957 30.4649 35.6852L28.4877 33.7081L30.2361 31.959L30.4642 31.7307C30.5748 31.6201 30.6899 31.5164 30.8086 31.4197C30.6655 30.7765 30.4631 30.1567 30.2075 29.566C29.8325 29.8063 29.4777 30.0901 29.1506 30.4171L27.1741 32.3945L22.0226 27.2437L24 25.2665C24.327 24.9394 24.6106 24.5847 24.8509 24.2097C25.1346 23.767 25.358 23.296 25.5209 22.8087C25.7388 22.1566 25.8485 21.4754 25.8501 20.794C25.8513 20.2063 25.7722 19.6184 25.6126 19.049C25.3289 18.0368 24.7912 17.0827 23.9993 16.2908L20.7083 13L17.4176 16.2908C16.6257 17.0827 16.0879 18.0367 15.8045 19.0488C16.5305 18.8045 17.2805 18.6129 18.0494 18.4785C18.2356 18.1672 18.4628 17.8734 18.7312 17.6051L20.709 15.6272L22.6857 17.6044C22.9542 17.8729 23.1815 18.1669 23.3678 18.4785C23.6863 19.0113 23.8847 19.5958 23.9629 20.1928C23.9884 20.3872 24.0011 20.5828 24.0011 20.7785C24.0011 21.2575 23.9248 21.7365 23.7722 22.1957C23.6051 22.6988 23.3464 23.1782 22.9962 23.6082C22.8996 23.7268 22.7962 23.8417 22.6857 23.9522L20.7083 25.9294L18.7319 23.9522C18.6213 23.8417 18.5178 23.7267 18.4212 23.6081C17.7778 23.7512 17.1578 23.9536 16.5669 24.2092C16.8074 24.5844 17.0911 24.9393 17.4183 25.2665L19.3947 27.2437L14.2441 32.3945L12.2668 30.4171C11.9397 30.09 11.585 29.8063 11.2099 29.566C10.7672 29.2823 10.2963 29.0589 9.80901 28.8961C9.15692 28.6781 8.47571 28.5683 7.7943 28.5667C7.20664 28.5653 6.61873 28.6445 6.0493 28.804C5.0372 29.0875 4.0832 29.6252 3.29129 30.4171L0.000365088 33.7081L3.29129 36.9995C4.08326 37.7915 5.03746 38.3293 6.04965 38.6128C5.80527 37.8867 5.61348 37.1366 5.47901 36.3675C5.16739 36.1812 4.87342 35.9538 4.60488 35.6852L2.62824 33.7081L4.60488 31.7314C4.87338 31.4629 5.16727 31.2355 5.47884 31.0492C6.01164 30.7306 6.59609 30.5322 7.19314 30.454C7.86317 30.3662 8.5491 30.4297 9.19603 30.6447C9.69912 30.8118 10.1786 31.0705 10.6085 31.4207C10.7271 31.5173 10.842 31.6209 10.9525 31.7314L12.9298 33.7081L10.9525 35.6852C10.842 35.7957 10.7273 35.8992 10.6087 35.9958C10.7519 36.6393 10.9543 37.2595 11.21 37.8505C11.5851 37.6102 11.9397 37.3266 12.2668 36.9995L14.2441 35.0224L19.3947 40.173L17.4183 42.1504C17.0911 42.4775 16.8073 42.8321 16.5669 43.2073C16.2832 43.65 16.0599 44.121 15.897 44.6083C15.6791 45.2602 15.5692 45.9411 15.5675 46.6223C15.5658 47.2099 15.6449 47.7978 15.8043 48.3672C16.0877 49.3795 16.6255 50.3338 17.4176 51.1259L20.7083 54.4167L23.9999 51.1259C24.7921 50.3337 25.3298 49.3793 25.6132 48.3668C24.8872 48.6112 24.1374 48.8028 23.3684 48.9373C23.182 49.2492 22.9544 49.5436 22.6857 49.8123L20.709 51.7888L18.7319 49.8116C18.4634 49.5431 18.2359 49.2492 18.0496 48.9376C17.731 48.4049 17.5327 47.8204 17.4544 47.2233C17.3667 46.5535 17.4301 45.8677 17.6449 45.221C17.812 44.7179 18.0705 44.2384 18.4206 43.8084C18.5174 43.6896 18.6212 43.5746 18.7319 43.464L20.7083 41.4866L22.6857 43.4645C22.7961 43.575 22.8996 43.6897 22.9962 43.8083C23.6397 43.6651 24.2599 43.4627 24.8509 43.2069C24.6106 42.832 24.3269 42.4774 23.9999 42.1504L22.0226 40.173L27.1734 35.0217L29.1506 36.9995C29.4776 37.3265 29.8323 37.6102 30.2073 37.8505C30.65 38.1343 31.1209 38.3577 31.6082 38.5206C32.2601 38.7386 32.9412 38.8483 33.6224 38.85C34.21 38.8513 34.7977 38.7724 35.3672 38.6128C36.3794 38.3293 37.3335 37.7916 38.1255 36.9995L41.417 33.7086ZM25.8375 33.6978C24.1547 35.4351 22.4039 37.1444 20.6951 38.8711C18.9873 37.1948 17.2523 35.5017 15.6148 33.7413C17.1332 31.927 19.0086 30.2814 20.6727 28.5464C21.5506 29.3735 22.3995 30.2691 23.2664 31.1222C24.1235 31.9807 24.9805 32.8393 25.8375 33.6978Z" fill="currentColor" />
    </svg>
  );
}

/**
 * LeftSidebar â€” floating pill sidebar, identical style to home/profile pages.
 * Pass `activePage` to highlight the active icon:
 *   "home" | "communities" | "monuments" | "add-post" | "notifications" | "profile"
 *
 * Special page variants reuse the page-matching panel background.
 * The Kunuz brand icon follows the current theme colors.
 */
export default function LeftSidebar({
  activePage = "home",
  variant = "default",
}) {
  const t = useTranslations("auth.sidebar");
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    let active = true;

    const applyProfile = (rawUser) => {
      const nextProfile = {
        displayName: String(rawUser?.display_name || rawUser?.full_name || DEFAULT_PROFILE.displayName),
        username: String(rawUser?.username || rawUser?.user_username || ""),
        profilePicture: String(rawUser?.profile_picture || rawUser?.avatar || rawUser?.photoURL || ""),
      };
      if (!active) return;
      setProfile(nextProfile);
      if (nextProfile.username) {
        localStorage.setItem("username", nextProfile.username);
      }
    };

    try {
      const rawAuth =
        localStorage.getItem("authUser") ||
        localStorage.getItem("user") ||
        localStorage.getItem("user_data");
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth);
        applyProfile(parsed);
      }
    } catch {
      window.setTimeout(() => {
        if (active) setProfile(DEFAULT_PROFILE);
      }, 0);
    }

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const realUser = data.data ?? data;
        applyProfile(realUser);
      } catch (err) {
        console.error("Error fetching me:", err);
      }
    };
    void fetchUser();

    return () => {
      active = false;
    };
  }, []);

  // Colours based on variant â€” add-post uses page-matching bg
  const isSpecialBg = activePage === "add-post" || variant === "add-post" || activePage === "edit-profile" || variant === "edit-profile" || activePage === "create-group" || variant === "create-group" || activePage === "edit-group" || variant === "edit-group";
  const normalizedPathname = normalizeThemePathname(pathname || "/");
  const isLegacyRoute =
    normalizedPathname === "/add-post" ||
    normalizedPathname === "/edit-profile" ||
    normalizedPathname === "/add-event";
  const sidebarBg = isLegacyRoute
    ? (isSpecialBg ? "var(--legacy-route-sidebar-bg)" : "var(--legacy-route-sidebar-alt-bg)")
    : (isSpecialBg ? "var(--panel-bg)" : "var(--sidebar-bg)");
  const iconDefault = isLegacyRoute ? "var(--legacy-route-sidebar-icon)" : "var(--foreground)";
  const iconHover = isLegacyRoute
    ? (isSpecialBg ? "var(--legacy-route-sidebar-hover)" : "var(--legacy-route-sidebar-alt-hover)")
    : (isSpecialBg ? "var(--panel-hover)" : "var(--sidebar-hover)");
  const navActiveBg = isLegacyRoute ? "var(--legacy-route-sidebar-active-bg)" : "var(--nav-active-bg)";
  const navActiveIcon = isLegacyRoute ? "var(--legacy-route-sidebar-active-icon)" : "var(--nav-active-icon)";
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeReportId, setActiveReportId] = useState(null);

  const prefetchFeedTarget = useCallback((key) => {
    const target = QUICK_FEED_TARGETS[key];
    if (!target) return;

    router.prefetch(target.href);
    queryClient.prefetchInfiniteQuery({
      queryKey: ["posts", target.section, 10],
      queryFn: ({ pageParam }) => fetchPostsPage(pageParam),
      initialPageParam: target.url,
      getNextPageParam: (lastPage) => lastPage.next || undefined,
      staleTime: 5 * 60 * 1000,
    }).catch(() => undefined);
  }, [queryClient, router]);

  useEffect(() => {
    const runPrefetch = () => {
      Object.keys(QUICK_FEED_TARGETS).forEach(prefetchFeedTarget);
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(runPrefetch, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = window.setTimeout(runPrefetch, 350);
    return () => window.clearTimeout(timer);
  }, [prefetchFeedTarget]);


  const fetchUnreadCount = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const json = await response.json();
        // Handle both { data: { unread_count: N } } and { unread_count: N }
        const count = json?.data?.unread_count !== undefined ? json.data.unread_count : (json?.unread_count !== undefined ? json.unread_count : 0);
        const parsedCount = Number(count);
        setUnreadCount(Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void fetchUnreadCount();
    }, 0);
    const interval = setInterval(() => {
      const token = localStorage.getItem("accessToken");
      if (token) fetchUnreadCount();
    }, 30000); // 30s is enough, no need to hammer every 5s

    const handleUpdate = (e) => {
      const newCount = Number(e.detail);
      if (Number.isFinite(newCount)) {
        // Defer state update to avoid setState during another component render.
        window.setTimeout(() => {
          setUnreadCount(newCount > 0 ? newCount : 0);
        }, 0);
      } else {
        fetchUnreadCount();
      }
    };

    window.addEventListener("refresh-unread-count", handleUpdate);
    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(interval);
      window.removeEventListener("refresh-unread-count", handleUpdate);
    };
  }, [pathname]); // Also refetch on navigation

  useEffect(() => {
    if (!isNotifOpen) return;
    const timer = window.setTimeout(() => {
      void fetchUnreadCount();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isNotifOpen]);

  const navItems = useMemo(
    () => [
      {
        key: "home",
        label: t("nav.home"),
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
        label: t("nav.communities"),
        href: "/communities",
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
        label: t("nav.monuments"),
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
        label: t("nav.events"),
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
        label: t("nav.notifications"),
        href: "/notifications",
        hasBadge: Number.isFinite(unreadCount) && unreadCount > 0,
        path: (
          <>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </>
        ),
      },
      {
        key: "profile",
        label: profile.username ? `@${profile.username}` : t("nav.profile"),
        href: profile.username ? `/user/${profile.username}` : "#",
        path: (
          <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </>
        ),
      },
      {
        key: "help",
        label: t("nav.help"),
        href: "/help",
        path: (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        ),
      },
    ],
    [t, profile.username, unreadCount],
  );

  return (
    <>
      {/* Desktop Sidebar (Floating Pill) */}
      <aside
        className={`rtl-sidebar fixed left-4 top-4 w-[56px] hidden md:flex flex-col items-center py-6 z-50 rounded-2xl${isLegacyRoute ? " legacy-route-sidebar" : ""}`}
        style={{
          backgroundColor: sidebarBg,
          boxShadow: "0 4px 24px rgba(67,40,23,0.12)",
        }}
      >
        <Link href="/home-page" className="mb-6 px-1" aria-label={t("nav.home")}>
          <KunuzSidebarIcon />
        </Link>

        <nav className="flex flex-col items-center gap-6">
          {navItems.map((item) => {
            const isActive = activePage === item.key;
            const strokeCol = isActive ? navActiveIcon : iconDefault;
            const fillCol = isActive ? navActiveIcon : "none";

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
                  <span
                    className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF0000] rounded-full border-2 border-white z-20"
                    title={`${unreadCount} new notifications`}
                  />
                )}
              </>
            );

            if (item.key === "notifications") {
              return (
                <div key={item.key} className="relative group">
                  <button
                    type="button"
                    className="relative p-2.5 rounded-xl transition-all duration-200 block"
                    aria-label={item.label}
                    title={item.label}
                    style={{
                      backgroundColor: isActive ? navActiveBg : "transparent",
                    }}
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
                    className="rtl-sidebar-tooltip absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50"
                    style={{
                      backgroundColor: navActiveBg,
                      color: navActiveIcon,
                      boxShadow: "0 2px 8px rgba(67,40,23,0.2)",
                      fontFamily: "var(--font-lato)",
                    }}
                  >
                    {item.label}
                  </span>

                </div>
              );
            }

            return (
              <div key={item.key} className={`relative group${item.key === "help" ? " mt-25" : ""}`}>
                <Link
                  href={item.href}
                  prefetch
                  className="relative p-2.5 rounded-xl transition-all duration-200 block"
                  aria-label={item.label}
                  title={item.label}
                  style={{
                    backgroundColor: isActive ? navActiveBg : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    prefetchFeedTarget(item.key);
                    if (!isActive)
                      e.currentTarget.style.backgroundColor = iconHover;
                  }}
                  onTouchStart={() => prefetchFeedTarget(item.key)}
                  onPointerDown={() => prefetchFeedTarget(item.key)}
                  onFocus={() => prefetchFeedTarget(item.key)}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {iconEl}
                </Link>

                <span
                  className="rtl-sidebar-tooltip absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50"
                  style={{
                    backgroundColor: navActiveBg,
                    color: navActiveIcon,
                    boxShadow: "0 2px 8px rgba(67,40,23,0.2)",
                    fontFamily: "var(--font-lato)",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}

        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className={`rtl-mobile-sidebar fixed bottom-0 left-0 right-0 h-16 md:hidden flex items-center justify-around z-[100] px-4${isLegacyRoute ? " legacy-route-sidebar" : ""}`}
        style={{
          backgroundColor: sidebarBg,
          borderColor: isLegacyRoute ? "var(--legacy-route-mobile-border)" : "var(--border-soft)",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        }}
      >
        {navItems.map((item) => {
          const isActive = activePage === item.key;
          const strokeCol = isActive ? navActiveIcon : iconDefault;
          const fillCol = isActive ? navActiveIcon : "none";
          const mobileIcon = (
            <>
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
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF0000] rounded-full border-2 border-white z-20" />
              )}
            </>
          );

          if (item.key === "notifications") {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setIsNotifOpen(true)}
                className="relative p-2.5 rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: isNotifOpen ? navActiveBg : "transparent",
                  transform: isNotifOpen ? "scale(1.1)" : "scale(1)",
                  boxShadow: isNotifOpen ? "0 10px 24px rgba(0,0,0,0.18)" : "none",
                }}
                aria-label={item.label}
                title={item.label}
              >
                {mobileIcon}
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              prefetch
              className="relative p-2.5 rounded-xl transition-all duration-300"
              aria-label={item.label}
              title={item.label}
              onTouchStart={() => prefetchFeedTarget(item.key)}
              onPointerDown={() => prefetchFeedTarget(item.key)}
              onMouseEnter={() => prefetchFeedTarget(item.key)}
              onFocus={() => prefetchFeedTarget(item.key)}
              style={{
                backgroundColor: isActive ? navActiveBg : "transparent",
                transform: isActive ? "scale(1.1)" : "scale(1)",
                boxShadow: isActive ? "0 10px 24px rgba(0,0,0,0.18)" : "none",
              }}
            >
              {mobileIcon}
            </Link>
          );
        })}
      </nav>
      {isNotifOpen && (
        <NotificationPanel
          onClose={() => setIsNotifOpen(false)}
          onReportClick={(id) => setActiveReportId(id)}
        />
      )}
      {activeReportId && (
        <ModeratorReportModal
          reportId={activeReportId}
          onClose={() => setActiveReportId(null)}
        />

      )}
    </>

  );
}
