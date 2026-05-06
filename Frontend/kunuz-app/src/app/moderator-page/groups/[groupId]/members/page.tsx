"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSidebar from "@/components/LeftSidebar";

const API_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000").replace(/\/$/, "");

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
  isGroupAdmin: boolean;
};

type GroupMember = {
  id: string;
  username: string;
  display_name: string;
  profile_picture?: string;
  is_admin: boolean;
  role: string;
};

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: Record<string, unknown>;
};

type PaginatedPayload<T> = {
  count?: number;
  next?: string | null;
  results?: T[];
};

type MePayload = {
  username?: string | null;
  display_name?: string | null;
  profile_picture?: string | null;
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
  suspended_until: string | null;
  created_at: string;
  post_count: number;
};

type BackendGroup = {
  count?: number;
  name?: string;
  profile_picture?: string;
};

type ModeratorProfile = {
  name: string;
  username: string;
  avatar: string;
};

type GroupHeader = {
  name: string;
  avatar: string;
};

type ConfirmConfig = {
  title: string;
  subtitle: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
};

const usersGridTemplate =
  "minmax(0,0.9fr) minmax(0,1.2fr) minmax(0,0.45fr) minmax(0,0.9fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,1.15fr) minmax(0,1.45fr)";

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
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
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

  if (!response.ok) throw new Error(extractErrorMessage(payload, "Request failed."));
  return payload as T;
}

function unwrapData<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload && (payload as ApiEnvelope<T>).data !== undefined) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

function getPaginatedData<T>(payload: unknown): PaginatedPayload<T> {
  if (payload && typeof payload === "object") {
    const envelope = payload as ApiEnvelope<PaginatedPayload<T>>;
    if (envelope.data && typeof envelope.data === "object") return envelope.data;
    return payload as PaginatedPayload<T>;
  }
  return {};
}

async function fetchAllPages<T>(path: string, token: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = `${API_URL}${path}`;

  while (nextUrl) {
    const response: Response = await fetch(nextUrl, { headers: buildHeaders(token) });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(extractErrorMessage(payload, "Request failed."));
    const page: PaginatedPayload<T> = getPaginatedData<T>(payload);
    results.push(...(page.results ?? []));
    nextUrl = page.next ?? null;
  }

  return results;
}

function resolveMediaUrl(value: string | null | undefined) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) return value;
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

function isSuspensionCurrent(user: Pick<UserRow, "moderationStatus" | "suspendedUntil">) {
  if (user.moderationStatus !== "suspended" || !user.suspendedUntil) return false;
  const date = new Date(user.suspendedUntil);
  return !Number.isNaN(date.getTime()) && date > new Date();
}

function effectiveModerationStatus(user: Pick<UserRow, "moderationStatus" | "suspendedUntil">): ModerationStatus {
  if (user.moderationStatus === "suspended" && !isSuspensionCurrent(user)) return "active";
  return user.moderationStatus;
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

function moderationDateLabel(user: UserRow) {
  const status = effectiveModerationStatus(user);
  if (status === "suspended") {
    return user.suspendedUntil ? `Suspended until ${formatDate(user.suspendedUntil)}` : "Suspended";
  }
  if (status === "banned") return "Banned";
  return "Active";
}

function buildSuspendUntilIso(dateString?: string) {
  if (dateString) return new Date(`${dateString}T23:59:59.999`).toISOString();
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

export default function ModeratorGroupMembersPage() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);
  const [suspendDateById, setSuspendDateById] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<UserRow[]>([]);
  const [moderatorProfile, setModeratorProfile] = useState<ModeratorProfile>({
    name: "Moderator",
    username: "@moderator",
    avatar: fallbackAvatar("Moderator"),
  });
  const [groupHeader, setGroupHeader] = useState<GroupHeader>({
    name: "Group members",
    avatar: fallbackAvatar("Group"),
  });
  const [stats, setStats] = useState({
    members: 0,
    groups: 0,
    visitors: 0,
    posts: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      const token = getAuthToken();
      if (!token) {
        setPageError("You need to be logged in as a moderator to view this page.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [mePayload, statsPayload, groupPagePayload, groupDetailPayload, groupMembers, moderatorUsers] = await Promise.all([
          fetchJson<ApiEnvelope<MePayload>>("/api/users/me/", token),
          fetchJson<ApiEnvelope<StatsPayload>>("/api/moderator/stats/", token),
          fetchJson<ApiEnvelope<BackendGroup>>("/api/groups/?page=1&page_size=1", token),
          fetchJson<ApiEnvelope<BackendGroup>>(`/api/groups/${groupId}/`, token),
          fetchJson<ApiEnvelope<GroupMember[]>>(`/api/groups/${groupId}/members/`, token),
          fetchAllPages<BackendModeratorUser>("/api/moderator/users/", token),
        ]);

        if (cancelled) return;

        const me = unwrapData(mePayload);
        const platformStats = unwrapData(statsPayload);
        const groupPage = unwrapData(groupPagePayload);
        const groupDetail = unwrapData(groupDetailPayload);
        const rawMembers = unwrapData(groupMembers);
        const memberById = new Map(rawMembers.map((member) => [member.id, member]));
        const userById = new Map(moderatorUsers.map((user) => [user.id, user]));

        setModeratorProfile({
          name: me.display_name || me.username || "Moderator",
          username: me.username ? `@${me.username}` : "@moderator",
          avatar: resolveMediaUrl(me.profile_picture) || fallbackAvatar(me.display_name || me.username || "Moderator"),
        });
        setGroupHeader({
          name: groupDetail.name || "Group members",
          avatar: resolveMediaUrl(groupDetail.profile_picture) || fallbackAvatar(groupDetail.name || "Group"),
        });
        setStats({
          members: platformStats.members ?? 0,
          groups: groupPage.count ?? 0,
          visitors: platformStats.visitors ?? 0,
          posts: platformStats.posts ?? 0,
        });
        setMembers(
          rawMembers.map((member) => {
            const user = userById.get(member.id);
            return {
              id: member.id,
              name: user?.display_name || member.display_name || member.username || "Unknown user",
              username: user?.username ? `@${user.username}` : member.username ? `@${member.username}` : "",
              avatar: resolveMediaUrl(user?.profile_picture || member.profile_picture) || fallbackAvatar(member.display_name || member.username),
              posts: user?.post_count ?? 0,
              joined: formatDate(user?.created_at),
              expertise: expertiseLabel(user?.expertise),
              suspendedUntil: user?.suspended_until ?? "",
              moderationStatus: user?.moderation_status ?? "active",
              role: user?.role ?? "user",
              isGroupAdmin: memberById.get(member.id)?.is_admin ?? false,
            };
          }),
        );
        setPageError("");
      } catch (error) {
        if (!cancelled) setPageError(error instanceof Error ? error.message : "Failed to load group members.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPageData();

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return members;
    return members.filter((member) => {
      return member.name.toLowerCase().includes(value) || member.username.toLowerCase().includes(value);
    });
  }, [members, search]);

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

  const openModerationConfirm = (userId: string, action: "ban" | "suspend" | "unsuspend" | "unban") => {
    const user = members.find((entry) => entry.id === userId);
    if (!user) return;

    const confirmLabel = action === "ban" ? "Ban" : action === "suspend" ? "Suspend" : action === "unsuspend" ? "Unsuspend" : "Unban";
    setConfirmConfig({
      title: `Are you sure you want to ${confirmLabel.toLowerCase()} this user?`,
      subtitle:
        action === "suspend"
          ? "The user will be blocked from logging in until the selected date passes."
          : action === "ban"
            ? "The user will be permanently blocked from logging in."
            : "The user will be active again.",
      confirmLabel,
      onConfirm: async () => {
        const token = getAuthToken();
        const payload =
          action === "suspend"
            ? { action: "suspend", reason: "", suspended_until: buildSuspendUntilIso(suspendDateById[userId]) }
            : { action, reason: "" };
        const response = await fetchJson<ApiEnvelope<{ moderation_status: ModerationStatus; suspended_until: string | null }>>(
          `/api/moderator/users/${userId}/moderate/`,
          token,
          {
            method: "PATCH",
            headers: buildHeaders(token, true),
            body: JSON.stringify(payload),
          },
        );
        const data = unwrapData(response);
        setMembers((prev) =>
          prev.map((entry) =>
            entry.id === userId
              ? { ...entry, moderationStatus: data.moderation_status, suspendedUntil: data.suspended_until ?? "" }
              : entry,
          ),
        );
        setSuspendDateById((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      },
    });
  };

  const openRemoveConfirm = (user: UserRow) => {
    setConfirmConfig({
      title: "Remove member?",
      subtitle: `Remove ${user.name} from this group?`,
      confirmLabel: "Remove",
      onConfirm: async () => {
        const token = getAuthToken();
        await fetchJson<ApiEnvelope<null>>(`/api/groups/${groupId}/members/${user.id}/`, token, { method: "DELETE" });
        setMembers((prev) => prev.filter((member) => member.id !== user.id));
      },
    });
  };

  const statCards = [
    { label: "Members", value: formatCompactNumber(stats.members) },
    { label: "Groups", value: formatCompactNumber(stats.groups) },
    { label: "Visitors", value: formatCompactNumber(stats.visitors) },
    { label: "Posts", value: formatCompactNumber(stats.posts) },
  ];

  return (
    <>
      <LeftSidebar activePage="moderator" />

      <main
        className="min-h-screen overflow-x-hidden px-4 py-8 pb-24 sm:px-8 md:pl-24 lg:pl-28 lg:pr-16 lg:py-10"
        style={{ backgroundColor: "#E3D9C4" }}
      >
        <div className="w-full">
          <div className="mb-8 flex items-center gap-4 sm:gap-6">
            <img src={moderatorProfile.avatar} alt="profile" className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20" />
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "#3b2314" }}>
                {moderatorProfile.name}
              </h1>
              <p className="text-sm" style={{ color: "#8b6a46" }}>
                {moderatorProfile.username}
              </p>
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
            <div className="grid w-full grid-cols-2 gap-4 sm:flex sm:w-auto sm:flex-wrap sm:gap-10">
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

            <button
              onClick={() => router.push("/moderator-page")}
              className="mt-2 rounded-[11px] px-6 py-2 font-semibold text-white shadow-sm transition-colors hover:opacity-90 hover:shadow-md md:mt-0"
              style={{ backgroundColor: "#3b2314" }}
            >
              &lt; Back
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl p-4 shadow-sm sm:p-8" style={{ backgroundColor: "#FFF8E2" }}>
            {pageError && (
              <div className="mb-6 rounded-2xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: "#EAD7C9", color: "#7A3E18" }}>
                {pageError}
              </div>
            )}

            <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
              <img src={groupHeader.avatar} alt={groupHeader.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold" style={{ color: "#3b2314" }}>
                  {groupHeader.name}
                </h2>
                <p className="text-xs font-medium" style={{ color: "#8b6a46" }}>
                  Members
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex w-full max-w-xs items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "#E3D9C4" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#8b6a46" viewBox="0 0 24 24">
                  <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="#8b6a46" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="mb-3 grid px-4 text-[11px] sm:text-sm" style={{ color: "#3b2314", gridTemplateColumns: usersGridTemplate, minWidth: "920px" }}>
              <span className="col-span-2 font-bold">Accounts</span>
              <span className="font-bold">Posts</span>
              <span className="font-bold">Joined</span>
              <span className="font-bold">Expertise</span>
              <span className="font-bold">Role</span>
              <span className="font-bold">Suspended until</span>
              <span className="text-right"> </span>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold sm:text-lg" style={{ color: "#3b2314" }}>
                  Loading...
                </p>
              </div>
            ) : filteredMembers.length === 0 ? (
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
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="grid items-center rounded-2xl px-3 py-3 text-[11px] sm:px-4 sm:text-sm"
                    style={{ backgroundColor: "#FFF8E2", gridTemplateColumns: usersGridTemplate, minWidth: "920px" }}
                  >
                    <button
                      type="button"
                      onClick={() => member.username && router.push(`/user/${member.username.replace(/^@/, "")}`)}
                      className="col-span-2 flex min-w-0 items-center gap-2 pr-2 text-left transition-opacity hover:opacity-80"
                    >
                      <img src={member.avatar} alt={member.name} className="h-9 w-9 shrink-0 rounded-full" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold sm:text-sm" style={{ color: "#3b2314" }}>
                          {member.name}
                        </p>
                        <p className="truncate text-[11px] sm:text-xs" style={{ color: "#8b6a46" }}>
                          {member.username}
                        </p>
                      </div>
                    </button>

                    <span className="truncate" style={{ color: "#5b4630" }}>
                      {formatCompactNumber(member.posts)}
                    </span>
                    <span className="truncate" style={{ color: "#5b4630" }}>
                      {member.joined}
                    </span>
                    <span className="truncate" style={{ color: "#5b4630" }}>
                      {member.expertise}
                    </span>
                    <span className="truncate" style={{ color: "#5b4630" }}>
                      {roleLabel(member.role)}
                    </span>
                    <div className="flex items-center gap-1">
                      {effectiveModerationStatus(member) === "active" ? (
                        <input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={suspendDateById[member.id] || ""}
                          onChange={(event) => setSuspendDateById((prev) => ({ ...prev, [member.id]: event.target.value }))}
                          onClick={(event) => event.stopPropagation()}
                          className="rounded-full px-3 py-2 text-[12px] outline-none border-none"
                          style={{ backgroundColor: "#E3D9C4", color: "#8b6a46", width: "140px", colorScheme: "light" }}
                        />
                      ) : (
                        <span
                          className="w-fit max-w-full truncate rounded-full px-2 py-1 text-[11px] sm:px-4 sm:text-xs"
                          style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
                        >
                          {moderationDateLabel(member)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {effectiveModerationStatus(member) === "active" ? (
                        <>
                          <button
                            className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:px-4 sm:text-sm"
                            style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                            onClick={() => {
                              if (!suspendDateById[member.id]) {
                                alert("Please select a suspension end date first.");
                                return;
                              }
                              openModerationConfirm(member.id, "suspend");
                            }}
                          >
                            Suspend
                          </button>
                          <button
                            className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:px-4 sm:text-sm"
                            style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                            onClick={() => openModerationConfirm(member.id, "ban")}
                          >
                            Ban
                          </button>
                        </>
                      ) : (
                        <button
                          className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold sm:px-4 sm:text-sm"
                          style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                          onClick={() => openModerationConfirm(member.id, effectiveModerationStatus(member) === "suspended" ? "unsuspend" : "unban")}
                        >
                          {effectiveModerationStatus(member) === "suspended" ? "Unsuspend" : "Unban"}
                        </button>
                      )}
                      {!member.isGroupAdmin && (
                        <button
                          className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:px-4 sm:text-sm"
                          style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
                          onClick={() => openRemoveConfirm(member)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {confirmConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 px-4">
            <div className="relative w-full max-w-[315px] overflow-hidden rounded-[21px] bg-white px-6 pb-6 pt-7 shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: "#111111" }} />
              <div className="mx-auto mb-6 flex h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] text-5xl font-black leading-none" style={{ borderColor: "#111111", color: "#111111" }}>
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
