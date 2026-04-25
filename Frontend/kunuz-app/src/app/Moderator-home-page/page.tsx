"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSidebar from "../../components/LeftSidebar";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";

type UserRole = "user" | "moderator" | "admin";
type ModerationStatus = "active" | "suspended" | "banned";

type UserRow = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  posts: number;
  joined: string;
  expertise: string;
  suspendedUntil: string;
  moderationStatus: ModerationStatus;
  role: UserRole;
};

type GroupRow = {
  id: string;
  name: string;
  avatar: string;
  members: number;
  posts: number;
  created: string;
};

type ModeratorProfile = {
  name: string;
  username: string;
  avatar: string;
};

type StatsState = {
  members: number;
  groups: number;
  visitors: number;
  posts: number;
};

type ConfirmConfig = {
  title: string;
  subtitle: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, unknown>;
};

type PaginatedPayload<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

type MePayload = {
  username?: string | null;
  display_name?: string | null;
  profile_picture?: string | null;
  role?: string | null;
};

type StatsPayload = {
  members?: number;
  visitors?: number;
  posts?: number;
};

type BackendModeratorUser = {
  id: string;
  display_name: string;
  username: string | null;
  expertise: string;
  profile_picture: string;
  role: UserRole;
  moderation_status: ModerationStatus;
  moderation_reason: string;
  suspended_until: string | null;
  created_at: string;
  post_count: number;
};

type BackendGroup = {
  id: string;
  name: string;
  profile_picture: string;
  member_count: number;
  post_count: number;
  created_at: string;
};

const usersGridTemplate =
  "minmax(0,0.9fr) minmax(0,1.2fr) minmax(0,0.45fr) minmax(0,0.9fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,1.15fr) minmax(0,1.45fr)";
const groupsGridTemplate =
  "minmax(0,0.9fr) minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,0.9fr) minmax(0,1.35fr) minmax(0,1.1fr)";

function getAuthToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function buildHeaders(token: string, withJson = false) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (withJson) headers["Content-Type"] = "application/json";
  return headers;
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }

    const maybeErrors = (payload as { errors?: Record<string, unknown> }).errors;
    if (maybeErrors && typeof maybeErrors === "object") {
      const firstValue = Object.values(maybeErrors)[0];
      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
        return firstValue[0];
      }
      if (typeof firstValue === "string") {
        return firstValue;
      }
    }
  }

  return fallback;
}

async function fetchJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(token),
      ...(init?.headers ?? {}),
    },
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Request failed."));
  }

  return payload as T;
}

function unwrapData<T>(payload: ApiEnvelope<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as ApiEnvelope<T>).data !== undefined
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

function getPaginatedData<T>(payload: unknown): PaginatedPayload<T> {
  if (payload && typeof payload === "object") {
    const maybeEnvelope = payload as ApiEnvelope<PaginatedPayload<T>>;
    if (maybeEnvelope.data && typeof maybeEnvelope.data === "object") {
      return maybeEnvelope.data;
    }
    return payload as PaginatedPayload<T>;
  }
  return {};
}

async function fetchAllPages<T>(path: string, token: string): Promise<{ count: number; results: T[] }> {
  const results: T[] = [];
  let nextUrl: string | null = `${API_URL}${path}`;
  let totalCount = 0;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers: buildHeaders(token) });
    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload, "Request failed."));
    }

    const page = getPaginatedData<T>(payload);
    results.push(...(page.results ?? []));
    totalCount = page.count ?? results.length;
    nextUrl = page.next ?? null;
  }

  return { count: totalCount || results.length, results };
}

function resolveMediaUrl(value: string | null | undefined) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value;
  }
  return `${API_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function fallbackAvatar(seed: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || "User")}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB").format(date);
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1000) {
    const compact = value / 1000;
    return `${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1)}k`;
  }
  return String(value);
}

function roleLabel(role: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "moderator") return "Moderator";
  return "User";
}

function expertiseLabel(value: string | null | undefined) {
  if (!value) return "Not specified";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildSuspendUntilIso(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

export default function ModeratorUsers() {
  const [activeTab, setActiveTab] = useState<"Users" | "Groups">("Users");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [moderatorProfile, setModeratorProfile] = useState<ModeratorProfile>({
    name: "Moderator",
    username: "@moderator",
    avatar: fallbackAvatar("Moderator"),
  });
  const [stats, setStats] = useState<StatsState>({
    members: 0,
    groups: 0,
    visitors: 0,
    posts: 0,
  });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, UserRole>>({});
  const [editStartRolesByUserId, setEditStartRolesByUserId] = useState<Record<string, UserRole> | null>(null);

  const effectiveTab = isEditingRoles ? "Users" : activeTab;
  const isGroupsTab = effectiveTab === "Groups";
  const pageSize = 10;
  const listData = isGroupsTab ? groups : users;
  const totalPages = Math.max(1, Math.ceil(listData.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const visiblePages = useMemo(() => {
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const halfWindow = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, safeCurrentPage - halfWindow);
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisiblePages + 1;
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [safeCurrentPage, totalPages]);

  const pageItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return listData.slice(start, start + pageSize);
  }, [listData, pageSize, safeCurrentPage]);

  const hasRoleChanges = useMemo(() => {
    if (!editStartRolesByUserId) return false;
    const allKeys = new Set([...Object.keys(editStartRolesByUserId), ...Object.keys(rolesByUserId)]);
    for (const key of allKeys) {
      if ((editStartRolesByUserId[key] ?? "user") !== (rolesByUserId[key] ?? "user")) {
        return true;
      }
    }
    return false;
  }, [editStartRolesByUserId, rolesByUserId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileAndStats() {
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) {
          setProfileLoading(false);
          setStatsLoading(false);
          setPageError("You need to be logged in as a moderator to view this page.");
        }
        return;
      }

      try {
        const [mePayload, statsPayload, groupsPayload] = await Promise.all([
          fetchJson<ApiEnvelope<MePayload>>("/api/users/me/", token),
          fetchJson<ApiEnvelope<StatsPayload>>("/api/moderator/stats/", token),
          fetchJson<ApiEnvelope<PaginatedPayload<BackendGroup>>>("/api/groups/?page=1&page_size=1", token),
        ]);

        if (cancelled) return;

        const me = unwrapData(mePayload);
        const platformStats = unwrapData(statsPayload);
        const groupPage = unwrapData(groupsPayload);

        setModeratorProfile({
          name: me.display_name || me.username || "Moderator",
          username: me.username ? `@${me.username}` : "@moderator",
          avatar: resolveMediaUrl(me.profile_picture) || fallbackAvatar(me.display_name || me.username || "Moderator"),
        });
        setStats({
          members: platformStats.members ?? 0,
          groups: groupPage.count ?? 0,
          visitors: platformStats.visitors ?? 0,
          posts: platformStats.posts ?? 0,
        });
        setPageError("");
      } catch (error) {
        if (!cancelled) {
          setPageError(error instanceof Error ? error.message : "Failed to load moderator data.");
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
          setStatsLoading(false);
        }
      }
    }

    void loadProfileAndStats();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadListData() {
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) {
          setUsers([]);
          setGroups([]);
          setListLoading(false);
        }
        return;
      }

      setListLoading(true);

      try {
        if (effectiveTab === "Users") {
          const params = new URLSearchParams();
          if (search.trim()) params.set("q", search.trim());
          const suffix = params.toString() ? `?${params.toString()}` : "";
          const payload = await fetchAllPages<BackendModeratorUser>(`/api/moderator/users/${suffix}`, token);

          if (cancelled) return;

          const mappedUsers = payload.results.map((user) => ({
            id: user.id,
            name: user.display_name || user.username || "Unknown user",
            username: user.username ? `@${user.username}` : "",
            avatar: resolveMediaUrl(user.profile_picture) || fallbackAvatar(user.display_name || user.username || "User"),
            posts: user.post_count ?? 0,
            joined: formatDate(user.created_at),
            expertise: expertiseLabel(user.expertise),
            suspendedUntil: formatDate(user.suspended_until),
            moderationStatus: user.moderation_status ?? "active",
            role: user.role ?? "user",
          }));

          setUsers(mappedUsers);
          setRolesByUserId((prev) => {
            const next = { ...prev };
            for (const user of mappedUsers) {
              if (!isEditingRoles || !(user.id in next)) {
                next[user.id] = user.role;
              }
            }
            return next;
          });
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "100");
          if (search.trim()) {
            params.set("q", search.trim());
          }
          const path = search.trim() ? "/api/groups/search/" : "/api/groups/";
          const payload = await fetchAllPages<BackendGroup>(`${path}?${params.toString()}`, token);

          if (cancelled) return;

          const mappedGroups = payload.results.map((group) => ({
            id: group.id,
            name: group.name,
            avatar: resolveMediaUrl(group.profile_picture) || fallbackAvatar(group.name),
            members: group.member_count ?? 0,
            posts: group.post_count ?? 0,
            created: formatDate(group.created_at),
          }));

          setGroups(mappedGroups);
        }

        if (!cancelled) {
          setPageError("");
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(error instanceof Error ? error.message : "Failed to load moderator list.");
          if (effectiveTab === "Users") {
            setUsers([]);
          } else {
            setGroups([]);
          }
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    }

    void loadListData();

    return () => {
      cancelled = true;
    };
  }, [effectiveTab, search, isEditingRoles]);

  const runConfirm = async () => {
    if (!confirmConfig) return;
    setConfirmBusy(true);
    try {
      await confirmConfig.onConfirm();
      setConfirmConfig(null);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleTabChange = (tab: "Users" | "Groups") => {
    setActiveTab(tab);
    setSearch("");
    setCurrentPage(1);
    setOpenRoleMenuId(null);
    if (tab === "Groups") {
      setIsEditingRoles(false);
      setEditStartRolesByUserId(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    setOpenRoleMenuId(null);
  };

  const setRole = (id: string, role: UserRole) => {
    setRolesByUserId((prev) => ({ ...prev, [id]: role }));
  };

  const handleToggleEditRoles = () => {
    if (!isEditingRoles) {
      setEditStartRolesByUserId({ ...rolesByUserId });
      setIsEditingRoles(true);
      setActiveTab("Users");
      setCurrentPage(1);
      setOpenRoleMenuId(null);
      return;
    }

    if (!hasRoleChanges || !editStartRolesByUserId) {
      setIsEditingRoles(false);
      setEditStartRolesByUserId(null);
      return;
    }

    setConfirmConfig({
      title: "Are you sure of saving changes?",
      subtitle: "Your role updates will be saved.",
      confirmLabel: "Save",
      onConfirm: async () => {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Authentication required.");
        }

        const changedUserIds = Object.keys(rolesByUserId).filter(
          (id) => rolesByUserId[id] !== editStartRolesByUserId[id],
        );

        await Promise.all(
          changedUserIds.map((userId) =>
            fetchJson<ApiEnvelope<{ id: string; role: UserRole }>>(
              `/api/moderator/users/${userId}/role/`,
              token,
              {
                method: "PATCH",
                headers: buildHeaders(token, true),
                body: JSON.stringify({ role: rolesByUserId[userId] }),
              },
            ),
          ),
        );

        setUsers((prev) =>
          prev.map((user) => ({
            ...user,
            role: rolesByUserId[user.id] ?? user.role,
          })),
        );
        setIsEditingRoles(false);
        setEditStartRolesByUserId(null);
      },
    });
  };

  const openModerationConfirm = (userId: string, action: "ban" | "suspend" | "reactivate") => {
    const user = users.find((entry) => entry.id === userId);
    if (!user) return;

    const confirmLabel =
      action === "ban" ? "Ban" : action === "suspend" ? "Suspend" : user.moderationStatus === "suspended" ? "Unsuspend" : "Unban";
    const subtitle =
      action === "reactivate" ? "The user will be active again" : "This action cannot be undone";

    setConfirmConfig({
      title: "Are you sure want to delete this item ?",
      subtitle,
      confirmLabel,
      onConfirm: async () => {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Authentication required.");
        }

        const payload =
          action === "suspend"
            ? { action: "suspend", reason: "", suspended_until: buildSuspendUntilIso(7) }
            : { action, reason: "" };

        const response = await fetchJson<
          ApiEnvelope<{
            moderation_status: ModerationStatus;
            suspended_until: string | null;
          }>
        >(`/api/moderator/users/${userId}/moderate/`, token, {
          method: "PATCH",
          headers: buildHeaders(token, true),
          body: JSON.stringify(payload),
        });

        const data = unwrapData(response);
        setUsers((prev) =>
          prev.map((entry) =>
            entry.id === userId
              ? {
                  ...entry,
                  moderationStatus: data.moderation_status,
                  suspendedUntil: formatDate(data.suspended_until),
                }
              : entry,
          ),
        );
      },
    });
  };

  const statCards = [
    { label: "Members", value: statsLoading ? "..." : formatCompactNumber(stats.members) },
    { label: "Groups", value: statsLoading ? "..." : formatCompactNumber(stats.groups) },
    { label: "Visitors", value: statsLoading ? "..." : formatCompactNumber(stats.visitors) },
    { label: "Posts", value: statsLoading ? "..." : formatCompactNumber(stats.posts) },
  ];

  return (
    <>
      <LeftSidebar activePage="home" />

      <main
        className="min-h-screen overflow-x-hidden px-4 py-8 sm:px-8 md:pl-24 lg:px-16 lg:pl-28 lg:py-10"
        style={{ backgroundColor: "#E3D9C4" }}
      >
        <div className="w-[138.9%] origin-top-left scale-[0.72] sm:w-full sm:scale-100">
          <div className="mb-8 flex items-center gap-6">
            <img
              src={moderatorProfile.avatar}
              alt="profile"
              className="h-20 w-20 rounded-full object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#3b2314" }}>
                {profileLoading ? "Loading..." : moderatorProfile.name}
              </h1>
              <p className="text-sm" style={{ color: "#8b6a46" }}>
                {profileLoading ? "@moderator" : moderatorProfile.username}
              </p>
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
            <div className="flex flex-wrap gap-10">
              {statCards.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#3b2314" }}>
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: "#8b6a46" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {effectiveTab === "Users" && (
              <button
                onClick={handleToggleEditRoles}
                className="mt-2 rounded-[11px] px-6 py-2 font-semibold text-white shadow-sm transition-colors hover:opacity-90 hover:shadow-md md:mt-0"
                style={{ backgroundColor: "#3b2314" }}
              >
                {isEditingRoles ? "< Back" : "Edit roles"}
              </button>
            )}
          </div>

          <div className="rounded-3xl p-6 shadow-sm sm:p-8" style={{ backgroundColor: "#FFF8E2" }}>
            {pageError && (
              <div
                className="mb-6 rounded-2xl px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: "#EAD7C9", color: "#7A3E18" }}
              >
                {pageError}
              </div>
            )}

            {isEditingRoles && (
              <h2 className="mb-6 text-lg font-semibold sm:text-xl" style={{ color: "#3b2314" }}>
                Edit roles
              </h2>
            )}

            {!isEditingRoles && (
              <div className="mb-6 flex gap-8 border-b border-gray-200">
                {(["Users", "Groups"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`pb-2 text-base font-semibold transition-all ${
                      activeTab === tab ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-6">
              <div
                className="flex w-full max-w-xs items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: "#E3D9C4" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#8b6a46" viewBox="0 0 24 24">
                  <path
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    stroke="#8b6a46"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {!isEditingRoles ? (
              isGroupsTab ? (
                <div
                  className="mb-3 grid px-4 text-[11px] sm:text-sm"
                  style={{ color: "#3b2314", gridTemplateColumns: groupsGridTemplate }}
                >
                  <span className="col-span-2 font-bold">Groups</span>
                  <span className="font-bold">Members</span>
                  <span className="font-bold">Posts</span>
                  <span className="font-bold">Created</span>
                  <span className="col-span-2 text-right"> </span>
                </div>
              ) : (
                <div
                  className="mb-3 grid px-4 text-[11px] sm:text-sm"
                  style={{ color: "#3b2314", gridTemplateColumns: usersGridTemplate }}
                >
                  <span className="col-span-2 font-bold">Accounts</span>
                  <span className="font-bold">Posts</span>
                  <span className="font-bold">Joined</span>
                  <span className="font-bold">Expertise</span>
                  <span className="font-bold">Role</span>
                  <span className="font-bold">Suspended until</span>
                  <span className="text-right"> </span>
                </div>
              )
            ) : (
              <div
                className="mb-3 grid px-4 text-[11px] sm:text-sm"
                style={{ color: "#3b2314", gridTemplateColumns: usersGridTemplate }}
              >
                <span className="col-span-2 font-bold">Accounts</span>
                <span className="font-bold">Posts</span>
                <span className="font-bold">Joined</span>
                <span className="font-bold">Expertise</span>
                <span className="font-bold">Role</span>
                <span className="font-bold">Suspended until</span>
                <span className="text-right"> </span>
              </div>
            )}

            {listLoading ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold sm:text-lg" style={{ color: "#3b2314" }}>
                  Loading...
                </p>
              </div>
            ) : listData.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold sm:text-lg" style={{ color: "#3b2314" }}>
                  No results found
                </p>
                <p className="mt-1 text-sm" style={{ color: "#8b6a46" }}>
                  Try a different name.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pageItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid items-center rounded-2xl px-3 py-3 text-[11px] sm:px-4 sm:text-sm"
                    style={{
                      backgroundColor: "#FFF8E2",
                      gridTemplateColumns: isGroupsTab && !isEditingRoles ? groupsGridTemplate : usersGridTemplate,
                    }}
                  >
                    <div className="col-span-2 flex min-w-0 items-center gap-2 pr-2">
                      <img src={item.avatar} alt={item.name} className="h-9 w-9 shrink-0 rounded-full" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold sm:text-sm" style={{ color: "#3b2314" }}>
                          {item.name}
                        </p>
                        {!isGroupsTab && "username" in item && (
                          <p className="truncate text-[11px] sm:text-xs" style={{ color: "#8b6a46" }}>
                            {item.username}
                          </p>
                        )}
                      </div>
                    </div>

                    {isEditingRoles ? (
                      <>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"posts" in item ? formatCompactNumber(item.posts) : ""}
                        </span>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"joined" in item ? item.joined : ""}
                        </span>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"expertise" in item ? item.expertise : ""}
                        </span>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"role" in item ? roleLabel(rolesByUserId[item.id] ?? item.role) : ""}
                        </span>
                        <span
                          className="w-fit max-w-full truncate rounded-full px-2 py-1 text-[11px] sm:px-4 sm:text-xs"
                          style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
                        >
                          {"suspendedUntil" in item ? item.suspendedUntil || "Active" : ""}
                        </span>
                        <div className="relative flex justify-end">
                          <button
                            onClick={() => setOpenRoleMenuId((value) => (value === item.id ? null : item.id))}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[11px] px-3 py-1.5 text-[11px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                            style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
                          >
                            Edit role
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M6 9l6 6 6-6"
                                stroke="#3b2314"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>

                          {openRoleMenuId === item.id && (
                            <>
                              <button
                                aria-label="Close role menu"
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={() => setOpenRoleMenuId(null)}
                              />
                              <div
                                className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border shadow-md"
                                style={{ backgroundColor: "#FFF8E2", borderColor: "#E3D9C4" }}
                              >
                                {(["admin", "moderator", "user"] as UserRole[]).map((role, index) => (
                                  <div key={role}>
                                    <button
                                      onClick={() => {
                                        setRole(item.id, role);
                                        setOpenRoleMenuId(null);
                                      }}
                                      className="w-full px-5 py-4 text-left font-semibold transition-colors hover:opacity-90"
                                      style={{ color: "#3b2314" }}
                                    >
                                      Set as {roleLabel(role).toLowerCase()}
                                    </button>
                                    {index < 2 && <div style={{ height: 1, backgroundColor: "#E3D9C4" }} />}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    ) : isGroupsTab ? (
                      <>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"members" in item ? formatCompactNumber(item.members) : ""}
                        </span>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"posts" in item ? formatCompactNumber(item.posts) : ""}
                        </span>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"created" in item ? item.created : ""}
                        </span>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="whitespace-nowrap rounded-[11px] px-2.5 py-1.5 text-[10px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:px-4 sm:py-2 sm:text-sm"
                            style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
                          >
                            See members
                          </button>
                        </div>
                        <div className="flex items-center justify-end">
                          <button
                            className="whitespace-nowrap text-[10px] font-semibold opacity-50 sm:text-sm"
                            style={{ color: "#3b2314" }}
                            disabled
                            title="No delete group API is available yet."
                          >
                            Delete group
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"posts" in item ? formatCompactNumber(item.posts) : ""}
                        </span>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"joined" in item ? item.joined : ""}
                        </span>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"expertise" in item ? item.expertise : ""}
                        </span>
                        <span className="truncate" style={{ color: "#5b4630" }}>
                          {"role" in item ? roleLabel(rolesByUserId[item.id] ?? item.role) : ""}
                        </span>
                        <span
                          className="w-fit max-w-full truncate rounded-full px-2 py-1 text-[11px] sm:px-4 sm:text-xs"
                          style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
                        >
                          {"suspendedUntil" in item ? item.suspendedUntil || "Active" : ""}
                        </span>
                        {"moderationStatus" in item && item.moderationStatus === "active" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:px-4 sm:text-sm"
                              style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                              onClick={() => openModerationConfirm(item.id, "suspend")}
                            >
                              Suspend
                            </button>
                            <button
                              className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:px-4 sm:text-sm"
                              style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                              onClick={() => openModerationConfirm(item.id, "ban")}
                            >
                              Ban
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end">
                            <button
                              className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold sm:px-4 sm:text-sm"
                              style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                              onClick={() => openModerationConfirm(item.id, "reactivate")}
                            >
                              {"moderationStatus" in item && item.moderationStatus === "suspended" ? "Suspended" : "Banned"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!listLoading && listData.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-[11px] border text-sm disabled:cursor-not-allowed"
                  style={{
                    borderColor: "#c8b79a",
                    color: "#8b6a46",
                    opacity: safeCurrentPage === 1 ? 0.45 : 1,
                  }}
                >
                  {"<"}
                </button>

                {visiblePages[0] > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="h-8 w-8 rounded-[11px] text-sm font-semibold transition-all hover:opacity-90 hover:shadow-md"
                      style={{ backgroundColor: "#E3D9C4", color: "#8b6a46" }}
                    >
                      1
                    </button>
                    {visiblePages[0] > 2 && <span style={{ color: "#8b6a46" }}>...</span>}
                  </>
                )}

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-[11px] text-sm font-semibold transition-all hover:opacity-90 hover:shadow-md ${
                      safeCurrentPage === page ? "text-white" : ""
                    }`}
                    style={
                      safeCurrentPage === page
                        ? { backgroundColor: "#3b2314" }
                        : { backgroundColor: "#E3D9C4", color: "#8b6a46" }
                    }
                  >
                    {page}
                  </button>
                ))}

                {visiblePages[visiblePages.length - 1] < totalPages && (
                  <>
                    {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                      <span style={{ color: "#8b6a46" }}>...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="h-8 w-8 rounded-[11px] text-sm font-semibold transition-all hover:opacity-90 hover:shadow-md"
                      style={{ backgroundColor: "#E3D9C4", color: "#8b6a46" }}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-[11px] border text-sm disabled:cursor-not-allowed"
                  style={{
                    borderColor: "#c8b79a",
                    color: "#8b6a46",
                    opacity: safeCurrentPage === totalPages ? 0.45 : 1,
                  }}
                >
                  {">"}
                </button>
              </div>
            )}
          </div>
        </div>

        {confirmConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 px-4">
            <div className="relative w-full max-w-[315px] overflow-hidden rounded-[21px] bg-white px-6 pb-6 pt-7 shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: "#111111" }} />

              <div
                className="mx-auto mb-6 flex h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] text-5xl font-black leading-none"
                style={{ borderColor: "#111111", color: "#111111" }}
              >
                !
              </div>

              <p className="text-center text-[1.25rem] font-medium leading-tight" style={{ color: "#111111" }}>
                {confirmConfig.title}
              </p>
              <p className="mt-4 text-center text-[0.95rem]" style={{ color: "#7A7A85" }}>
                {confirmConfig.subtitle}
              </p>

              <button
                onClick={() => void runConfirm()}
                disabled={confirmBusy}
                className="mx-auto mt-7 block w-full max-w-[214px] rounded-[11px] py-2.5 text-center text-xl font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#111111" }}
              >
                {confirmBusy ? "Please wait..." : confirmConfig.confirmLabel}
              </button>

              <button
                onClick={() => !confirmBusy && setConfirmConfig(null)}
                disabled={confirmBusy}
                className="mt-4 w-full rounded-[11px] text-center text-xl font-medium transition-opacity hover:opacity-70 disabled:opacity-60"
                style={{ color: "#111111" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
