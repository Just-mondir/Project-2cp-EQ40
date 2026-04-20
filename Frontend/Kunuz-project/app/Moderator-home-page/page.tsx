"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSidebar from "@/app/components/LeftSidebar";

type User = {
  id: number;
  name: string;
  username: string;
  avatar: string;
  posts: string;
  joined: string;
  expertise: string;
  suspendedUntil: string;
};

type Group = {
  id: number;
  name: string;
  avatar: string;
  members: string;
  posts: string;
  created: string;
};

type ConfirmConfig = {
  title: string;
  subtitle: string;
  confirmLabel: string;
  onConfirm: () => void;
};

const moderatorProfile = {
  name: "Moderator",
  username: "@moderator",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Moderator",
};

const mockStats = [
  { label: "Members", value: "1.6k" },
  { label: "Groups", value: "1.6k" },
  { label: "Visitors", value: "1.6k" },
  { label: "Posts", value: "1.6k" },
];

const mockUsers: User[] = [
  {
    id: 1,
    name: "User498783887838",
    username: "@User4987838",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User1",
    posts: "1.6k",
    joined: "22/01/2025",
    expertise: "architecte",
    suspendedUntil: "22/01/2025",
  },
  {
    id: 2,
    name: "User498783887838441",
    username: "@User4987838",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User2",
    posts: "1.6k",
    joined: "22/01/2025",
    expertise: "architecte",
    suspendedUntil: "22/01/2025",
  },
  {
    id: 3,
    name: "User498783887838",
    username: "@User4987838",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User3",
    posts: "1.6k",
    joined: "22/01/2025",
    expertise: "architecte",
    suspendedUntil: "22/01/2025",
  },
  {
    id: 4,
    name: "User498783",
    username: "@User4987838",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User4",
    posts: "1.6k",
    joined: "22/01/2025",
    expertise: "architecte",
    suspendedUntil: "22/01/2025",
  },
  {
    id: 5,
    name: "User498783",
    username: "@User4987838",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User5",
    posts: "1.6k",
    joined: "22/01/2025",
    expertise: "architecte",
    suspendedUntil: "22/01/2025",
  },
  {
    id: 6,
    name: "User498783887838",
    username: "@User4987838",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User6",
    posts: "1.6k",
    joined: "22/01/2025",
    expertise: "architecte",
    suspendedUntil: "22/01/2025",
  },
  {
    id: 7,
    name: "User498783887838441",
    username: "@User4987838",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User7",
    posts: "1.6k",
    joined: "22/01/2025",
    expertise: "architecte",
    suspendedUntil: "22/01/2025",
  },
  {
    id: 8,
    name: "Fatima B.",
    username: "@fatima",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User8",
    posts: "980",
    joined: "18/01/2025",
    expertise: "historienne",
    suspendedUntil: "30/01/2025",
  },
  {
    id: 9,
    name: "Kamel D.",
    username: "@kamel",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User9",
    posts: "1.1k",
    joined: "14/01/2025",
    expertise: "guide",
    suspendedUntil: "01/02/2025",
  },
  {
    id: 10,
    name: "Lina R.",
    username: "@lina",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User10",
    posts: "875",
    joined: "13/01/2025",
    expertise: "photographe",
    suspendedUntil: "05/02/2025",
  },
  {
    id: 11,
    name: "Nassim T.",
    username: "@nassim",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User11",
    posts: "2.3k",
    joined: "10/01/2025",
    expertise: "archiviste",
    suspendedUntil: "12/02/2025",
  },
  {
    id: 12,
    name: "Sara K.",
    username: "@sara",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User12",
    posts: "642",
    joined: "08/01/2025",
    expertise: "restauratrice",
    suspendedUntil: "15/02/2025",
  },
];

const mockGroups: Group[] = [
  {
    id: 1,
    name: "Heritage Photography",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=HeritagePhotography",
    members: "1.6k",
    posts: "1.6k",
    created: "22/01/2025",
  },
  {
    id: 2,
    name: "UNESCO World Heritage Sites",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=UNESCOWorldHeritage",
    members: "1.6k",
    posts: "1.6k",
    created: "22/01/2025",
  },
  {
    id: 3,
    name: "Monuments of Tipaza",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=MonumentsOfTipaza",
    members: "1.6k",
    posts: "1.6k",
    created: "22/01/2025",
  },
  {
    id: 4,
    name: "Kasbah Keepers",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=KasbahKeepers",
    members: "980",
    posts: "400",
    created: "20/01/2025",
  },
  {
    id: 5,
    name: "Roman Ruins Club",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RomanRuinsClub",
    members: "1.1k",
    posts: "920",
    created: "18/01/2025",
  },
  {
    id: 6,
    name: "Mosaic Lovers",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=MosaicLovers",
    members: "870",
    posts: "560",
    created: "17/01/2025",
  },
  {
    id: 7,
    name: "Old City Walks",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=OldCityWalks",
    members: "730",
    posts: "450",
    created: "16/01/2025",
  },
  {
    id: 8,
    name: "Sahara Heritage",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SaharaHeritage",
    members: "1.4k",
    posts: "840",
    created: "14/01/2025",
  },
  {
    id: 9,
    name: "Traditional Crafts Hub",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TraditionalCraftsHub",
    members: "620",
    posts: "310",
    created: "13/01/2025",
  },
  {
    id: 10,
    name: "Historic Doors",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=HistoricDoors",
    members: "560",
    posts: "240",
    created: "11/01/2025",
  },
  {
    id: 11,
    name: "Andalusian Architecture",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AndalusianArchitecture",
    members: "890",
    posts: "510",
    created: "09/01/2025",
  },
];

const usersGridTemplate =
  "minmax(0,0.9fr) minmax(0,1.2fr) minmax(0,0.45fr) minmax(0,0.9fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,1.15fr) minmax(0,1.45fr)";
const groupsGridTemplate =
  "minmax(0,0.9fr) minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,0.9fr) minmax(0,1.35fr) minmax(0,1.1fr)";

export default function ModeratorUsers() {
  const [activeTab, setActiveTab] = useState<"Users" | "Groups">("Users");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<number | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);
  const [moderationStatusByUserId, setModerationStatusByUserId] = useState<
    Record<number, "none" | "suspended" | "banned">
  >({});
  const [rolesByKey, setRolesByKey] = useState<Record<string, "Admin" | "User">>({
    "Users-1": "User",
    "Users-2": "Admin",
    "Users-3": "Admin",
    "Users-4": "User",
    "Users-5": "User",
    "Users-6": "User",
    "Users-7": "User",
    "Users-8": "User",
    "Users-9": "Admin",
    "Users-10": "User",
    "Users-11": "Admin",
    "Users-12": "User",
    "Groups-1": "User",
    "Groups-2": "Admin",
  });
  const [editStartRolesByKey, setEditStartRolesByKey] = useState<Record<string, "Admin" | "User"> | null>(null);

  const pageSize = 10;
  const data = activeTab === "Users" ? mockUsers : mockGroups;

  const filtered = useMemo(
    () => data.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visiblePages = useMemo(() => {
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const halfWindow = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisiblePages + 1;
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    if (activeTab === "Groups") setIsEditingRoles(false);
  }, [activeTab]);

  useEffect(() => {
    if (isEditingRoles) setActiveTab("Users");
  }, [isEditingRoles]);

  useEffect(() => {
    setOpenRoleMenuId(null);
  }, [activeTab, isEditingRoles]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(1, page), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [currentPage, filtered]);

  const isGroupsTab = activeTab === "Groups";
  const getRoleKey = (id: number) => `${activeTab}-${id}`;
  const getRole = (id: number) => rolesByKey[getRoleKey(id)] ?? "User";
  const hasRoleChanges =
    editStartRolesByKey !== null && JSON.stringify(rolesByKey) !== JSON.stringify(editStartRolesByKey);

  const setRole = (id: number, role: "Admin" | "User") => {
    setRolesByKey((prev) => ({ ...prev, [getRoleKey(id)]: role }));
  };

  const getModerationStatus = (id: number) => moderationStatusByUserId[id] ?? "none";
  const openConfirm = (config: ConfirmConfig) => setConfirmConfig(config);
  const closeConfirm = () => setConfirmConfig(null);
  const runConfirm = () => {
    if (!confirmConfig) return;
    confirmConfig.onConfirm();
    closeConfirm();
  };

  return (
    <>
      <LeftSidebar activePage="home" />

      <main
        className="min-h-screen overflow-x-hidden px-4 py-8 sm:px-8 md:pl-24 lg:px-16 lg:pl-28 lg:py-10"
        style={{ backgroundColor: "#E3D9C4" }}
      >
        <div className="w-[138.9%] origin-top-left scale-[0.72] sm:w-full sm:scale-100">
        <div className="mb-8 flex items-center gap-6">
          <img src={moderatorProfile.avatar} alt="profile" className="h-20 w-20 rounded-full object-cover" />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#3b2314" }}>
              {moderatorProfile.name}
            </h1>
            <p className="text-sm" style={{ color: "#8b6a46" }}>
              {moderatorProfile.username}
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
          <div className="flex flex-wrap gap-10">
            {mockStats.map((stat) => (
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

          {activeTab === "Users" && (
            <button
              onClick={() => {
                if (!isEditingRoles) {
                  setEditStartRolesByKey({ ...rolesByKey });
                  setIsEditingRoles(true);
                  return;
                }

                if (!hasRoleChanges) {
                  setIsEditingRoles(false);
                  setEditStartRolesByKey(null);
                  return;
                }

                openConfirm({
                  title: "Are you sure of saving changes?",
                  subtitle: "Your role updates will be saved.",
                  confirmLabel: "Save",
                  onConfirm: () => {
                    setIsEditingRoles(false);
                    setEditStartRolesByKey(null);
                  },
                });
              }}
              className="mt-2 rounded-[11px] px-6 py-2 font-semibold text-white shadow-sm transition-colors hover:opacity-90 hover:shadow-md md:mt-0"
              style={{ backgroundColor: "#3b2314" }}
            >
              {isEditingRoles ? "< Back" : "Edit roles"}
            </button>
          )}
        </div>

        <div className="rounded-3xl p-6 shadow-sm sm:p-8" style={{ backgroundColor: "#FFF8E2" }}>
          {isEditingRoles && (
            <h2 className="mb-6 text-lg font-semibold sm:text-xl" style={{ color: "#3b2314" }}>
              Edit roles
            </h2>
          )}

          {!isEditingRoles && (
            <div className="mb-6 flex gap-8 border-b border-gray-200">
              {["Users", "Groups"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "Users" | "Groups")}
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
                onChange={(event) => setSearch(event.target.value)}
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

          {filtered.length === 0 ? (
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
                      {!isGroupsTab && (
                        <p className="truncate text-[11px] sm:text-xs" style={{ color: "#8b6a46" }}>
                          {"username" in item ? item.username : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditingRoles ? (
                    <>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {"posts" in item ? item.posts : ""}
                      </span>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {"joined" in item ? item.joined : ""}
                      </span>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {"expertise" in item ? item.expertise : ""}
                      </span>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {getRole(item.id)}
                      </span>
                      <span
                        className="w-fit max-w-full truncate rounded-full px-2 py-1 text-[11px] sm:px-4 sm:text-xs"
                        style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
                      >
                        {"suspendedUntil" in item ? item.suspendedUntil : ""}
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
                              className="fixed inset-0 z-40 rounded-[11px] cursor-default"
                              onClick={() => setOpenRoleMenuId(null)}
                            />
                            <div
                              className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border shadow-md"
                              style={{ backgroundColor: "#FFF8E2", borderColor: "#E3D9C4" }}
                            >
                              <button
                                onClick={() => {
                                  setRole(item.id, "Admin");
                                  setOpenRoleMenuId(null);
                                }}
                                className="w-full rounded-[11px] px-5 py-4 text-left font-semibold transition-colors hover:opacity-90"
                                style={{ color: "#3b2314" }}
                              >
                                Set as an admin
                              </button>
                              <div style={{ height: 1, backgroundColor: "#E3D9C4" }} />
                              <button
                                onClick={() => {
                                  setRole(item.id, "User");
                                  setOpenRoleMenuId(null);
                                }}
                                className="w-full rounded-[11px] px-5 py-4 text-left font-semibold transition-colors hover:opacity-90"
                                style={{ color: "#3b2314" }}
                              >
                                Set as a user
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : isGroupsTab ? (
                    <>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {"members" in item ? item.members : ""}
                      </span>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {item.posts}
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
                          className="rounded-[11px] whitespace-nowrap text-[10px] font-semibold transition-colors hover:opacity-90 sm:text-sm"
                          style={{ color: "#3b2314" }}
                          onClick={() =>
                            openConfirm({
                              title: "Are you sure want to delete this item ?",
                              subtitle: "This action cannot be undone",
                              confirmLabel: "Delete",
                              onConfirm: () => {},
                            })
                          }
                        >
                          Delete group
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {item.posts}
                      </span>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {"joined" in item ? item.joined : ""}
                      </span>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {"expertise" in item ? item.expertise : ""}
                      </span>
                      <span className="truncate" style={{ color: "#5b4630" }}>
                        {getRole(item.id)}
                      </span>
                      <span
                        className="w-fit max-w-full truncate rounded-full px-2 py-1 text-[11px] sm:px-4 sm:text-xs"
                        style={{ backgroundColor: "#E3D9C4", color: "#3b2314" }}
                      >
                        {"suspendedUntil" in item ? item.suspendedUntil : ""}
                      </span>
                      {getModerationStatus(item.id) === "none" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:px-4 sm:text-sm"
                            style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                            onClick={() =>
                              openConfirm({
                                title: "Are you sure want to delete this item ?",
                                subtitle: "This action cannot be undone",
                                confirmLabel: "Suspend",
                                onConfirm: () =>
                                  setModerationStatusByUserId((prev) => ({
                                    ...prev,
                                    [item.id]: "suspended",
                                  })),
                              })
                            }
                          >
                            Suspend
                          </button>
                          <button
                            className="whitespace-nowrap rounded-[11px] px-3 py-1 text-[11px] font-semibold shadow-sm transition-colors hover:opacity-90 hover:shadow-md sm:px-4 sm:text-sm"
                            style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                            onClick={() =>
                              openConfirm({
                                title: "Are you sure want to delete this item ?",
                                subtitle: "This action cannot be undone",
                                confirmLabel: "Ban",
                                onConfirm: () =>
                                  setModerationStatusByUserId((prev) => ({
                                    ...prev,
                                    [item.id]: "banned",
                                  })),
                              })
                            }
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
                              openConfirm({
                                title: "Are you sure want to delete this item ?",
                                subtitle: "The user will be active again",
                                confirmLabel: getModerationStatus(item.id) === "suspended" ? "Unsuspend" : "Unban",
                                onConfirm: () =>
                                  setModerationStatusByUserId((prev) => ({
                                    ...prev,
                                    [item.id]: "none",
                                  })),
                              })
                            }
                          >
                            {getModerationStatus(item.id) === "suspended" ? "Suspended" : "Banned"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-[11px] border text-sm disabled:cursor-not-allowed"
                style={{
                  borderColor: "#c8b79a",
                  color: "#8b6a46",
                  opacity: currentPage === 1 ? 0.45 : 1,
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
                    currentPage === page ? "text-white" : ""
                  }`}
                  style={
                    currentPage === page
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
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-[11px] border text-sm disabled:cursor-not-allowed"
                style={{
                  borderColor: "#c8b79a",
                  color: "#8b6a46",
                  opacity: currentPage === totalPages ? 0.45 : 1,
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
            <div
              className="relative w-full max-w-[315px] overflow-hidden rounded-[21px] bg-white px-6 pb-6 pt-7 shadow-xl"
            >
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
                onClick={runConfirm}
                className="mx-auto mt-7 block w-full max-w-[214px] rounded-[11px] py-2.5 text-center text-xl font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#111111" }}
              >
                {confirmConfig.confirmLabel}
              </button>

              <button
                onClick={closeConfirm}
                className="mt-4 w-full rounded-[11px] text-center text-xl font-medium transition-opacity hover:opacity-70"
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
