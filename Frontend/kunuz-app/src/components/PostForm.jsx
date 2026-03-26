"use client";

import { useState, useRef, useEffect } from "react";
import AddLocationPopup from "./AddLocationPopup";
import AddGroupsPopup from "./AddGroupsPopup";
import AddHistoricalPeriodPopup from "./AddHistoricalPeriodPopup";
import RichTextEditor, { TitleEditor } from "./RichTextEditor";
import NotificationModal from "./NotificationModal";

const FONT = "var(--font-lato), 'Lato', sans-serif";
const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const SISAL = "#C4A882";
const GOLD = "#8B6914";

function MiniCalendar({ value, onChange, onClose }) {
  const ref = useRef(null);
  const today = new Date();
  const selected = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth());

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const pad = (n) => String(n).padStart(2, "0");
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(67,40,23,0.18)",
        border: "1px solid rgba(196,168,130,0.4)",
        padding: "12px",
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: ESPRESSO, padding: "4px 8px", borderRadius: "6px" }}>
          ‹
        </button>
        <span style={{ fontWeight: 700, fontSize: "13px", color: ESPRESSO }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: ESPRESSO, padding: "4px 8px", borderRadius: "6px" }}>
          ›
        </button>
      </div>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#A09080", padding: "2px 0" }}>
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isSelected = value === dateStr;
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          return (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(dateStr); onClose(); }}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: isToday && !isSelected ? `1px solid ${SISAL}` : "none",
                backgroundColor: isSelected ? ESPRESSO : "transparent",
                color: isSelected ? "#fff" : ESPRESSO,
                fontSize: "12px",
                fontWeight: isSelected || isToday ? 700 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(196,168,130,0.2)"; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

function SectionBlock({ children, isLast = false }) {
  return (
    <div
      style={{ marginBottom: isLast ? "16px" : "32px", position: "relative" }}
    >
      {children}
      {!isLast && (
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            marginTop: "32px",
          }}
        />
      )}
    </div>
  );
}

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

function StyledDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const display = value || placeholder || "";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
          textAlign: "left",
          boxShadow: open
            ? "0 0 0 2.5px rgba(139,105,20,0.18)"
            : "0 1px 4px rgba(67,40,23,0.06)",
          transition: "box-shadow 0.15s",
        }}
      >
        <span
          style={{
            color: value ? ESPRESSO : "#A09080",
            fontSize: "14px",
            fontFamily: FONT,
            fontStyle: value ? "normal" : "italic",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {display}
        </span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke={ESPRESSO}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
            opacity: 0.5,
            marginLeft: "6px",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 200,
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(67,40,23,0.18)",
            border: "1px solid rgba(196,168,130,0.4)",
            maxHeight: "220px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: `${SISAL} transparent`,
            padding: "6px",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontSize: "13px",
                  fontWeight: isSelected ? 700 : 400,
                  color: isSelected ? GOLD : ESPRESSO,
                  backgroundColor: isSelected
                    ? "rgba(139,105,20,0.08)"
                    : "transparent",
                  transition: "background-color 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(196,168,130,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PostForm({
  onCancel,
  onDone,
  initialValues = {},
  showFooter = true,
  isSubmitting = false,
  isEditMode = false,
}) {
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [description, setDescription] = useState(
    initialValues.description ?? "",
  );
  const [location, setLocation] = useState(initialValues.location ?? "");
  const [postType, setPostType] = useState(
    initialValues.postType ?? "Discovery",
  );
  const [dangerLevel, setDangerLevel] = useState(
    initialValues.dangerLevel ?? null,
  );
  const [historicalPeriod, setHistoricalPeriod] = useState(
    initialValues.historicalPeriod ?? "",
  );
  const [region, setRegion] = useState(initialValues.region ?? "");
  const [monumentType, setMonumentType] = useState(
    initialValues.monumentType ?? null,
  );
  const [currentStatus, setCurrentStatus] = useState(
    initialValues.currentStatus ?? null,
  );
  const [visibility, setVisibility] = useState(
    initialValues.visibility ?? "Public",
  );
  const [selectedGroups, setSelectedGroups] = useState(
    initialValues.groups ?? [],
  );
  const [startTime, setStartTime] = useState(initialValues.startTime ?? "");
  const [endTime, setEndTime] = useState(initialValues.endTime ?? "");
  const [startDate, setStartDate] = useState(initialValues.startDate ?? "");
  const [endDate, setEndDate] = useState(initialValues.endDate ?? "");

  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showGroupsPopup, setShowGroupsPopup] = useState(false);
  const [showHistoricalPeriodPopup, setShowHistoricalPeriodPopup] =
    useState(false);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  useEffect(() => {
    setTitle(initialValues.title ?? "");
    setDescription(initialValues.description ?? "");
    setLocation(initialValues.location ?? "");
    setPostType(initialValues.postType ?? "Discovery");
    setDangerLevel(initialValues.dangerLevel ?? null);
    setCurrentStatus(initialValues.currentStatus ?? null);
    setHistoricalPeriod(initialValues.historicalPeriod ?? "");
    setRegion(initialValues.region ?? "");
    setMonumentType(initialValues.monumentType ?? null);
    setVisibility(initialValues.visibility ?? "Public");
    setSelectedGroups(initialValues.groups ?? []);
    setStartTime(initialValues.startTime ?? "");
    setEndTime(initialValues.endTime ?? "");
  }, [
    initialValues.title,
    initialValues.description,
    initialValues.location,
    initialValues.postType,
    initialValues.dangerLevel,
    initialValues.currentStatus,
    initialValues.historicalPeriod,
    initialValues.region,
    initialValues.monumentType,
    initialValues.visibility,
    JSON.stringify(initialValues.groups ?? []),
    initialValues.startTime,
    initialValues.endTime,
    initialValues.startDate,
    initialValues.endDate,
  ]);

  const POST_TYPES = ["Question", "Visit", "Discovery", "In Danger", "Event"];
  const DANGER_LEVELS = ["Low", "Medium", "High", "Critical"];
  const MONUMENT_TYPES = ["Civil", "Military", "Religious", "Funerary"];
  const CURRENT_STATUSES = ["Destroyed", "Under intervention", "Restored", "Alert"];
  const HISTORICAL_PERIODS = [
    "Prehistory",
    "Protohistory",
    "Numidian period",
    "Punic (Carthaginian) period",
    "Roman period",
    "Vandal period",
    "Byzantine period",
    "Early Islamic period",
    "Rostamid dynasty",
    "Zirid dynasty",
    "Hammadid dynasty",
    "Almohad dynasty",
    "Zayyanid dynasty",
    "Ottoman period",
    "French colonization",
    "War of Independence",
    "Independent Algeria",
    "Contemporary period",
  ];
  const REGIONS = [
    "Kabylia",
    "Tuareg",
    "Chaoui",
    "Chleuh",
    "Medea",
    "Constantine",
    "Algiers",
    "Tlemcen",
    "Oran",
    "Tipaza",
    "Setif",
    "Batna",
    "Beni Mzab",
    "Ouled Nail",
    "Tassili n'Ajjer",
  ];

  const removeGroup = (idx) =>
    setSelectedGroups((prev) => prev.filter((_, i) => i !== idx));

  const handleGroupsConfirm = (groups) => {
    const names = groups.map((g) => g.name);
    setSelectedGroups((prev) => {
      const existing = new Set(prev);
      return [...prev, ...names.filter((n) => !existing.has(n))];
    });
  };

  const withFocus = (el) => {
    if (!el) return;
    el.addEventListener("focus", () => {
      el.style.boxShadow = "0 0 0 2.5px rgba(139,105,20,0.18)";
    });
    el.addEventListener("blur", () => {
      el.style.boxShadow = "0 1px 4px rgba(67,40,23,0.06)";
    });
  };

  const handleConfirmDone = async () => {
    setShowDoneModal(false);

    await onDone({
      title,
      description,
      location,
      postType,
      dangerLevel,
      currentStatus,
      historicalPeriod,
      region,
      monumentType,
      visibility,
      groups: selectedGroups,
      startTime,
      endTime,
      startDate,
      endDate,
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#F7F5EF",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="hide-scrollbar"
      >
        <SectionBlock>
          <SectionLabel>Info</SectionLabel>

          <div style={{ marginBottom: "14px" }}>
            <FieldLabel>
              Title <span style={{ color: "red" }}>*</span>
            </FieldLabel>
            <TitleEditor
              value={title}
              onChange={setTitle}
              placeholder="Entrez le titre de votre post ici..."
            />
          </div>

          <FieldLabel>Description</FieldLabel>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Entrez le contenu de votre post ici..."
            minHeight="180px"
          />
        </SectionBlock>

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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(196,168,130,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Add location"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke={ESPRESSO}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </SectionBlock>

        <SectionBlock>
          <SectionLabel>Labels</SectionLabel>

          <div style={{ marginBottom: "18px" }}>
            <FieldLabel>
              Post Type <span style={{ color: "red" }}>*</span>
            </FieldLabel>
            <PillGroup
              options={POST_TYPES}
              value={postType}
              onChange={setPostType}
            />
          </div>

          {postType === "In Danger" && (
            <>
              <div
                style={{ marginBottom: "18px", animation: "fadeIn 0.2s ease" }}
              >
                <FieldLabel>Danger Level</FieldLabel>
                <PillGroup
                  options={DANGER_LEVELS}
                  value={dangerLevel}
                  onChange={setDangerLevel}
                />
              </div>

              {isEditMode && (
                <div
                  style={{ marginBottom: "18px", animation: "fadeIn 0.25s ease" }}
                >
                  <FieldLabel>Current Status</FieldLabel>
                  <PillGroup
                    options={CURRENT_STATUSES}
                    value={currentStatus}
                    onChange={setCurrentStatus}
                  />
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: "16px", marginBottom: "18px" }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Historical Period</FieldLabel>
              <StyledDropdown
                value={historicalPeriod}
                onChange={setHistoricalPeriod}
                options={HISTORICAL_PERIODS}
                placeholder="Select the historical period"
              />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel>Region</FieldLabel>
              <StyledDropdown
                value={region}
                onChange={setRegion}
                options={REGIONS}
                placeholder="Select the region"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Monument Type</FieldLabel>
            <PillGroup
              options={MONUMENT_TYPES}
              value={monumentType}
              onChange={setMonumentType}
            />
          </div>

          {postType === "Event" && (
            <div style={{ marginTop: "24px" }}>
              <FieldLabel>Event Time</FieldLabel>
              <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", color: ESPRESSO, marginBottom: "6px", fontWeight: "600", fontFamily: FONT }}>Start time</div>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ ...inputStyle, border: "1px solid rgba(196,168,130,0.4)" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", color: ESPRESSO, marginBottom: "6px", fontWeight: "600", fontFamily: FONT }}>End time</div>
                  <input
                    type="datetime-local"
                    value={endTime}
                    min={startTime || undefined}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{ ...inputStyle, border: "1px solid rgba(196,168,130,0.4)" }}
                  />
                </div>
              </div>
            </div>
          )}
        </SectionBlock>

        <SectionBlock isLast={true}>
          <SectionLabel>Post Visibility <span style={{ color: "red" }}>*</span></SectionLabel>

          <div style={{ marginBottom: "14px" }}>
            <PillGroup
              options={["Public", "Private"]}
              value={visibility}
              onChange={setVisibility}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                pointerEvents: "auto",
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

            <button
              type="button"
              onClick={() => setShowGroupsPopup(true)}
              style={{
                flexShrink: 0,
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid #C4A882",
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background-color 0.15s",
                pointerEvents: "auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(196,168,130,0.20)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Add group"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke={ESPRESSO}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </SectionBlock>
      </div>

      {showFooter && (
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
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: "9px 16px",
              background: "none",
              border: "none",
              color: ESPRESSO,
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: "14px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
              opacity: isSubmitting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.opacity = "0.7";
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.opacity = "1";
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              if (postType === "Event" && startTime && endTime) {
                if (new Date(endTime) <= new Date(startTime)) {
                  alert("The End time must be strictly after the Start time.");
                  return;
                }
              }
              if (isEditMode) {
                setShowDoneModal(true);
              } else {
                handleConfirmDone();
              }
            }}
            disabled={isSubmitting}
            style={{
              padding: "9px 24px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: ESPRESSO,
              color: CREAM_PAGE,
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: "14px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting)
                e.currentTarget.style.backgroundColor = "#5a3822";
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting)
                e.currentTarget.style.backgroundColor = ESPRESSO;
            }}
          >
            {isSubmitting ? "Saving..." : "Done"}
          </button>
        </div>
      )}

      <NotificationModal
        isOpen={showDoneModal}
        onClose={() => setShowDoneModal(false)}
        type="success"
        title="Save changes?"
        message="Are you sure you want to save these changes and update your post?"
        primaryAction={{
          label: isSubmitting ? "Saving..." : "Save & Done",
          onClick: handleConfirmDone,
        }}
        secondaryAction={{
          label: "Review Again",
          onClick: () => setShowDoneModal(false),
        }}
      />

      {showLocationPopup && (
        <AddLocationPopup
          initialValue={location}
          onConfirm={(val) => setLocation(val)}
          onClose={() => setShowLocationPopup(false)}
        />
      )}

      {showGroupsPopup && (
        <AddGroupsPopup
          onConfirm={handleGroupsConfirm}
          onClose={() => setShowGroupsPopup(false)}
        />
      )}
    </div>
  );
}
