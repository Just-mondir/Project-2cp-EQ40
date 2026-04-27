"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const SISAL = "#C4A882";

const API_URL = "http://127.0.0.1:8000";

function resolveProfilePictureUrl(profilePicture?: string): string {
    if (!profilePicture) return "/heritage-photography.jpg";
    if (profilePicture.startsWith("http")) return profilePicture;
    return `${API_URL}${profilePicture.startsWith("/") ? "" : "/"}${profilePicture}`;
}

interface Group {
    id: string;
    name: string;
    profile_picture?: string;
    member_count?: number;
}

export default function MyGroupsModal({
    isOpen,
    onClose,
    groups,
}: {
    isOpen: boolean;
    onClose: () => void;
    groups: Group[];
}) {
    const router = useRouter();
    const [search, setSearch] = useState("");

    if (!isOpen || typeof document === "undefined") return null;

    const filteredGroups = groups.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                backdropFilter: "blur(4px)",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: CREAM_PAGE,
                    borderRadius: "24px",
                    padding: "32px",
                    width: "480px",
                    maxWidth: "calc(100vw - 32px)",
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 60px rgba(67,40,23,0.3)",
                    animation: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    fontFamily: "var(--font-lato), 'Lato', sans-serif",
                }}
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2
                            style={{
                                fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                                fontSize: "28px",
                                fontWeight: 700,
                                color: ESPRESSO,
                                marginBottom: "4px"
                            }}
                        >
                            Your Groups
                        </h2>
                        <p style={{ color: "#8B7355", fontSize: "14px" }}>Manage and visit your joined communities</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "white",
                            border: "none",
                            cursor: "pointer",
                            color: ESPRESSO,
                            padding: "8px",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="mb-6">
                    <div style={{ position: "relative" }}>
                        <svg
                            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: SISAL }}
                            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search your groups..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "14px 16px 14px 44px",
                                borderRadius: "16px",
                                border: `1.5px solid ${SISAL}`,
                                backgroundColor: "white",
                                outline: "none",
                                fontSize: "15px",
                                color: ESPRESSO,
                                transition: "all 0.2s"
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "#8B6914"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(139,105,20,0.1)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = SISAL; e.currentTarget.style.boxShadow = "none"; }}
                        />
                    </div>
                </div>

                <div
                    className="flex-1 overflow-y-auto pr-1 custom-scrollbar"
                    style={{
                        paddingBottom: "10px"
                    }}
                >
                    <div className="flex flex-col gap-3">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group) => (
                                <div
                                    key={group.id}
                                    className="flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-white cursor-pointer border border-transparent hover:border-white hover:shadow-md group"
                                    onClick={() => {
                                        router.push(`/group/${group.id}`);
                                        onClose();
                                    }}
                                >
                                    <div style={{ position: "relative", width: "56px", height: "56px", flexShrink: 0 }}>
                                        <img
                                            src={resolveProfilePictureUrl(group.profile_picture)}
                                            alt={group.name}
                                            style={{ width: "100%", height: "100%", borderRadius: "16px", objectFit: "cover" }}
                                            className="shadow-sm"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[16px] truncate" style={{ color: ESPRESSO }}>
                                            {group.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                            <span className="text-[12px]" style={{ color: "#8B7355" }}>
                                                {group.member_count || 0} members
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="px-5 py-2 rounded-xl font-bold text-[13px] transition-all hover:scale-105 active:scale-95"
                                        style={{ backgroundColor: "#E0D5C5", color: ESPRESSO }}
                                    >
                                        Visit
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 flex flex-col items-center">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={SISAL} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: "12px" }}>
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <p className="text-sm font-medium" style={{ color: "#8B7355" }}>
                                    No groups found matching your search.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: ${SISAL};
                    border-radius: 20px;
                }
            `}</style>
        </div>,
        document.body
    );
}
