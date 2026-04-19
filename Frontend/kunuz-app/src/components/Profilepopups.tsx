"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, LayoutDashboard } from "lucide-react";

// ─────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────
interface ChangeEmailForm {
  newEmail: string;
  confirmPassword: string;
}

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ─────────────────────────────────────────────────────────
//  SHARED UI HELPERS
// ─────────────────────────────────────────────────────────

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        zIndex: 100,
      }}
    />
  );
}

function PopupCard({ children, onClick }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void }) {
  return (
    <div
      onClick={onClick}
      style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFF8E2",
          borderRadius: "20px",
          padding: "36px 32px 28px",
          width: "400px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "64px", height: "64px", borderRadius: "50%",
        border: "1.5px solid #432817",
        backgroundColor: "rgba(67,40,23,0.07)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "16px",
      }}
    >
      {children}
    </div>
  );
}

function Field({ placeholder, value, onChange, type = "text" }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ width: "100%", position: "relative", marginBottom: "10px" }}>
      <input
        type={isPassword && !show ? "password" : "text"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", height: "48px", borderRadius: "10px",
          border: `1.5px solid ${focused ? "#432817" : "#D6CFC3"}`,
          backgroundColor: "#FFFFFF",
          padding: isPassword ? "0 44px 0 16px" : "0 16px",
          fontFamily: "'Lato', sans-serif", fontSize: "15px",
          color: "#432817", outline: "none", boxSizing: "border-box",
          transition: "border 0.15s",
        }}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8B7355", display: "flex", alignItems: "center" }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}

function PrimaryBtn({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", height: "50px", borderRadius: "10px", border: "none",
        backgroundColor: hovered ? "#2e1a0e" : "#432817",
        color: "#FFFFFF", fontFamily: "'Lato', sans-serif",
        fontWeight: 700, fontSize: "16px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "background 0.18s", marginTop: "6px",
      }}
    >
      {label}
    </button>
  );
}

function CancelBtn({ label = "Cancel", onClick }: { label?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ background: "none", border: "none", cursor: "pointer", color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 600, fontSize: "15px", marginTop: "12px", opacity: 0.75 }}
    >
      {label}
    </button>
  );
}

function PopupTitle({ text }: { text: string }) {
  return <p style={{ margin: "0 0 6px", color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "22px", textAlign: "center" }}>{text}</p>;
}

function PopupSubtitle({ text }: { text: string }) {
  return <p style={{ margin: "0 0 20px", color: "#8B7355", fontFamily: "'Lato', sans-serif", fontWeight: 400, fontSize: "14px", textAlign: "center" }}>{text}</p>;
}

function GlobalStyles() {
  return (
    <style>{`
      @keyframes popIn {
        from { transform: scale(0.88); opacity: 0; }
        to   { transform: scale(1);    opacity: 1; }
      }
    `}</style>
  );
}

// ═════════════════════════════════════════════════════════
//  POPUP 1 — Change Email
// ═════════════════════════════════════════════════════════
export function ChangeEmailPopup({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<ChangeEmailForm>({ newEmail: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof ChangeEmailForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.newEmail || !form.confirmPassword) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      // 🔌 BACKEND INTEGRATION POINT
      // const res = await fetch("/api/user/change-email", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      //   body: JSON.stringify(form),
      // });
      // if (!res.ok) throw new Error((await res.json()).message);
      console.log("Payload:", form);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <PopupCard onClick={onClose}>
        <IconBadge><Mail size={26} color="#432817" strokeWidth={1.5} /></IconBadge>
        <PopupTitle text="Change email" />
        <PopupSubtitle text="Enter your new email address below" />
        <div style={{ width: "100%" }}>
          <Field placeholder="New email address"   value={form.newEmail}        onChange={update("newEmail")} />
          <Field placeholder="Confirm your password" value={form.confirmPassword} onChange={update("confirmPassword")} type="password" />
        </div>
        {error && <p style={{ color: "#C0392B", fontSize: "13px", margin: "4px 0 0", fontFamily: "'Lato', sans-serif" }}>{error}</p>}
        <PrimaryBtn label={loading ? "Saving…" : "Save changes"} onClick={handleSubmit} disabled={loading} />
        <CancelBtn onClick={onClose} />
      </PopupCard>
      <GlobalStyles />
    </>
  );
}

// ═════════════════════════════════════════════════════════
//  POPUP 2 — Change Password
// ═════════════════════════════════════════════════════════
export function ChangePasswordPopup({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<ChangePasswordForm>({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof ChangePasswordForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) { setError("Please fill in all fields."); return; }
    if (form.newPassword !== form.confirmNewPassword) { setError("New passwords do not match."); return; }
    setLoading(true);
    try {
      // 🔌 BACKEND INTEGRATION POINT
      // const res = await fetch("/api/user/change-password", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      //   body: JSON.stringify(form),
      // });
      // if (!res.ok) throw new Error((await res.json()).message);
      console.log("Payload:", form);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <PopupCard onClick={onClose}>
        <IconBadge><Lock size={26} color="#432817" strokeWidth={1.5} /></IconBadge>
        <PopupTitle text="Change password" />
        <PopupSubtitle text="Choose a strong new password" />
        <div style={{ width: "100%" }}>
          <Field placeholder="Current password"     value={form.currentPassword}    onChange={update("currentPassword")}    type="password" />
          <Field placeholder="New password"         value={form.newPassword}        onChange={update("newPassword")}        type="password" />
          <Field placeholder="Confirm new password" value={form.confirmNewPassword} onChange={update("confirmNewPassword")} type="password" />
        </div>
        {error && <p style={{ color: "#C0392B", fontSize: "13px", margin: "4px 0 0", fontFamily: "'Lato', sans-serif" }}>{error}</p>}
        <PrimaryBtn label={loading ? "Updating…" : "Update password"} onClick={handleSubmit} disabled={loading} />
        <CancelBtn onClick={onClose} />
      </PopupCard>
      <GlobalStyles />
      
    </>
  );
}
// ═════════════════════════════════════════════════════════
//  POPUP 3 — Dashboard
// ═════════════════════════════════════════════════════════
export function DashboardPopup({
  onClose,
  isModerator = false,
  onChangeEmail,
  onChangePassword,
  onDeleteAccount,
  onLogout,
  onPlatformStatistics,
}: {
  onClose: () => void;
  isModerator?: boolean;
  onChangeEmail: () => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
  onPlatformStatistics?: () => void;
}) {
  const items = [
    {
      label: "Change email",
      icon: <Mail size={18} color="#432817" strokeWidth={1.5} />,
      onClick: () => { onClose(); onChangeEmail(); },
      danger: false,
    },
    {
      label: "Change password",
      icon: <Lock size={18} color="#432817" strokeWidth={1.5} />,
      onClick: () => { onClose(); onChangePassword(); },
      danger: false,
    },
    ...(isModerator
      ? [{
          label: "Platform statistics",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
          onClick: () => { onClose(); onPlatformStatistics?.(); },
          danger: false,
        }]
      : []),
    {
      label: "Delete account",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" /><path d="M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      ),
      onClick: () => { onClose(); onDeleteAccount(); },
      danger: true,
    },
    {
      label: "Logout",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
      onClick: () => { onClose(); onLogout(); },
      danger: false,
    },
  ];

  return (
    <>
      <Backdrop onClick={onClose} />
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 101,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#FFF8E2",
            borderRadius: "20px",
            padding: "28px 28px 20px",
            width: "360px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
            animation: "popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #E0D5C5" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1.5px solid #432817", backgroundColor: "rgba(67,40,23,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LayoutDashboard size={20} color="#432817" strokeWidth={1.5} />
            </div>
            <p style={{ margin: 0, color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "20px" }}>
              Dashboard
            </p>
          </div>

          {/* Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  width: "100%", padding: "13px 14px",
                  borderRadius: "10px", border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer", transition: "background 0.15s",
                  fontFamily: "'Lato', sans-serif", fontWeight: 600,
                  fontSize: "15px",
                  color: item.danger ? "#C0392B" : "#432817",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F0EAD8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <GlobalStyles />
    </>
  );
}