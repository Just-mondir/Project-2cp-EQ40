"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const SISAL = "#C4A882";

export default function AddLocationPopup({ initialValue = "", onConfirm, onClose }) {
    const t = useTranslations("auth.locationPopup");
    const [location, setLocation] = useState(initialValue);
    const [mapLocation, setMapLocation] = useState("");
    const [mapOpened, setMapOpened] = useState(false);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const handleConfirm = () => {
        onConfirm(location);
        onClose();
    };

    const handleMapConfirm = () => {
        if (mapLocation.trim()) {
            setLocation(mapLocation.trim());
            setMapLocation("");
            setMapOpened(false);
        }
    };

    const handleOpenMap = () => {
        window.open("https://www.google.com/maps", "_blank");
        setMapOpened(true);
    };

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
                    fontFamily: "var(--font-lato), 'Lato', sans-serif",
                }}
            >
                <button
                    onClick={onClose}
                    title={t("close")}
                    style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        color: ESPRESSO,
                        opacity: 0.5,
                        transition: "opacity 0.15s",
                        display: "flex",
                        alignItems: "center",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <h2 style={{
                    fontWeight: 700,
                    fontSize: "20px",
                    color: ESPRESSO,
                    textAlign: "center",
                    marginBottom: "22px",
                    letterSpacing: "0.01em",
                    fontFamily: "var(--font-lato), 'Lato', sans-serif",
                }}>
                    {t("title")}
                </h2>

                <p style={{ fontSize: "12px", color: ESPRESSO, fontWeight: 600, marginBottom: "6px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {t("typeLocation")}
                </p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                        autoFocus
                        placeholder={t("placeholders.location")}
                        style={{
                            flex: 1,
                            backgroundColor: "#FFFFFF",
                            border: `1px solid ${SISAL}`,
                            borderRadius: "10px",
                            color: ESPRESSO,
                            fontFamily: "var(--font-lato), 'Lato', sans-serif",
                            fontWeight: 400,
                            outline: "none",
                            padding: "10px 14px",
                            fontSize: "14px",
                            boxSizing: "border-box",
                            transition: "box-shadow 0.15s",
                        }}
                        onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2.5px rgba(139,105,20,0.22)"; }}
                        onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                    />
                    <button
                        onClick={handleConfirm}
                        title={t("confirmLocation")}
                        style={{
                            flexShrink: 0,
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            backgroundColor: ESPRESSO,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#5a3822"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ESPRESSO; }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="#FFF8E2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0 16px" }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: SISAL, opacity: 0.4 }} />
                    <span style={{ fontSize: "11px", color: ESPRESSO, opacity: 0.45, fontFamily: "var(--font-lato)", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {t("orPickFromMap")}
                    </span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: SISAL, opacity: 0.4 }} />
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginBottom: mapOpened ? "16px" : "0" }}>
                    <button
                        type="button"
                        onClick={handleOpenMap}
                        title={t("openGoogleMaps")}
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "14px",
                            border: "1.5px solid #FF0000",
                            backgroundColor: "#fff5f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(255,0,0,0.15)",
                            transition: "transform 0.15s, box-shadow 0.15s, background-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.06)";
                            e.currentTarget.style.boxShadow = "0 4px 18px rgba(255,0,0,0.25)";
                            e.currentTarget.style.backgroundColor = "#ffecec";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 10px rgba(255,0,0,0.15)";
                            e.currentTarget.style.backgroundColor = "#fff5f5";
                        }}
                    >
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="#FF0000">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
                        </svg>
                    </button>
                </div>

                {mapOpened && (
                    <div style={{ animation: "fadeIn 0.2s ease" }}>
                        <p style={{
                            fontSize: "12px",
                            color: ESPRESSO,
                            fontWeight: 600,
                            marginBottom: "6px",
                            opacity: 0.7,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                        }}>
                            {t("pasteLocationFromMap")}
                        </p>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input
                                type="text"
                                value={mapLocation}
                                onChange={(e) => setMapLocation(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleMapConfirm(); }}
                                placeholder={t("placeholders.mapLocation")}
                                style={{
                                    flex: 1,
                                    backgroundColor: "#FFFFFF",
                                    border: "1.5px solid #FF0000",
                                    borderRadius: "10px",
                                    color: ESPRESSO,
                                    fontFamily: "var(--font-lato), 'Lato', sans-serif",
                                    fontWeight: 400,
                                    outline: "none",
                                    padding: "10px 14px",
                                    fontSize: "14px",
                                    boxSizing: "border-box",
                                    transition: "box-shadow 0.15s",
                                }}
                                onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2.5px rgba(255,0,0,0.18)"; }}
                                onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                                autoFocus
                            />
                            <button
                                onClick={handleMapConfirm}
                                title={t("useThisLocation")}
                                style={{
                                    flexShrink: 0,
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    backgroundColor: "#FF0000",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "background-color 0.15s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#cc0000"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FF0000"; }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                    stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </button>
                        </div>
                        <p style={{ fontSize: "11px", color: ESPRESSO, opacity: 0.45, marginTop: "6px", fontFamily: "var(--font-lato)" }}>
                            {t("mapHint")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
