"use client";

import React, { useState, useRef, useEffect } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import InviteUsersModal, { type User } from "@/components/InviteUsersModal";

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

function SectionBlock({ children, isLast = false }: { children: React.ReactNode; isLast?: boolean }) {
  return (
    <div style={{ marginBottom: isLast ? "16px" : "32px", position: "relative" }}>
      {children}
      {!isLast && (
        <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(0,0,0,0.1)", marginTop: "32px" }} />
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3 style={{ color: ESPRESSO, fontFamily: FONT, fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>
        {children}
      </h3>
      <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(0,0,0,0.1)" }} />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: ESPRESSO, fontFamily: FONT, fontWeight: 600, fontSize: "12px", marginBottom: "6px" }}>
      {children}
    </p>
  );
}

function PillGroup({ options, value, onChange }: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
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

function StyledDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
          boxShadow: open ? "0 0 0 2.5px rgba(139,105,20,0.18)" : "0 1px 4px rgba(67,40,23,0.06)",
          transition: "box-shadow 0.15s",
        }}
      >
        <span style={{
          color: value ? ESPRESSO : "#A09080",
          fontSize: "14px",
          fontFamily: FONT,
          fontStyle: value ? "normal" : "italic",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {value || placeholder || ""}
        </span>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={ESPRESSO} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0, opacity: 0.5, marginLeft: "6px" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200,
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(67,40,23,0.18)", border: "1px solid rgba(196,168,130,0.4)",
          maxHeight: "220px", overflowY: "auto", scrollbarWidth: "thin",
          scrollbarColor: `${SISAL} transparent`, padding: "6px",
        }}>
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontFamily: FONT, fontSize: "13px",
                  fontWeight: isSelected ? 700 : 400,
                  color: isSelected ? GOLD : ESPRESSO,
                  backgroundColor: isSelected ? "rgba(139,105,20,0.08)" : "transparent",
                  transition: "background-color 0.12s",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(196,168,130,0.15)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
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

// ── Lists 
const HISTORICAL_PERIODS = [
  "Prehistory", "Protohistory", "Numidian period", "Punic (Carthaginian) period",
  "Roman period", "Vandal period", "Byzantine period", "Early Islamic period",
  "Rostamid dynasty", "Zirid dynasty", "Hammadid dynasty", "Almohad dynasty",
  "Zayyanid dynasty", "Ottoman period", "French colonization",
  "War of Independence", "Independent Algeria", "Contemporary period",
];

const REGIONS = [
  "Kabylia", "Tuareg", "Chaoui", "Chleuh", "Medea", "Constantine",
  "Algiers", "Tlemcen", "Oran", "Tipaza", "Setif", "Batna",
  "Beni Mzab", "Ouled Nail", "Tassili n'Ajjer",
];

const GROUP_CATEGORIES = [
  "Architecture", "Archaeology", "History", "Art",
  "Photography", "Research", "Tourism", "Conservation",
];

// ── Form 
export default function GuildForm({
  onCancel,
  onDone,
  initialValues = {},
}: {
  onCancel: () => void;
  onDone: (data: any) => void;
  initialValues?: {
    guildName?: string;
    description?: string;
    historicalPeriod?: string;
    region?: string;
    category?: string;
    visibility?: "Public" | "Private";
    rules?: string;
    tags?: string[];
  };
}) {
  const [formData, setFormData] = useState({
    guildName: initialValues.guildName ?? "",
    description: initialValues.description ?? "",
    historicalPeriod: initialValues.historicalPeriod ?? "",
    region: initialValues.region ?? "",
    category: initialValues.category ?? "",
    visibility: (initialValues.visibility ?? "Public") as "Public" | "Private",
    rules: initialValues.rules ?? "",
    tags: initialValues.tags ?? [] as string[],
    tagInput: "",
  });

  // Invited users stored as User objects (id + username) for backend
  const [invitedUsers, setInvitedUsers] = useState<User[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    const tag = formData.tagInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag], tagInput: "" }));
    } else {
      setFormData(prev => ({ ...prev, tagInput: "" }));
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  // Called by InviteUsersModal on confirm — merges without duplicates
  const handleInviteConfirm = (users: User[]) => {
    setInvitedUsers(prev => {
      const existingIds = new Set(prev.map(u => u.id));
      return [...prev, ...users.filter(u => !existingIds.has(u.id))];
    });
  };

  const removeInvited = (id: string) => {
    setInvitedUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: CREAM_PAGE, fontFamily: FONT }}>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", scrollbarWidth: "none" }} className="hide-scrollbar">

        {/* Info */}
        <SectionBlock>
          <SectionLabel>Info</SectionLabel>
          <div style={{ marginBottom: "14px" }}>
            <FieldLabel>Guild name</FieldLabel>
            <input type="text" name="guildName" value={formData.guildName} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <RichTextEditor
              value={formData.description}
              onChange={(val: string) => setFormData(prev => ({ ...prev, description: val }))}
              placeholder="Describe your guild..."
              minHeight="129px"
            />
          </div>
        </SectionBlock>
        
        {/* Thematic tags */}
        <SectionBlock>
          <SectionLabel>Thematic tags</SectionLabel>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Historical Period</FieldLabel>
              <StyledDropdown
                value={formData.historicalPeriod}
                onChange={(val) => setFormData(prev => ({ ...prev, historicalPeriod: val }))}
                options={HISTORICAL_PERIODS}
                placeholder="Select the historical period"
              />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel>Region</FieldLabel>
              <StyledDropdown
                value={formData.region}
                onChange={(val) => setFormData(prev => ({ ...prev, region: val }))}
                options={REGIONS}
                placeholder="Select the region"
              />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel>Category</FieldLabel>
              <StyledDropdown
                value={formData.category}
                onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                options={GROUP_CATEGORIES}
                placeholder="Select a category"
              />
            </div>
          </div>
        </SectionBlock>

        {/* ── Invite members ── */}
        <SectionBlock>
          <SectionLabel>Invite members</SectionLabel>

          {/* Input row — clicking + opens the modal */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, ...inputStyle, padding: "10px 14px", minHeight: "42px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", borderRadius: "10.75px" }}>
              {invitedUsers.length === 0 ? (
                <span style={{ color: "#A09080", fontSize: "14px", fontStyle: "italic", fontFamily: FONT }}>
                </span>
              ) : (
                invitedUsers.map((user) => (
                  <span
                    key={user.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      backgroundColor: "#E0D5C5", borderRadius: "20px",
                      padding: "3px 10px", fontSize: "13px", color: ESPRESSO, fontFamily: FONT,
                    }}
                  >
                    @{user.username}
                    <button
                      type="button"
                      onClick={() => removeInvited(user.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#8B7355", fontSize: "12px", padding: 0, lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* + button — opens InviteUsersModal */}
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              style={{
                flexShrink: 0,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: `1px solid ${SISAL}`,
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(196,168,130,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ESPRESSO} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </SectionBlock>

        {/* Guild Visibility */}
        <SectionBlock>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <SectionLabel>Group Visibility</SectionLabel>
            <div style={{ display: "flex", gap: "8.6px" }}>
              {(["Public", "Private"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, visibility: opt }))}
                  style={{
                    padding: "7.5px 19.35px",
                    borderRadius: "21.5px",
                    border: `1px solid ${formData.visibility === opt ? ESPRESSO : "#D6CFC3"}`,
                    backgroundColor: formData.visibility === opt ? ESPRESSO : "#FFFFFF",
                    color: formData.visibility === opt ? "#FFFFFF" : ESPRESSO,
                    fontFamily: FONT, fontWeight: 500, fontSize: "14px",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </SectionBlock>

        {/* Guild Rules */}
        <SectionBlock isLast>
          <SectionLabel>Group rules</SectionLabel>
          <FieldLabel>Rules &amp; Guidelines (Optional)</FieldLabel>
          <RichTextEditor
            value={formData.rules}
            onChange={(val: string) => setFormData(prev => ({ ...prev, rules: val }))}
            placeholder="Write your guild rules and guidelines..."
            minHeight="129px"
          />
        </SectionBlock>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", padding: "16px 32px", backgroundColor: CREAM_PAGE }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: "9px 16px", background: "none", border: "none", color: ESPRESSO, fontFamily: FONT, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onDone({ ...formData, invitedUsers })}
          style={{ padding: "9px 24px", borderRadius: "8px", border: "none", backgroundColor: ESPRESSO, color: CREAM_PAGE, fontFamily: FONT, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#5a3822"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ESPRESSO; }}
        >
          Done
        </button>
      </div>

      {/* ── Invite Users Modal ── */}
      <InviteUsersModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onConfirm={handleInviteConfirm}
        alreadyInvited={invitedUsers.map(u => u.id)}
      />
    </div>
  );
}
