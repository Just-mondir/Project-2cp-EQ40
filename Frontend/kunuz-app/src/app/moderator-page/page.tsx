"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  expertiseValue: string;
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
  category: string;
  region: string;
  historicalPeriod: string;
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
  category?: string;
  region?: string;
  historical_period?: string;
};

type UserFilters = {
  role: "all" | "user" | "moderator";
  moderationStatus: "all" | "suspended" | "banned";
  expertise: "all" | "amateur" | "student" | "researcher" | "historian" | "guide";
};

type GroupFilters = {
  category: string;
  region: string;
  historicalPeriod: string;
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

function normalizeExpertiseValue(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "tour guide" || normalized === "tour_guide") return "guide";
  return normalized;
}

function buildSuspendUntilIso(dateString?: string) {
  if (dateString) return new Date(dateString).toISOString();
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

function moderationDateLabel(user: UserRow) {
  if (user.moderationStatus === "suspended") {
    return user.suspendedUntil ? `Suspended until ${user.suspendedUntil}` : "Suspended";
  }
  if (user.moderationStatus === "banned") return "Banned";
  return "Active";
}

const defaultUserFilters: UserFilters = {
  role: "all",
  moderationStatus: "all",
  expertise: "all",
};

const defaultGroupFilters: GroupFilters = {
  category: "all",
  region: "all",
  historicalPeriod: "all",
};

function optionLabel(value: string) {
  if (!value || value === "all") return "All";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function hasUserFilters(filters: UserFilters) {
  return (
    filters.role !== "all" ||
    filters.moderationStatus !== "all" ||
    filters.expertise !== "all"
  );
}

function hasGroupFilters(filters: GroupFilters) {
  return (
    filters.category !== "all" ||
    filters.region !== "all" ||
    filters.historicalPeriod !== "all"
  );
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) => first.localeCompare(second));
}

function ModeratorFilterDropdown({
  isVisible,
  isGroupsTab,
  userFilters,
  groupFilters,
  groupOptions,
  onUserFilterChange,
  onGroupFilterChange,
  onApply,
  onReset,
  onClose,
}: {
  isVisible: boolean;
  isGroupsTab: boolean;
  userFilters: UserFilters;
  groupFilters: GroupFilters;
  groupOptions: {
    categories: string[];
    regions: string[];
    historicalPeriods: string[];
  };
  onUserFilterChange: (filters: UserFilters) => void;
  onGroupFilterChange: (filters: GroupFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const selectClass =
    "w-full text-[11px] px-4 py-3 outline-none cursor-pointer appearance-none transition-all duration-300";
  const selectStyle = {
    backgroundColor: "#FFF8E2",
    border: "1.5px solid #D8C8B1",
    borderRadius: "14px",
    color: "#3b2314",
    fontWeight: "700",
  };

  const renderSelect = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void,
  ) => (
    <div className="flex flex-col gap-2">
      <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: "#8b6a46" }}>
        {label}
      </label>
      <div className="relative group w-full">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b2314" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`absolute right-0 top-[52px] z-[60] w-[340px] overflow-hidden transition-all duration-400 origin-top-right ${
        isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-4 pointer-events-none"
      }`}
      style={{
        backgroundColor: "#FFF8E2",
        borderRadius: "28px",
        boxShadow: "0 25px 60px rgba(67,40,23,0.2)",
        border: "1.5px solid #D8C8B1",
      }}
    >
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#D8C8B1" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E3D9C4" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b2314" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "#3b2314" }}>
            Filters
          </h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b2314" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col max-h-[50vh]">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            {isGroupsTab ? (
              <>
                {renderSelect(
                  "Category",
                  groupFilters.category,
                  [{ value: "all", label: "All" }, ...groupOptions.categories.map((value) => ({ value, label: optionLabel(value) }))],
                  (value) => onGroupFilterChange({ ...groupFilters, category: value }),
                )}
                {renderSelect(
                  "Region",
                  groupFilters.region,
                  [{ value: "all", label: "All" }, ...groupOptions.regions.map((value) => ({ value, label: optionLabel(value) }))],
                  (value) => onGroupFilterChange({ ...groupFilters, region: value }),
                )}
                {renderSelect(
                  "Historical Period",
                  groupFilters.historicalPeriod,
                  [{ value: "all", label: "All" }, ...groupOptions.historicalPeriods.map((value) => ({ value, label: optionLabel(value) }))],
                  (value) => onGroupFilterChange({ ...groupFilters, historicalPeriod: value }),
                )}
              </>
            ) : (
              <>
                {renderSelect(
                  "Role",
                  userFilters.role,
                  [
                    { value: "all", label: "All" },
                    { value: "user", label: "User" },
                    { value: "moderator", label: "Moderator" },
                  ],
                  (value) => onUserFilterChange({ ...userFilters, role: value as UserFilters["role"] }),
                )}
                {renderSelect(
                  "Moderation Status",
                  userFilters.moderationStatus,
                  [
                    { value: "all", label: "All" },
                    { value: "suspended", label: "Suspended" },
                    { value: "banned", label: "Banned" },
                  ],
                  (value) => onUserFilterChange({ ...userFilters, moderationStatus: value as UserFilters["moderationStatus"] }),
                )}
                {renderSelect(
                  "Expertise",
                  userFilters.expertise,
                  [
                    { value: "all", label: "All" },
                    { value: "amateur", label: "Amateur" },
                    { value: "student", label: "Student" },
                    { value: "researcher", label: "Researcher" },
                    { value: "historian", label: "Historian" },
                    { value: "guide", label: "Tour Guide" },
                  ],
                  (value) => onUserFilterChange({ ...userFilters, expertise: value as UserFilters["expertise"] }),
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex gap-2 border-t" style={{ backgroundColor: "#F5EFE0", borderColor: "#D8C8B1" }}>
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:bg-black/5"
          style={{ border: "1.5px solid #D8C8B1", color: "#3b2314" }}
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="flex-[2] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:shadow-lg border border-transparent"
          style={{ backgroundColor: "#3b2314", color: "#FFF8E2" }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export default function ModeratorUsers() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Users" | "Groups">("Users");
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftUserFilters, setDraftUserFilters] = useState<UserFilters>(defaultUserFilters);
  const [appliedUserFilters, setAppliedUserFilters] = useState<UserFilters>(defaultUserFilters);
  const [draftGroupFilters, setDraftGroupFilters] = useState<GroupFilters>(defaultGroupFilters);
  const [appliedGroupFilters, setAppliedGroupFilters] = useState<GroupFilters>(defaultGroupFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [suspendDateById, setSuspendDateById] = useState<Record<string, string>>({});
  const [listLoading, setListLoading] = useState(true);
  const [groupToDelete, setGroupToDelete] = useState<GroupRow | null>(null);
const [deletingGroup, setDeletingGroup] = useState(false);
const [groupMembersPopup, setGroupMembersPopup] = useState<GroupRow | null>(null);
const [popupMembers, setPopupMembers] = useState<{ id: string; username: string; display_name: string; profile_picture?: string; is_admin: boolean; role: string }[]>([]);
const [popupMembersLoading] = useState(false);
const [popupRemoving, setPopupRemoving] = useState<string | null>(null);

const [popupMemberToRemove, setPopupMemberToRemove] = useState<{
  id: string; username: string; display_name: string; profile_picture?: string; is_admin: boolean; role: string;
} | null>(null);

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
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        if (appliedUserFilters.role !== "all" && user.role !== appliedUserFilters.role) return false;
        if (
          appliedUserFilters.moderationStatus !== "all" &&
          user.moderationStatus !== appliedUserFilters.moderationStatus
        ) {
          return false;
        }
        if (
          appliedUserFilters.expertise !== "all" &&
          normalizeExpertiseValue(user.expertiseValue || user.expertise) !== appliedUserFilters.expertise
        ) {
          return false;
        }
        return true;
      }),
    [appliedUserFilters, users],
  );
  const filteredGroups = useMemo(
    () =>
      groups.filter((group) => {
        if (appliedGroupFilters.category !== "all" && group.category !== appliedGroupFilters.category) return false;
        if (appliedGroupFilters.region !== "all" && group.region !== appliedGroupFilters.region) return false;
        if (
          appliedGroupFilters.historicalPeriod !== "all" &&
          group.historicalPeriod !== appliedGroupFilters.historicalPeriod
        ) {
          return false;
        }
        return true;
      }),
    [appliedGroupFilters, groups],
  );
  const groupFilterOptions = useMemo(
    () => ({
      categories: uniqueOptions(groups.map((group) => group.category)),
      regions: uniqueOptions(groups.map((group) => group.region)),
      historicalPeriods: uniqueOptions(groups.map((group) => group.historicalPeriod)),
    }),
    [groups],
  );
  const listData = isGroupsTab ? filteredGroups : filteredUsers;
  const hasActiveFilters = isGroupsTab ? hasGroupFilters(appliedGroupFilters) : hasUserFilters(appliedUserFilters);
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
            expertiseValue: normalizeExpertiseValue(user.expertise),
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
            category: group.category ?? "",
            region: group.region ?? "",
            historicalPeriod: group.historical_period ?? "",
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
    setIsFilterOpen(false);
    setCurrentPage(1);
    setOpenRoleMenuId(null);
    if (tab === "Groups") {
      setIsEditingRoles(false);
      setEditStartRolesByUserId(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setIsFilterOpen(false);
    setCurrentPage(1);
    setOpenRoleMenuId(null);
  };

  const handleApplyFilters = () => {
    if (isGroupsTab) {
      setAppliedGroupFilters(draftGroupFilters);
    } else {
      setAppliedUserFilters(draftUserFilters);
    }
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    if (isGroupsTab) {
      setDraftGroupFilters(defaultGroupFilters);
      setAppliedGroupFilters(defaultGroupFilters);
    } else {
      setDraftUserFilters(defaultUserFilters);
      setAppliedUserFilters(defaultUserFilters);
    }
    setCurrentPage(1);
    setIsFilterOpen(false);
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

  const openModerationConfirm = (userId: string, action: "ban" | "suspend" | "unsuspend" | "unban") => {
    const user = users.find((entry) => entry.id === userId);
    if (!user) return;

    const confirmLabel =
      action === "ban" ? "Ban" : action === "suspend" ? "Suspend" : action === "unsuspend" ? "Unsuspend" : "Unban";
    const subtitle =
      action === "unsuspend" || action === "unban"
        ? "The user will be active again."
        : action === "suspend"
          ? "The user will be blocked from logging in until the selected date passes."
          : "The user will be permanently blocked from logging in.";

    setConfirmConfig({
      title: `Are you sure you want to ${confirmLabel.toLowerCase()} this user?`,
      subtitle,
      confirmLabel,
      onConfirm: async () => {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Authentication required.");
        }

        const payload =
          action === "suspend"
            ? { action: "suspend", reason: "", suspended_until: buildSuspendUntilIso(suspendDateById[userId]) }
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

const handlePopupRemove = async (memberId: string) => {
  if (!groupMembersPopup) return;
  setPopupRemoving(memberId);
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_URL}/api/groups/${groupMembersPopup.id}/members/${memberId}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setPopupMembers(prev => prev.filter(m => m.id !== memberId));
      setGroups(prev => prev.map(g => g.id === groupMembersPopup.id ? { ...g, members: g.members - 1 } : g));
    }
  } catch (e) { console.error(e); }
  finally { setPopupRemoving(null); }
};

const statCards = [
    { label: "Members", value: statsLoading ? "..." : formatCompactNumber(stats.members) },
    { label: "Groups", value: statsLoading ? "..." : formatCompactNumber(stats.groups) },
    { label: "Visitors", value: statsLoading ? "..." : formatCompactNumber(stats.visitors) },
    { label: "Posts", value: statsLoading ? "..." : formatCompactNumber(stats.posts) },
  ];

  return (
    <>
      <LeftSidebar activePage="moderator" />

      <main
        className="min-h-screen overflow-x-hidden px-4 py-8 pb-24 sm:px-8 md:pl-24 lg:pl-28 lg:pr-16 lg:py-10"
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

            <div className="relative mb-6 w-full max-w-xs">
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
                <button
                  type="button"
                  onClick={() => {
                    if (!isFilterOpen) {
                      setDraftUserFilters(appliedUserFilters);
                      setDraftGroupFilters(appliedGroupFilters);
                    }
                    setIsFilterOpen((value) => !value);
                  }}
                  className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                  aria-label="Toggle filters"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b2314" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                    <circle cx="8" cy="6" r="1.5" fill="#3b2314" />
                    <circle cx="16" cy="12" r="1.5" fill="#3b2314" />
                    <circle cx="10" cy="18" r="1.5" fill="#3b2314" />
                  </svg>
                  {hasActiveFilters && (
                    <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#8B6914" }} />
                  )}
                </button>
              </div>
              <ModeratorFilterDropdown
                isVisible={isFilterOpen}
                isGroupsTab={isGroupsTab}
                userFilters={draftUserFilters}
                groupFilters={draftGroupFilters}
                groupOptions={groupFilterOptions}
                onUserFilterChange={setDraftUserFilters}
                onGroupFilterChange={setDraftGroupFilters}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                onClose={() => setIsFilterOpen(false)}
              />
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
                    <button
                      type="button"
                      onClick={() => {
                        if (isGroupsTab && !isEditingRoles) {
                          router.push(`/groups/${item.id}`);
                          return;
                        }
                        if ("username" in item && item.username) {
                          router.push(`/user/${item.username.replace(/^@/, "")}`);
                        }
                      }}
                      className="col-span-2 flex min-w-0 items-center gap-2 pr-2 text-left transition-opacity hover:opacity-80"
                    >
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
                    </button>

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
                       <div className="flex items-center gap-1">
  {"moderationStatus" in item && item.moderationStatus === "active" ? (
    <>
      <input
  type="date"
  min={new Date().toISOString().split("T")[0]}
  value={suspendDateById[item.id] || ""}
  onChange={(e) => setSuspendDateById(prev => ({ ...prev, [item.id]: e.target.value }))}
  onClick={(e) => e.stopPropagation()}
  className="rounded-full px-3 py-2 text-[12px] outline-none border-none"
  style={{ backgroundColor: "#E3D9C4", color: "#8b6a46", width: "140px", colorScheme: "light" }}
/>
    </>
  ) : (
    <span
      className="w-fit max-w-full truncate rounded-full px-2 py-1 text-[11px] sm:px-4 sm:text-xs"
      style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
    >
      {"moderationStatus" in item ? moderationDateLabel(item) : ""}
    </span>
  )}
</div>
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
                                {(["moderator", "user"] as UserRole[]).map((role, index) => (
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
    {index < 1 && <div style={{ height: 1, backgroundColor: "#E3D9C4" }} />}
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
  onClick={() => router.push(`/moderator-page/groups/${item.id}/members`)}
>
  See members
</button>
                        </div>
                        <div className="flex items-center justify-end">
                          <button
  className="whitespace-nowrap text-[10px] font-semibold sm:text-sm"
  style={{ color: "#C0392B" }}
  onClick={() => setGroupToDelete(item as GroupRow)}
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
                        <div className="flex items-center gap-1">
  {"moderationStatus" in item && item.moderationStatus === "active" ? (
    <>
      <input
  type="date"
  min={new Date().toISOString().split("T")[0]}
  value={suspendDateById[item.id] || ""}
  onChange={(e) => setSuspendDateById(prev => ({ ...prev, [item.id]: e.target.value }))}
  onClick={(e) => e.stopPropagation()}
  className="rounded-full px-3 py-2 text-[12px] outline-none border-none"
  style={{ backgroundColor: "#E3D9C4", color: "#8b6a46", width: "140px", colorScheme: "light" }}
/>
    </>
  ) : (
    <span
      className="w-fit max-w-full truncate rounded-full px-2 py-1 text-[11px] sm:px-4 sm:text-xs"
      style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
    >
      {"moderationStatus" in item ? moderationDateLabel(item) : ""}
    </span>
  )}
</div>
                        {"moderationStatus" in item && item.moderationStatus === "active" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:px-4 sm:text-sm"
                              style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                              onClick={() => {
  if (!suspendDateById[item.id]) {
    alert("Please select a suspension end date first.");
    return;
  }
  openModerationConfirm(item.id, "suspend");
}}
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
                              onClick={() =>
                                openModerationConfirm(
                                  item.id,
                                  "moderationStatus" in item && item.moderationStatus === "suspended" ? "unsuspend" : "unban",
                                )
                              }
                            >
                              {"moderationStatus" in item && item.moderationStatus === "suspended" ? "Unsuspend" : "Unban"}
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
        {groupToDelete && (
  <>
    <div
      onClick={() => !deletingGroup && setGroupToDelete(null)}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 200 }}
    />
    <div
      style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => !deletingGroup && setGroupToDelete(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFF8E2",
          borderRadius: "20px",
          padding: "36px 32px 28px",
          width: "400px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "var(--font-lato), 'Lato', sans-serif",
        }}
      >
        {/* Icon */}
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          border: "1.5px solid #C0392B",
          backgroundColor: "rgba(192,57,43,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "16px",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>

        <p style={{ margin: "0 0 6px", color: "#432817", fontWeight: 700, fontSize: "22px", textAlign: "center" }}>
          Delete Group
        </p>
        <p style={{ margin: "0 0 24px", color: "#8B7355", fontSize: "14px", textAlign: "center", lineHeight: 1.5 }}>
          Are you sure you want to delete{" "}
          <span style={{ fontWeight: 700, color: "#432817" }}>{groupToDelete.name}</span>?
          {" "}This action cannot be undone.
        </p>

        <button
          disabled={deletingGroup}
          onClick={async () => {
            setDeletingGroup(true);
            const token = getAuthToken();
            try {
              const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/groups/${groupToDelete.id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok || res.status === 204) {
                setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
                setGroupToDelete(null);
              }
            } catch (e) { console.error(e); }
            finally { setDeletingGroup(false); }
          }}
          style={{
            width: "100%", height: "50px", borderRadius: "10px", border: "none",
            backgroundColor: deletingGroup ? "rgba(192,57,43,0.5)" : "#C0392B",
            color: "#FFFFFF", fontWeight: 700, fontSize: "16px",
            cursor: deletingGroup ? "not-allowed" : "pointer",
          }}
        >
          {deletingGroup ? "Deleting…" : "Yes, delete group"}
        </button>

        <button
          onClick={() => !deletingGroup && setGroupToDelete(null)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#432817", fontWeight: 600, fontSize: "15px",
            marginTop: "12px", opacity: 0.75,
          }}
        >
          Close
        </button>
      </div>
    </div>
  </>
)}
{groupMembersPopup && (
  <>
    <div
      onClick={() => setGroupMembersPopup(null)}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 200 }}
    />
    <div
      style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={() => setGroupMembersPopup(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--panel-bg, #FFF8E2)",
          borderRadius: "20px",
          padding: "28px",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          fontFamily: "var(--font-lato), 'Lato', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span style={{ fontWeight: 700, fontSize: "20px", color: "#432817" }}>
            {groupMembersPopup.name} — Members
          </span>
          <button
            onClick={() => setGroupMembersPopup(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#432817", fontSize: "22px", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ borderBottom: "1px solid #D8C8B1", paddingBottom: "12px", marginBottom: "16px" }}>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "#432817" }}>
            {formatCompactNumber(groupMembersPopup.members)} Members
          </span>
        </div>

        {popupMembersLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8B7355" }}>Loading members…</div>
        ) : popupMembers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8B7355" }}>No members yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {/* Admin first */}
            {popupMembers.filter(m => m.is_admin).map(member => (
              <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", backgroundColor: "var(--panel-bg, #FFF8E2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {member.profile_picture ? (
                    <img src={member.profile_picture} alt={member.display_name} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "#E0D5C5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="#8B7355" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#432817" }}>{member.display_name || member.username}</div>
                    <div style={{ fontSize: "12px", color: "#8B7355" }}>@{member.username} · Admin</div>
                  </div>
                </div>
              </div>
            ))}

            {popupMembers.filter(m => m.is_admin).length > 0 && popupMembers.filter(m => !m.is_admin).length > 0 && (
              <div style={{ borderTop: "1px solid #EDE0CC", margin: "8px 0" }} />
            )}

            {/* Regular members */}
            {popupMembers.filter(m => !m.is_admin).map(member => (
              <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", backgroundColor: "var(--panel-bg, #FFF8E2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {member.profile_picture ? (
                    <img src={member.profile_picture} alt={member.display_name} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "#E0D5C5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="#8B7355" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#432817" }}>{member.display_name || member.username}</div>
                    <div style={{ fontSize: "12px", color: "#8B7355" }}>@{member.username}</div>
                  </div>
                </div>
                <button
  onClick={() => setPopupMemberToRemove(member)}
  disabled={popupRemoving === member.id}
  style={{
    height: "30px", padding: "0 12px",
    backgroundColor: "rgba(67,40,23,0.12)",
    border: "none", borderRadius: "8px",
    fontWeight: 600, fontSize: "12px",
    color: "#432817",
    cursor: "pointer",
    whiteSpace: "nowrap",
  }}
>
  Remove
</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    {popupMemberToRemove && (
  <>
    <div
      onClick={() => setPopupMemberToRemove(null)}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 300 }}
    />
    <div
      style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setPopupMemberToRemove(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFF8E2",
          borderRadius: "20px",
          padding: "36px 32px 28px",
          width: "400px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "var(--font-lato), 'Lato', sans-serif",
        }}
      >
        {/* Icon */}
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          border: "1.5px solid #C0392B",
          backgroundColor: "rgba(192,57,43,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "16px",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="18" y1="8" x2="23" y2="13" />
            <line x1="23" y1="8" x2="18" y2="13" />
          </svg>
        </div>

        <p style={{ margin: "0 0 6px", color: "#432817", fontWeight: 700, fontSize: "22px", textAlign: "center" }}>
          Remove member?
        </p>
        <p style={{ margin: "0 0 24px", color: "#8B7355", fontSize: "14px", textAlign: "center", lineHeight: 1.5 }}>
          Are you sure you want to remove{" "}
          <span style={{ fontWeight: 700, color: "#432817" }}>
            {popupMemberToRemove.display_name || popupMemberToRemove.username}
          </span>{" "}
          from this group?
        </p>

        <button
          disabled={popupRemoving === popupMemberToRemove.id}
          onClick={async () => {
            await handlePopupRemove(popupMemberToRemove.id);
            setPopupMemberToRemove(null);
          }}
          style={{
            width: "100%", height: "50px", borderRadius: "10px", border: "none",
            backgroundColor: popupRemoving === popupMemberToRemove.id ? "rgba(192,57,43,0.5)" : "#C0392B",
            color: "#FFFFFF", fontWeight: 700, fontSize: "16px",
            cursor: popupRemoving === popupMemberToRemove.id ? "not-allowed" : "pointer",
          }}
        >
          {popupRemoving === popupMemberToRemove.id ? "Removing…" : "Remove"}
        </button>

        <button
          onClick={() => setPopupMemberToRemove(null)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#432817", fontWeight: 600, fontSize: "15px",
            marginTop: "12px", opacity: 0.75,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </>
)}
  </>
)}
      </main>
    </>
  );
}
