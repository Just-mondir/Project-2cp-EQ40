"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const SISAL = "#C4A882";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getAuthToken() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("accessToken") || "";
}

export default function AddGroupsPopup({ onConfirm, onClose }) {
    const t = useTranslations("auth.groupsPopup");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(new Set());
    const [availableGroups, setAvailableGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyGroups = async () => {
            try {
                const res = await fetch(`${API_URL}/api/groups/my-groups/`, {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                });
                if (!res.ok) throw new Error("Failed to fetch groups");
                const data = await res.json();
                const groups = data.data?.results || data.data || data.results || data;
                setAvailableGroups(Array.isArray(groups) ? groups : []);
            } catch (err) {
                console.error("Error fetching my groups:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyGroups();
    }, []);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleConfirm = () => {
        const groups = availableGroups.filter((g) => selected.has(g.id));
        onConfirm(groups);
        onClose();
    };

    const filtered = availableGroups.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.40)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                overflowY: "auto",
                padding: "20px 0",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: CREAM_PAGE,
                    borderRadius: "16px",
                    boxShadow: "0 20px 60px rgba(67,40,23,0.22), 0 4px 16px rgba(0,0,0,0.12)",
                    padding: "32px 28px 28px",
                    width: "380px",
                    maxWidth: "calc(100vw - 32px)",
                    position: "relative",
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
            >
                <button
                    onClick={handleConfirm}
                    title={t("confirmSelection")}
                    style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: ESPRESSO,
                        opacity: 0.7,
                        transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                </button>

                <h2
                    style={{
                        fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                        fontWeight: 700,
                        fontSize: "22px",
                        color: ESPRESSO,
                        textAlign: "center",
                        marginBottom: "24px",
                        letterSpacing: "0.01em",
                    }}
                >
                    {t("title")}
                </h2>

                <p style={{
                    fontSize: "13px",
                    color: ESPRESSO,
                    fontWeight: 500,
                    marginBottom: "8px",
                    opacity: 0.8,
                }}>
                    {t("typeGroupName")}
                </p>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    placeholder={t("searchPlaceholder")}
                    style={{
                        width: "100%",
                        backgroundColor: "#FFFFFF",
                        border: `1px solid ${SISAL}`,
                        borderRadius: "10px",
                        color: ESPRESSO,
                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                        fontWeight: 400,
                        outline: "none",
                        padding: "10px 14px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        marginBottom: "16px",
                        transition: "box-shadow 0.15s",
                    }}
                    onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2.5px rgba(139,105,20,0.22)"; }}
                    onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                />

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxHeight: "260px",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}>
                    {filtered.map((group) => {
                        const isSelected = selected.has(group.id);
                        return (
                            <div
                                key={group.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: "40px",
                                    padding: "8px 14px 8px 8px",
                                    border: isSelected ? `1.5px solid ${SISAL}` : "1.5px solid transparent",
                                    boxShadow: "0 1px 4px rgba(67,40,23,0.07)",
                                    transition: "border-color 0.15s, box-shadow 0.15s",
                                    cursor: "pointer",
                                }}
                                onClick={() => toggle(group.id)}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        flexShrink: 0,
                                        backgroundColor: SISAL,
                                    }}>
                                        <img
                                            src={group.profile_picture ? (group.profile_picture.startsWith("http") ? group.profile_picture : `${API_URL}${group.profile_picture}`) : "/heritage-photography.jpg"}
                                            alt={group.name}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.parentNode.style.backgroundColor = SISAL;
                                            }}
                                        />
                                    </div>
                                    <span className="localized-container-title" style={{
                                        color: "var(--foreground)",
                                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                                        fontWeight: 600,
                                        fontSize: "14px",
                                    }}>
                                        {group.name}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggle(group.id); }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "transform 0.15s",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.2)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                                >
                                    {isSelected ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                            stroke={SISAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                            stroke={ESPRESSO} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                    {loading && (
                        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                            <div className="w-6 h-6 border-2 border-t-transparent animate-spin rounded-full" style={{ borderColor: SISAL, borderTopColor: ESPRESSO }} />
                        </div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <p style={{
                            textAlign: "center",
                            color: ESPRESSO,
                            opacity: 0.5,
                            fontSize: "13px",
                            padding: "16px 0",
                        }}>
                            {t("noGroupsFound")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
