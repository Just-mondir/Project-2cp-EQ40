"use client";

import { useState, useEffect, useRef } from "react";

const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const SISAL = "#C4A882";

/* ── Month / Year constants ── */
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/* ── Helper: days in a month ── */
function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/* ── Helper: first weekday of month (0=Monday … 6=Sunday) ── */
function firstWeekday(year, month) {
    const d = new Date(year, month, 1).getDay(); // 0=Sun
    return d === 0 ? 6 : d - 1; // shift to Mon-start
}

/* ── Small arrow SVG ── */
function ChevronLeft({ size = 16, color = ESPRESSO }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}
function ChevronRight({ size = 16, color = ESPRESSO }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
        </svg>
    );
}

/* ══════════════════════════════════════════════════════
   AddHistoricalPeriodPopup
   Same visual language as AddLocationPopup / AddGroupsPopup
   ══════════════════════════════════════════════════════ */
export default function AddHistoricalPeriodPopup({ initialValue = "", onConfirm, onClose }) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState(null); // Date object
    const [manualInput, setManualInput] = useState(initialValue);

    /* Close on Escape key */
    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    /* Parse initial value into a pre-selected date if possible */
    useEffect(() => {
        if (initialValue) {
            // Try DD/MM/YYYY
            const parts = initialValue.split("/");
            if (parts.length === 3) {
                const d = new Date(parts[2], parts[1] - 1, parts[0]);
                if (!isNaN(d)) {
                    setSelectedDate(d);
                    setViewYear(d.getFullYear());
                    setViewMonth(d.getMonth());
                }
            }
        }
    }, [initialValue]);

    /* Navigate months */
    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    /* Build calendar grid cells */
    const totalDays = daysInMonth(viewYear, viewMonth);
    const startOffset = firstWeekday(viewYear, viewMonth);
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    /* Check if a day cell is the selected date */
    const isSelected = (day) => {
        if (!day || !selectedDate) return false;
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === viewMonth &&
            selectedDate.getFullYear() === viewYear
        );
    };

    /* Is today */
    const isToday = (day) => {
        if (!day) return false;
        return (
            today.getDate() === day &&
            today.getMonth() === viewMonth &&
            today.getFullYear() === viewYear
        );
    };

    /* Select a day */
    const pickDay = (day) => {
        const d = new Date(viewYear, viewMonth, day);
        setSelectedDate(d);
        const dd = String(day).padStart(2, "0");
        const mm = String(viewMonth + 1).padStart(2, "0");
        setManualInput(`${dd}/${mm}/${viewYear}`);
    };

    /* Confirm */
    const handleConfirm = () => {
        onConfirm(manualInput);
        onClose();
    };

    const navBtnStyle = {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        transition: "background-color 0.15s",
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
                    width: "440px",
                    maxWidth: "calc(100vw - 32px)",
                    position: "relative",
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
            >
                {/* Checkmark confirm button (top-right) */}
                <button
                    onClick={handleConfirm}
                    title="Confirm date"
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
                    Historical Period
                </h2>

                {/* Sub-label */}
                <p style={{
                    fontSize: "13px",
                    color: ESPRESSO,
                    fontWeight: 500,
                    marginBottom: "8px",
                    opacity: 0.8,
                }}>
                    Select a date
                </p>

                {/* Text input for manual entry */}
                <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                    autoFocus
                    placeholder="DD/MM/YYYY or period name"
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

                {/* Divider: or pick from calendar */}
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
                        or pick from calendar
                    </span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: SISAL, opacity: 0.5 }} />
                </div>

                {/* ── Calendar ── */}
                <div style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: `1px solid ${SISAL}`,
                    padding: "16px",
                    boxShadow: "0 2px 8px rgba(67,40,23,0.08)",
                }}>
                    {/* Month / Year header */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                    }}>
                        <button
                            type="button" onClick={prevMonth}
                            style={navBtnStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(196,168,130,0.15)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                            <ChevronLeft />
                        </button>
                        <span style={{
                            fontWeight: 700,
                            fontSize: "15px",
                            color: ESPRESSO,
                            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                            letterSpacing: "0.02em",
                        }}>
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button
                            type="button" onClick={nextMonth}
                            style={navBtnStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(196,168,130,0.15)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                            <ChevronRight />
                        </button>
                    </div>

                    {/* Day-of-week headers */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "2px",
                        marginBottom: "4px",
                    }}>
                        {DAYS_OF_WEEK.map((d) => (
                            <div key={d} style={{
                                textAlign: "center",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: ESPRESSO,
                                opacity: 0.5,
                                padding: "4px 0",
                                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                            }}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "2px",
                    }}>
                        {cells.map((day, idx) => {
                            if (day === null) {
                                return <div key={`empty-${idx}`} style={{ padding: "6px" }} />;
                            }
                            const sel = isSelected(day);
                            const tod = isToday(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => pickDay(day)}
                                    style={{
                                        width: "100%",
                                        aspectRatio: "1",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "50%",
                                        border: tod && !sel ? `1.5px solid ${SISAL}` : "1.5px solid transparent",
                                        backgroundColor: sel ? ESPRESSO : "transparent",
                                        color: sel ? "#FFFFFF" : ESPRESSO,
                                        fontSize: "13px",
                                        fontWeight: sel ? 700 : 400,
                                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                                        cursor: "pointer",
                                        transition: "all 0.12s",
                                        padding: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!sel) {
                                            e.currentTarget.style.backgroundColor = "rgba(196,168,130,0.18)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!sel) {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                        }
                                    }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
