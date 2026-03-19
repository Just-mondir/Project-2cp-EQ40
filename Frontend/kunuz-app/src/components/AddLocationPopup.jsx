"use client";

import { useState, useEffect } from "react";

const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const SISAL = "#C4A882";
const GOLD = "#8B6914";

export default function AddLocationPopup({ initialValue = "", onConfirm, onClose }) {
    const [location, setLocation] = useState(initialValue);

    /* Close on Escape key */
    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const handleConfirm = () => {
        onConfirm(location);
        onClose();
    };

    return (
        /* ── Backdrop ── */
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
            }}
        >
            {/* ── Card ── */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: CREAM_PAGE,
                    borderRadius: "16px",
                    boxShadow: "0 20px 60px rgba(67,40,23,0.22), 0 4px 16px rgba(0,0,0,0.12)",
                    padding: "32px 28px 28px",
                    width: "360px",
                    maxWidth: "calc(100vw - 32px)",
                    position: "relative",
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
            >
                {/* Checkmark confirm button (top-right) */}
                <button
                    onClick={handleConfirm}
                    title="Confirm location"
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

                {/* Title */}
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
                    Add location
                </h2>

                {/* Sub-label */}
                <p style={{
                    fontSize: "13px",
                    color: ESPRESSO,
                    fontWeight: 500,
                    marginBottom: "8px",
                    opacity: 0.8,
                }}>
                    Type location
                </p>

                {/* Text input */}
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                    autoFocus
                    placeholder="City or monument name"
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
                        transition: "box-shadow 0.15s",
                    }}
                    onFocus={(e) => { e.target.style.boxShadow = `0 0 0 2.5px rgba(139,105,20,0.22)`; }}
                    onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                />

                {/* Divider or add from map */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    margin: "20px 0 16px",
                }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: SISAL, opacity: 0.5 }} />
                    <span style={{
                        fontSize: "12px",
                        color: ESPRESSO,
                        opacity: 0.55,
                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                        whiteSpace: "nowrap",
                    }}>
                        or add from map
                    </span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: SISAL, opacity: 0.5 }} />
                </div>

                {/* Google Maps icon button */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <button
                        type="button"
                        title="Open map"
                        style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "12px",
                            border: `1px solid ${SISAL}`,
                            backgroundColor: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(67,40,23,0.10)",
                            transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 4px 14px rgba(67,40,23,0.18)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(67,40,23,0.10)";
                        }}
                    >
                        {/* Google Maps pin icon (inline SVG approximation) */}
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" fill="#EA4335" />
                            <path d="M12 2C8.134 2 5 5.134 5 9c0 2.387 1.2 4.493 3 5.773V9c0-2.21 1.79-4 4-4s4 1.79 4 4v5.773C17.8 13.493 19 11.387 19 9c0-3.866-3.134-7-7-7z" fill="#4285F4" />
                            <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
