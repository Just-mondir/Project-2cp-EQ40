"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import AddLocationPopup from "./AddLocationPopup";
import AddGroupsPopup from "./AddGroupsPopup";
import RichTextEditor, { TitleEditor } from "./RichTextEditor";
import NotificationModal from "./NotificationModal";

const FONT = "var(--font-lato), 'Lato', sans-serif";
const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const SISAL = "#C4A882";
const GOLD = "#8B6914";

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

function PillGroup({ options, value, onChange, variant = "default" }) {
  return (
    <div
      className="post-form-pill-group"
      data-variant={variant}
      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="post-form-pill"
            data-option={opt.value}
            data-active={active ? "true" : "false"}
            style={{
              display: "inline-flex",
              alignItems: "center",
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
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
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

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="post-form-control post-form-dropdown-trigger"
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
          className="post-form-dropdown-value"
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
          {selectedOption?.label || placeholder || ""}
        </span>
        <svg
          className="post-form-dropdown-icon"
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
          className="post-form-dropdown-menu"
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
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className="post-form-dropdown-option"
                data-selected={isSelected ? "true" : "false"}
                onClick={() => {
                  onChange(opt.value);
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
                {opt.label}
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
  hidePostType = false,
  hideVisibility = false,  // ← ADD THIS
}) {
  const t = useTranslations("auth.postForm");
  const postTypeOptions = [
    { value: "Question", label: t("options.postTypes.question") },
    { value: "Visit", label: t("options.postTypes.visit") },
    { value: "Discovery", label: t("options.postTypes.discovery") },
    { value: "In Danger", label: t("options.postTypes.inDanger") },
    { value: "Event", label: t("options.postTypes.event") },
  ];
  const dangerLevelOptions = [
    { value: "Low", label: t("options.dangerLevels.low") },
    { value: "Medium", label: t("options.dangerLevels.medium") },
    { value: "High", label: t("options.dangerLevels.high") },
    { value: "Critical", label: t("options.dangerLevels.critical") },
  ];
  const monumentTypeOptions = [
    { value: "Civil", label: t("options.monumentTypes.civil") },
    { value: "Military", label: t("options.monumentTypes.military") },
    { value: "Religious", label: t("options.monumentTypes.religious") },
    { value: "Funerary", label: t("options.monumentTypes.funerary") },
  ];
  const statusOptions = [
    { value: "Destroyed", label: t("options.statuses.destroyed") },
    { value: "Under intervention", label: t("options.statuses.underIntervention") },
    { value: "Restored", label: t("options.statuses.restored") },
    { value: "Alert", label: t("options.statuses.alert") },
  ];
  const historicalPeriods = [
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
  ].map((value) => ({ value, label: t(`historicalPeriods.${value}`) }));
  const regions = [
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
  ].map((value) => ({ value, label: t(`regions.${value}`) }));

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
  const selectedMonument = initialValues.selectedMonument ?? null;
  const previousStatus = initialValues.previousStatus ?? "alert";
  const [currentStatus, setCurrentStatus] = useState(
    initialValues.currentStatus ?? "under_intervention",
  );
  const [selectedGroups, setSelectedGroups] = useState(
    initialValues.groups ?? [],
  );
  const [startTime, setStartTime] = useState(initialValues.startTime ?? "");
  const [endTime, setEndTime] = useState(initialValues.endTime ?? "");

  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showGroupsPopup, setShowGroupsPopup] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState(false);

  const removeGroup = (idx) =>
    setSelectedGroups((prev) => prev.filter((_, i) => i !== idx));

  const handleGroupsConfirm = (groups) => {
    setSelectedGroups((prev) => {
      const existingIds = new Set(prev.map(g => g.id));
      const newGroups = groups.filter(g => !existingIds.has(g.id));
      return [...prev, ...newGroups.map(g => ({ id: g.id, name: g.name }))];
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
      historicalPeriod,
      region,
      monumentType,
      visibility: selectedGroups.length > 0 ? "Private" : "Public",
      groups: selectedGroups,
      startTime,
      endTime,
      selectedMonument,
      previousStatus,
      currentStatus,
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
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="hide-scrollbar p-4 md:px-8 md:py-6"
      >
        <SectionBlock>
          <SectionLabel>{t("sections.info")}</SectionLabel>

          <div style={{ marginBottom: "14px" }}>
            <FieldLabel>
              {t("fields.title")} <span style={{ color: "red" }}>*</span>
            </FieldLabel>
            <TitleEditor
              value={title}
              onChange={setTitle}
              placeholder={t("placeholders.title")}
            />
          </div>

          <FieldLabel>{t("fields.description")}</FieldLabel>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder={t("placeholders.description")}
            minHeight="180px"
          />
        </SectionBlock>

        <SectionBlock>
          <SectionLabel>{t("sections.location")}</SectionLabel>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              className="post-form-control"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              placeholder={t("placeholders.location")}
              ref={withFocus}
            />
            <button
              type="button"
              onClick={() => setShowLocationPopup(true)}
              className="post-form-circle-action"
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
              title={t("actions.addLocation")}
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
          <SectionLabel>{t("sections.labels")}</SectionLabel>

          {!hidePostType && (
            <div style={{ marginBottom: "18px" }}>
              <FieldLabel>
                {t("fields.postType")} <span style={{ color: "red" }}>*</span>
              </FieldLabel>
              <PillGroup
                options={postTypeOptions}
                value={postType}
                onChange={setPostType}
                variant="post-type"
              />
            </div>
          )}

          {(postType === "In Danger" || postType === "Alert") && (
            <>
              <div
                style={{ marginBottom: "18px", animation: "fadeIn 0.2s ease" }}
              >
                <FieldLabel>{t("fields.dangerLevel")} <span style={{ color: "red" }}>*</span></FieldLabel>
                <PillGroup
                  options={dangerLevelOptions}
                  value={dangerLevel}
                  onChange={setDangerLevel}
                />
              </div>

              {isEditMode && (
                <div
                  style={{ marginBottom: "18px", animation: "fadeIn 0.25s ease" }}
                >
                  <FieldLabel>{t("fields.currentStatus")}</FieldLabel>
                  <PillGroup
                    options={statusOptions}
                    value={currentStatus}
                    onChange={setCurrentStatus}
                  />
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "18px" }}>
            <div style={{ flex: "1 1 min(100%, 200px)" }}>
              <FieldLabel>{t("fields.historicalPeriod")}</FieldLabel>
              <StyledDropdown
                value={historicalPeriod}
                onChange={setHistoricalPeriod}
                options={historicalPeriods}
                placeholder={t("placeholders.historicalPeriod")}
              />
            </div>
            <div style={{ flex: "1 1 min(100%, 200px)" }}>
              <FieldLabel>{t("fields.region")}</FieldLabel>
              <StyledDropdown
                value={region}
                onChange={setRegion}
                options={regions}
                placeholder={t("placeholders.region")}
              />
            </div>
          </div>

          <div>
            <FieldLabel>{t("fields.monumentType")}</FieldLabel>
            <PillGroup
              options={monumentTypeOptions}
              value={monumentType}
              onChange={setMonumentType}
              variant="monument-type"
            />
          </div>

          {postType === "Event" && (
            <div style={{ marginTop: "24px" }}>
              <FieldLabel>{t("fields.eventTime")} <span style={{ color: "red" }}>*</span></FieldLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
                <div style={{ flex: "1 1 min(100%, 200px)" }}>
                  <div style={{ fontSize: "13px", color: ESPRESSO, marginBottom: "6px", fontWeight: "600", fontFamily: FONT }}>{t("fields.startTime")}</div>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ ...inputStyle, border: "1px solid rgba(196,168,130,0.4)" }}
                  />
                </div>
                <div style={{ flex: "1 1 min(100%, 200px)" }}>
                  <div style={{ fontSize: "13px", color: ESPRESSO, marginBottom: "6px", fontWeight: "600", fontFamily: FONT }}>{t("fields.endTime")}</div>
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
       {!hideVisibility && (
        <SectionBlock isLast={true}>
          <SectionLabel>{t("sections.postVisibility")} <span style={{ color: "red" }}>*</span></SectionLabel>


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
              }}
            >
              {selectedGroups.map((group, i) => (
                <span
                  key={group.id}
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
                  {group.name}
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
                    title={t("actions.removeGroup")}
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
              title={t("actions.addGroup")}
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
      )}
      </div>

      {showFooter && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "16px 20px",
            mdPadding: "16px 32px", // Just for reference, I'll use a class if needed
            backgroundColor: CREAM_PAGE,
          }}
          className="post-form-footer px-5 md:px-8"
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
            {t("actions.cancel")}
          </button>

          <button
            type="button"
            onClick={() => {
              if (postType === "Event" && startTime && endTime) {
                if (new Date(endTime) <= new Date(startTime)) {
                  alert(t("errors.endTimeAfterStart"));
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
            {isSubmitting ? t("actions.saving") : t("actions.done")}
          </button>
        </div>
      )}

      <NotificationModal
        isOpen={showDoneModal}
        onClose={() => setShowDoneModal(false)}
        type="success"
        title={t("reviewModal.title")}
        message={t("reviewModal.message")}
        primaryAction={{
          label: isSubmitting ? t("actions.saving") : t("reviewModal.primaryAction"),
          onClick: handleConfirmDone,
        }}
        secondaryAction={{
          label: t("reviewModal.secondaryAction"),
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
