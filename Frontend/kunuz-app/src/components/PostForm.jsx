"use client";

import { useState } from "react";
import AddLocationPopup from "./AddLocationPopup";
import AddGroupsPopup from "./AddGroupsPopup";
import AddHistoricalPeriodPopup from "./AddHistoricalPeriodPopup";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
   - Background: #F7F5EF
   - Section underline: sisal (#C4A882) 1.08px
   - Section cards: white, 0° radius (sharp)
   - Inputs: white, 10.75px radius, no border
   - Font: Lato regular everywhere
───────────────────────────────────────────── */

const FONT = "var(--font-lato), 'Lato', sans-serif";
const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const SISAL = "#C4A882";   // sisal lines
const GOLD = "#8B6914";

/* ── Shared input: white, 10.75px radius, no border ── */
const inputStyle = {
    backgroundColor: "#FFFFFF",
    border: "none",
    borderRadius: "10.75px",
    color: ESPRESSO,
    fontFamily: FONT,
    fontWeight: 400,
    outline: "none",
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
    boxShadow: "0 1px 4px rgba(67,40,23,0.06)",
};

/* ── Section block instead of a card ── */
function SectionBlock({ children, isLast = false }) {
    return (
        <div style={{ marginBottom: isLast ? "16px" : "32px", position: "relative" }}>
            {children}
            {!isLast && (
                <div style={{
                    width: "100%",
                    height: "1px",
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                    marginTop: "32px",
                }} />
            )}
        </div>
    );
}

/* ── Section heading ─ */
function SectionLabel({ children }) {
    return (
        <div style={{ marginBottom: "16px" }}>
            <h3
                style={{
                    color: ESPRESSO,
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: "18px",
                    letterSpacing: "0.01em",
                    marginBottom: "8px",
                }}
            >
                {children}
            </h3>
            <div
                style={{
                    width: "100%",
                    height: "1px",
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                }}
            />
        </div>
    );
}

/* ── Pill toggle group ── */
function PillGroup({ options, value, onChange }) {
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {options.map((opt) => {
                const active = value === opt;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        style={{
                            padding: "6px 16px",
                            borderRadius: "9999px",
                            fontSize: "13px",
                            fontFamily: FONT,
                            fontWeight: 400,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            backgroundColor: active ? ESPRESSO : "#FFFFFF",
                            color: active ? CREAM_PAGE : ESPRESSO,
                            border: "none",
                            boxShadow: active ? "none" : "0 1px 4px rgba(67,40,23,0.06)",
                        }}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

/* ── Field sub-label ── */
function FieldLabel({ children }) {
    return (
        <p
            style={{
                color: ESPRESSO,
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: "12px",
                marginBottom: "6px",
            }}
        >
            {children}
        </p>
    );
}

/* ── Trash icon SVG ── */
function TrashIcon({ size = 13, color = GOLD }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4h6v2" />
        </svg>
    );
}

/* ══════════════════════════════════════════════
   PostForm
══════════════════════════════════════════════ */
export default function PostForm({ onCancel, onDone, initialValues = {}, showFooter = true }) {
    const [title, setTitle] = useState(initialValues.title ?? "");
    const [description, setDescription] = useState(initialValues.description ?? "");
    const [location, setLocation] = useState(initialValues.location ?? "");
    const [postType, setPostType] = useState(initialValues.postType ?? "Discovery");
    const [dangerLevel, setDangerLevel] = useState(initialValues.dangerLevel ?? null);
    const [historicalPeriod, setHistoricalPeriod] = useState(initialValues.historicalPeriod ?? "");
    const [region, setRegion] = useState(initialValues.region ?? "");
    const [monumentType, setMonumentType] = useState(initialValues.monumentType ?? null);
    const [visibility, setVisibility] = useState(initialValues.visibility ?? "Public");
    const [selectedGroups, setSelectedGroups] = useState(initialValues.groups ?? []);

    /* ── Popup visibility states ── */
    const [showLocationPopup, setShowLocationPopup] = useState(false);
    const [showGroupsPopup, setShowGroupsPopup] = useState(false);
    const [showHistoricalPeriodPopup, setShowHistoricalPeriodPopup] = useState(false);


    const POST_TYPES = ["Question", "Visit", "Discovery", "In Danger", "Event"];
    const DANGER_LEVELS = ["Low", "Medium", "High", "Critical"];
    const MONUMENT_TYPES = ["Civil", "Military", "Religious", "Funerary"];

    const removeGroup = (idx) =>
        setSelectedGroups((prev) => prev.filter((_, i) => i !== idx));

    /* Called when AddGroupsPopup confirms */
    const handleGroupsConfirm = (groups) => {
        const names = groups.map((g) => g.name);
        setSelectedGroups((prev) => {
            const existing = new Set(prev);
            return [...prev, ...names.filter((n) => !existing.has(n))];
        });
    };

    /* Focus ring via ref callback */
    const withFocus = (el) => {
        if (!el) return;
        el.addEventListener("focus", () => {
            el.style.boxShadow = "0 0 0 2.5px rgba(139,105,20,0.18)";
        });
        el.addEventListener("blur", () => {
            el.style.boxShadow = "0 1px 4px rgba(67,40,23,0.06)";
        });
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                backgroundColor: "#F7F5EF", // main background
                fontFamily: FONT,
            }}
        >
            {/* ── Scrollable body — scrollbar hidden ── */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "24px 32px",
                    scrollbarWidth: "none",           /* Firefox */
                    msOverflowStyle: "none",          /* IE/Edge */
                }}
                /* Chrome/Safari */
                className="hide-scrollbar"
            >

                {/* ══ INFO card ══ */}
                <SectionBlock>
                    <SectionLabel>Info</SectionLabel>

                    <div style={{ marginBottom: "14px" }}>
                        <FieldLabel>Title</FieldLabel>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={inputStyle}
                            ref={withFocus}
                        />
                    </div>

                    <div>
                        <FieldLabel>Description</FieldLabel>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            style={{ ...inputStyle, resize: "vertical" }}
                            ref={withFocus}
                        />
                    </div>
                </SectionBlock>

                {/* ══ LOCATION card ══ */}
                <SectionBlock>
                    <SectionLabel>Location</SectionLabel>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={{ ...inputStyle, width: "263px" }}
                            placeholder="City or monument name"
                            ref={withFocus}
                        />
                        <button
                            type="button"
                            onClick={() => setShowLocationPopup(true)}
                            style={{
                                flexShrink: 0,
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                border: `1.08px solid ${SISAL}`,
                                backgroundColor: "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "background-color 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(196,168,130,0.15)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            title="Add location"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke={ESPRESSO} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>
                </SectionBlock>

                {/* ══ LABELS card ══ */}
                <SectionBlock>
                    <SectionLabel>Labels</SectionLabel>

                    {/* Post Type */}
                    <div style={{ marginBottom: "18px" }}>
                        <FieldLabel>Post Type</FieldLabel>
                        <PillGroup options={POST_TYPES} value={postType} onChange={setPostType} />
                    </div>

                    {/* Danger Level — conditional */}
                    {postType === "In Danger" && (
                        <div style={{ marginBottom: "18px", animation: "fadeIn 0.2s ease" }}>
                            <FieldLabel>Danger Level</FieldLabel>
                            <PillGroup options={DANGER_LEVELS} value={dangerLevel} onChange={setDangerLevel} />
                        </div>
                    )}

                    {/* Historical Period & Region */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "18px" }}>
                        <div style={{ flex: 1 }}>
                            <FieldLabel>Historical Period</FieldLabel>
                            <input type="text" value={historicalPeriod}
                                onChange={(e) => setHistoricalPeriod(e.target.value)}
                                onClick={() => setShowHistoricalPeriodPopup(true)}
                                style={{ ...inputStyle, cursor: "pointer" }} ref={withFocus}
                                placeholder="Date or period"
                                readOnly />
                        </div>
                        <div style={{ flex: 1 }}>
                            <FieldLabel>Region</FieldLabel>
                            <input type="text" value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                style={inputStyle} ref={withFocus} />
                        </div>
                    </div>

                    {/* Monument Type */}
                    <div>
                        <FieldLabel>Monument Type</FieldLabel>
                        <PillGroup options={MONUMENT_TYPES} value={monumentType} onChange={setMonumentType} />
                    </div>
                </SectionBlock>

                {/* ══ VISIBILITY card ══ */}
                <SectionBlock isLast={true}>
                    <SectionLabel>Post Visibility</SectionLabel>

                    <div style={{ marginBottom: "14px" }}>
                        <PillGroup options={["Public", "Private"]} value={visibility} onChange={setVisibility} />
                    </div>

                    {/* Private group tags (always visible, interactive only when Private) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* Tags area — pointer-events locked unless Private */}
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: "8px",
                                padding: "12px",
                                backgroundColor: "#ffffff",
                                borderRadius: "8px",
                                border: "1px solid #ffffff",
                                boxShadow: "0 1px 4px rgba(67,40,23,0.06)",
                                minHeight: "46px",
                                opacity: visibility === "Private" ? 1 : 0.6,
                                pointerEvents: visibility === "Private" ? "auto" : "none",
                            }}
                        >
                            {selectedGroups.map((group, i) => (
                                <span
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "4px 12px",
                                        borderRadius: "9999px",
                                        fontSize: "14px",
                                        fontFamily: FONT,
                                        fontWeight: 400,
                                        backgroundColor: CREAM_PAGE,
                                        border: `1px solid #C4A882`,
                                        color: ESPRESSO,
                                    }}
                                >
                                    {group}
                                    {/* × button */}
                                    <button
                                        type="button"
                                        onClick={() => removeGroup(i)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            fontSize: "16px",
                                            color: ESPRESSO,
                                            lineHeight: 1,
                                        }}
                                        title="Remove group"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* + circle button — ALWAYS clickable, outside the locked container */}
                        <button
                            type="button"
                            onClick={() => setShowGroupsPopup(true)}
                            style={{
                                flexShrink: 0,
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                border: `1px solid #C4A882`,
                                backgroundColor: "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "background-color 0.15s",
                                pointerEvents: "auto",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(196,168,130,0.20)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            title="Add group"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                stroke={ESPRESSO} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>
                </SectionBlock>
            </div>

            {/* ── Form Actions ── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "12px",
                    padding: "16px 32px",
                    backgroundColor: CREAM_PAGE,
                }}
            >
                {/* Cancel text button */}
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: "9px 16px",
                        background: "none",
                        border: "none",
                        color: ESPRESSO,
                        fontFamily: FONT,
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                    Cancel
                </button>

                {/* Done */}
                <button
                    type="button"
                    onClick={onDone}
                    style={{
                        padding: "9px 24px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: ESPRESSO,
                        color: CREAM_PAGE,
                        fontFamily: FONT,
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#5a3822"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ESPRESSO; }}
                >
                    Done
                </button>
            </div>


            {/* ── AddLocation Popup ── */}
            {showLocationPopup && (
                <AddLocationPopup
                    initialValue={location}
                    onConfirm={(val) => setLocation(val)}
                    onClose={() => setShowLocationPopup(false)}
                />
            )}

            {/* ── AddGroups Popup ── */}
            {showGroupsPopup && (
                <AddGroupsPopup
                    onConfirm={handleGroupsConfirm}
                    onClose={() => setShowGroupsPopup(false)}
                />
            )}

            {/* ── AddHistoricalPeriod Popup ── */}
            {showHistoricalPeriodPopup && (
                <AddHistoricalPeriodPopup
                    initialValue={historicalPeriod}
                    onConfirm={(val) => setHistoricalPeriod(val)}
                    onClose={() => setShowHistoricalPeriodPopup(false)}
                />
            )}
        </div>
    );
}
