"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import RichTextEditor from "@/components/RichTextEditor";

const FONT = "var(--font-lato), 'Lato', sans-serif";
const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";

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

function SectionBlock({ children, isLast = false }: { children: React.ReactNode; isLast?: boolean }) {
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3 style={{
        color: ESPRESSO,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: "18px",
        letterSpacing: "0.01em",
        marginBottom: "8px",
      }}>
        {children}
      </h3>
      <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: ESPRESSO,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: "12px",
      marginBottom: "6px",
    }}>
      {children}
    </p>
  );
}

type PillOption = {
  label: string;
  value: string;
};

function PillGroup({ options, value, onChange, variant = "default" }: {
  options: PillOption[];
  value: string;
  onChange: (val: string) => void;
  variant?: string;
}) {
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
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const normalizeExpertiseValue = (value?: string) => {
  switch ((value || "").toLowerCase()) {
    case "amateur":
      return "Amateur";
    case "student":
      return "Student";
    case "researcher":
      return "Researcher";
    case "historian":
      return "Historian";
    case "guide":
    case "tour guide":
      return "Tour Guide";
    default:
      return value || "Researcher";
  }
};

export default function ProfileForm({ onCancel, onDone, initialValues = {} }: {
  onCancel: () => void;
  onDone: (values: { firstName: string; lastName: string; biography: string; expertise: string; speciality: string; }) => void;
  initialValues?: {
    firstName?: string;
    lastName?: string;
    biography?: string;
    expertise?: string;
    speciality?: string;
  };
}) {
  const t = useTranslations("auth.profileForm");
  const expertiseOptions: PillOption[] = [
    { value: "Amateur", label: t("expertiseOptions.amateur") },
    { value: "Student", label: t("expertiseOptions.student") },
    { value: "Researcher", label: t("expertiseOptions.researcher") },
    { value: "Historian", label: t("expertiseOptions.historian") },
    { value: "Tour Guide", label: t("expertiseOptions.tourGuide") },
  ];

  const [formData, setFormData] = useState({
    firstName: initialValues.firstName ?? "",
    lastName: initialValues.lastName ?? "",
    biography: initialValues.biography ?? "",
    expertise: normalizeExpertiseValue(initialValues.expertise),
    speciality: initialValues.speciality ?? "",
    badgeFiles: [] as string[],
  });

  const badgeInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBadgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const names = Array.from(e.target.files).map((f) => f.name);
      setFormData((prev) => ({ ...prev, badgeFiles: [...prev.badgeFiles, ...names] }));
    }
  };

  const handleExpertiseChange = (val: string) => {
    setFormData((prev) => ({ ...prev, expertise: val }));
  };

  const withFocus = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (!el) return;
    el.addEventListener("focus", () => {
      el.style.boxShadow = "0 0 0 2.5px rgba(139,105,20,0.18)";
    });
    el.addEventListener("blur", () => {
      el.style.boxShadow = "0 1px 4px rgba(67,40,23,0.06)";
    });
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      backgroundColor: CREAM_PAGE,
      fontFamily: FONT,
    }}>
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
          <SectionLabel>{t("sections.info")}</SectionLabel>

          <div style={{ marginBottom: "14px" }}>
            <FieldLabel>{t("fields.firstName")}</FieldLabel>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              style={inputStyle}
              ref={withFocus}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <FieldLabel>{t("fields.lastName")}</FieldLabel>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              style={inputStyle}
              ref={withFocus}
            />
          </div>

          <div>
            <FieldLabel>{t("fields.biography")}</FieldLabel>
            <RichTextEditor
              value={formData.biography}
              onChange={(val: string) => setFormData((prev) => ({ ...prev, biography: val }))}
              placeholder={t("placeholders.biography")}
              minHeight="140px"
            />
          </div>
        </SectionBlock>

        <SectionBlock>
          <SectionLabel>{t("sections.expertise")}</SectionLabel>
          <PillGroup
            options={expertiseOptions}
            value={formData.expertise}
            onChange={handleExpertiseChange}
            variant="expertise"
          />
        </SectionBlock>

        <SectionBlock>
          <SectionLabel>{t("sections.speciality")}</SectionLabel>
          <input
            className="post-form-control"
            type="text"
            name="speciality"
            value={formData.speciality}
            onChange={handleChange}
            style={inputStyle}
            ref={withFocus}
          />
        </SectionBlock>

        <SectionBlock isLast={true}>
          <SectionLabel>{t("sections.badge")}</SectionLabel>
          <div
            className="post-form-control profile-form-badge-trigger"
            onClick={() => badgeInputRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              backgroundColor: "#FFFFFF",
              borderRadius: "10.75px",
              boxShadow: "0 1px 4px rgba(67,40,23,0.06)",
              width: "340px",
              cursor: "pointer",
            }}
          >
            <span className="profile-form-badge-text" style={{ color: "#79747E", fontFamily: FONT, fontSize: "14px" }}>
              {formData.badgeFiles.length > 0
                ? t("badge.selectedCount", { count: formData.badgeFiles.length })
                : t("badge.request")}
            </span>
            <svg className="profile-form-badge-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#79747E" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <input
            ref={badgeInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleBadgeChange}
          />
        </SectionBlock>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "12px",
        padding: "16px 32px",
        backgroundColor: CREAM_PAGE,
      }}>
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
          {t("actions.cancel")}
        </button>

        <button
          type="button"
          onClick={() => onDone({ firstName: formData.firstName, lastName: formData.lastName, biography: formData.biography, expertise: formData.expertise, speciality: formData.speciality })}
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
          {t("actions.done")}
        </button>
      </div>
    </div>
  );
}
