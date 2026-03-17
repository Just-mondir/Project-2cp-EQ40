"use client";
import { useEffect, useMemo, useState } from "react";

const mockStats = [
  { label: "Members", value: "1.6k" },
  { label: "Groups", value: "1.6k" },
  { label: "Visitors", value: "1.6k" },
  { label: "Posts", value: "1.6k" },
];

const mockUsers = [
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
];

const mockGroups = [
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
];

export default function ModeratorUsers() {
  const [activeTab, setActiveTab] = useState("Users");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<number | null>(null);
  const [rolesByKey, setRolesByKey] = useState<Record<string, "Admin" | "User">>({
    "Users-1": "User",
    "Users-2": "Admin",
    "Users-3": "Admin",
    "Users-4": "User",
    "Users-5": "User",
    "Users-6": "User",
    "Users-7": "User",
    "Groups-1": "User",
    "Groups-2": "Admin",
  });
  const pageSize = 5;

  const data = activeTab === "Users" ? mockUsers : mockGroups;
  const filtered = useMemo(
    () => data.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

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
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [currentPage, filtered]);

  const isGroupsTab = activeTab === "Groups";

  const getRoleKey = (id: number) => `${activeTab}-${id}`;
  const getRole = (id: number) => rolesByKey[getRoleKey(id)] ?? "User";
  const setRole = (id: number, role: "Admin" | "User") => {
    setRolesByKey((prev) => ({ ...prev, [getRoleKey(id)]: role }));
  };

  return (
    <main
      className="min-h-screen px-4 sm:px-8 lg:px-16 py-8 lg:py-10"
      style={{ backgroundColor: "#e3d2b7" }}
    >
      {/* Profile header */}
      <div className="flex items-center gap-6 mb-8">
        <img
          src="https://api.dicebear.com/7.x/initials/svg?seed=Admin"
          alt="profile"
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#3b2314" }}>
            User498783887838
          </h1>
          <p className="text-sm" style={{ color: "#8b6a46" }}>
            @User4987838
          </p>
        </div>
      </div>

      {/* Stats + Edit roles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-8">
        <div className="flex flex-wrap gap-10">
          {mockStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-bold text-lg" style={{ color: "#3b2314" }}>
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
            onClick={() => setIsEditingRoles((v) => !v)}
            className="px-6 py-2 rounded-full text-white font-semibold mt-2 md:mt-0 shadow-sm transition-colors hover:opacity-90 hover:shadow-md"
            style={{ backgroundColor: "#3b2314" }}
          >
            {isEditingRoles ? "← Back" : "Edit roles"}
          </button>
        )}
      </div>

      {/* Card */}
      <div
        className="rounded-3xl p-6 sm:p-8 shadow-sm"
        style={{ backgroundColor: "#f7ecd6" }}
      >
        {isEditingRoles && (
          <h2 className="text-lg sm:text-xl font-semibold mb-6" style={{ color: "#3b2314" }}>
            Edit roles
          </h2>
        )}

        {/* Tabs */}
        {!isEditingRoles && (
          <div className="flex gap-8 mb-6 border-b border-gray-200">
            {["Users", "Groups"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 font-semibold text-base transition-all ${
                  activeTab === tab
                    ? "border-b-2 border-gray-800 text-gray-800"
                    : "text-gray-400"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full w-full max-w-xs"
            style={{ backgroundColor: "#e5d5bd" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#8b6a46"
              viewBox="0 0 24 24"
            >
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
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </div>

        {/* Table header */}
        {!isEditingRoles ? (
          isGroupsTab ? (
            <div className="grid grid-cols-7 text-xs sm:text-sm mb-3 px-4">
              <span className="col-span-2">Groups</span>
              <span>Members</span>
              <span>Posts</span>
              <span>Created</span>
              <span className="text-right col-span-2"> </span>
            </div>
          ) : (
            <div className="grid grid-cols-8 text-xs sm:text-sm mb-3 px-4">
              <span className="col-span-2">Accounts</span>
              <span>Posts</span>
              <span>Joined</span>
              <span>Expertise</span>
              <span>Role</span>
              <span>Suspended until</span>
              <span className="text-right"> </span>
            </div>
          )
        ) : (
          <div className="grid grid-cols-8 text-xs sm:text-sm mb-3 px-4">
            <span className="col-span-2">Accounts</span>
            <span>Posts</span>
            <span>Joined</span>
            <span>Expertise</span>
            <span>Role</span>
            <span>Suspended until</span>
            <span className="text-right"> </span>
          </div>
        )}

        {/* Table rows */}
        <div className="flex flex-col gap-3">
          {pageItems.map((item) => (
            <div
              key={item.id}
              className={`grid items-center px-4 py-3 rounded-2xl ${
                isEditingRoles ? "grid-cols-8" : isGroupsTab ? "grid-cols-7" : "grid-cols-8"
              }`}
              style={{ backgroundColor: "#f9f1df" }}
            >
              {/* Avatar + name */}
              <div className="col-span-2 flex items-center gap-3">
                <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-bold text-sm" style={{ color: "#3b2314" }}>
                    {item.name}
                  </p>
                  {!isGroupsTab && (
                    <p className="text-xs" style={{ color: "#8b6a46" }}>
                      {(item as any).username}
                    </p>
                  )}
                </div>
              </div>

              {isEditingRoles ? (
                <>
                  <span className="text-sm" style={{ color: "#5b4630" }}>
                    {(item as any).posts}
                  </span>
                  <span className="text-sm" style={{ color: "#5b4630" }}>
                    {(item as any).joined}
                  </span>
                  <span className="text-sm" style={{ color: "#5b4630" }}>
                    {(item as any).expertise}
                  </span>
                  <span className="text-sm" style={{ color: "#5b4630" }}>
                    {getRole(item.id)}
                  </span>
                  <span
                    className="text-xs px-4 py-1 rounded-full w-fit"
                    style={{ backgroundColor: "#e5d5bd", color: "#3b2314" }}
                  >
                    {(item as any).suspendedUntil}
                  </span>
                  <div className="relative flex justify-end">
                    <button
                      onClick={() => setOpenRoleMenuId((v) => (v === item.id ? null : item.id))}
                      className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-sm transition-colors hover:opacity-90 hover:shadow-md inline-flex items-center gap-2"
                      style={{ backgroundColor: "#e5d5bd", color: "#3b2314" }}
                    >
                      Edit role
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
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
                          className="fixed inset-0 cursor-default z-40"
                          onClick={() => setOpenRoleMenuId(null)}
                        />
                        <div
                          className="absolute right-0 top-11 w-56 rounded-2xl shadow-md overflow-hidden border z-50"
                          style={{ backgroundColor: "#f7ecd6", borderColor: "#e5d5bd" }}
                        >
                          <button
                            onClick={() => {
                              setRole(item.id, "Admin");
                              setOpenRoleMenuId(null);
                            }}
                            className="w-full text-left px-5 py-4 font-semibold transition-colors hover:opacity-90"
                            style={{ color: "#3b2314" }}
                          >
                            Set as an admin
                          </button>
                          <div style={{ height: 1, backgroundColor: "#e5d5bd" }} />
                          <button
                            onClick={() => {
                              setRole(item.id, "User");
                              setOpenRoleMenuId(null);
                            }}
                            className="w-full text-left px-5 py-4 font-semibold transition-colors hover:opacity-90"
                            style={{ color: "#3b2314" }}
                          >
                            Set as a user
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                isGroupsTab ? (
                  <>
                    <span className="text-sm" style={{ color: "#5b4630" }}>
                      {(item as any).members}
                    </span>
                    <span className="text-sm" style={{ color: "#5b4630" }}>
                      {item.posts}
                    </span>
                    <span className="text-sm" style={{ color: "#5b4630" }}>
                      {(item as any).created}
                    </span>
                    <div className="flex items-center justify-end">
                      <button
                        className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-sm transition-colors hover:opacity-90 hover:shadow-md"
                        style={{ backgroundColor: "#e5d5bd", color: "#3b2314" }}
                      >
                        See groupe members
                      </button>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        className="text-xs sm:text-sm font-semibold transition-colors hover:opacity-90"
                        style={{ color: "#3b2314" }}
                      >
                        Delete the groupe
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm" style={{ color: "#5b4630" }}>
                      {item.posts}
                    </span>
                    <span className="text-sm" style={{ color: "#5b4630" }}>
                      {(item as any).joined}
                    </span>
                    <span className="text-sm" style={{ color: "#5b4630" }}>
                      {(item as any).expertise}
                    </span>
                    <span className="text-sm" style={{ color: "#5b4630" }}>
                      {getRole(item.id)}
                    </span>
                    <span
                      className="text-xs px-4 py-1 rounded-full w-fit"
                      style={{ backgroundColor: "#e5d5bd", color: "#3b2314" }}
                    >
                      {(item as any).suspendedUntil}
                    </span>
                    <div className="flex items-center justify-end">
                      <button
                        className="text-xs sm:text-sm font-semibold px-4 py-1 rounded-full shadow-sm transition-colors hover:opacity-90 hover:shadow-md"
                        style={{ backgroundColor: "#3b2314", color: "#f7ecd6" }}
                      >
                        Ban
                      </button>
                    </div>
                  </>
                )
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2 mt-8 justify-start">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center text-sm"
            style={{ borderColor: "#c8b79a", color: "#8b6a46" }}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:shadow-md ${
                currentPage === page
                  ? "text-white"
                  : ""
              }`}
              style={
                currentPage === page
                  ? { backgroundColor: "#3b2314" }
                  : { backgroundColor: "#e5d5bd", color: "#8b6a46" }
              }
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center text-sm"
            style={{ borderColor: "#c8b79a", color: "#8b6a46" }}
          >
            ›
          </button>
        </div>
      </div>
    </main>
  );
}
