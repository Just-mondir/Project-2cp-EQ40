"use client";

import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";

<<<<<<< HEAD
=======
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || process.env.NEXT_PUBLIC_TOKEN || "";
}

function getAuthUserEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("authUser");
    const user = raw ? JSON.parse(raw) : null;
    return user?.email || "";
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────
>>>>>>> 35e83fc66c1153301525f4272de59d76264cbaf0
interface ChangeEmailForm {
  newEmail: string;
  confirmPassword: string;
}

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

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
        className="profile-popup-card"
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
      className="profile-popup-icon-badge"
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

// ── Password field with show/hide toggle ──
function PasswordField({ placeholder, value, onChange }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations("auth.profilePopups");
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ width: "100%", position: "relative", marginBottom: "10px" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="new-password"
        style={{
          width: "100%", height: "48px", borderRadius: "10px",
          border: `1.5px solid ${focused ? "#432817" : "#D6CFC3"}`,
          backgroundColor: "#FFFFFF",
          padding: "0 44px 0 16px",
          fontFamily: "'Lato', sans-serif", fontSize: "15px",
          color: "#432817", outline: "none", boxSizing: "border-box",
          transition: "border 0.15s",
        }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        style={{
          position: "absolute", right: "12px", top: "50%",
          transform: "translateY(-50%)", background: "none",
          border: "none", cursor: "pointer", color: "#8B7355",
          display: "flex", alignItems: "center",
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ── Plain text field (email, OTP, etc.) ──
function TextField({ placeholder, value, onChange, maxLength }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ width: "100%", position: "relative", marginBottom: "10px" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        maxLength={maxLength}
        style={{
          width: "100%", height: "48px", borderRadius: "10px",
          border: `1.5px solid ${focused ? "#432817" : "#D6CFC3"}`,
          backgroundColor: "#FFFFFF",
          padding: "0 16px",
          fontFamily: "'Lato', sans-serif", fontSize: "15px",
          color: "#432817", outline: "none", boxSizing: "border-box",
          transition: "border 0.15s",
        }}
      />
<<<<<<< HEAD
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? t("actions.hidePassword") : t("actions.showPassword")}
          className="profile-popup-eye-toggle"
          style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8B7355", display: "flex", alignItems: "center" }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
=======
>>>>>>> 35e83fc66c1153301525f4272de59d76264cbaf0
    </div>
  );
}

function PrimaryBtn({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="profile-popup-primary-btn"
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

function CancelBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="profile-popup-cancel-btn"
      style={{ background: "none", border: "none", cursor: "pointer", color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 600, fontSize: "15px", marginTop: "12px", opacity: 0.75 }}
    >
      {label}
    </button>
  );
}

function PopupTitle({ text }: { text: string }) {
  return <p className="profile-popup-title" style={{ margin: "0 0 6px", color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "22px", textAlign: "center" }}>{text}</p>;
}

function PopupSubtitle({ text }: { text: string }) {
  return <p className="profile-popup-subtitle" style={{ margin: "0 0 20px", color: "#8B7355", fontFamily: "'Lato', sans-serif", fontWeight: 400, fontSize: "14px", textAlign: "center" }}>{text}</p>;
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

function useIsDarkHomeTheme() {
  const [isDarkHomeTheme, setIsDarkHomeTheme] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const syncTheme = () => {
      setIsDarkHomeTheme(
        root.dataset.theme === "dark" && root.dataset.themeScope === "home",
      );
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-theme-scope"] });
    return () => observer.disconnect();
  }, []);

  return isDarkHomeTheme;
}

export function ChangeEmailPopup({ onClose }: { onClose: () => void }) {
  const t = useTranslations("auth.profilePopups.changeEmail");
  const common = useTranslations("auth.profilePopups");
  const [form, setForm] = useState<ChangeEmailForm>({ newEmail: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isDarkHomeTheme = useIsDarkHomeTheme();
  const popupIconColor = isDarkHomeTheme ? "#F6EAD2" : "#432817";

  const update = (key: keyof ChangeEmailForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.newEmail || !form.confirmPassword) { setError(t("errors.required")); return; }
    setLoading(true);
    try {
<<<<<<< HEAD
      console.log("Payload:", form);
=======
      const res = await fetch(`${API_URL}/api/users/me/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ email: form.newEmail }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.errors?.email?.[0] || data?.errors?.detail || data?.message || "Failed to update email.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }
>>>>>>> 35e83fc66c1153301525f4272de59d76264cbaf0
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : common("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <PopupCard onClick={onClose}>
        <IconBadge><Mail size={26} color={popupIconColor} strokeWidth={1.5} /></IconBadge>
        <PopupTitle text={t("title")} />
        <PopupSubtitle text={t("subtitle")} />
        <div style={{ width: "100%" }}>
<<<<<<< HEAD
          <Field placeholder={t("fields.newEmail")} value={form.newEmail} onChange={update("newEmail")} />
          <Field placeholder={t("fields.confirmPassword")} value={form.confirmPassword} onChange={update("confirmPassword")} type="password" />
=======
          <TextField placeholder="New email address" value={form.newEmail} onChange={update("newEmail")} />
          <PasswordField placeholder="Confirm your password" value={form.confirmPassword} onChange={update("confirmPassword")} />
>>>>>>> 35e83fc66c1153301525f4272de59d76264cbaf0
        </div>
        {error && <p style={{ color: "#C0392B", fontSize: "13px", margin: "4px 0 0", fontFamily: "'Lato', sans-serif" }}>{error}</p>}
        <PrimaryBtn label={loading ? t("actions.saving") : t("actions.save")} onClick={handleSubmit} disabled={loading} />
        <CancelBtn onClick={onClose} label={common("actions.cancel")} />
      </PopupCard>
      <GlobalStyles />
    </>
  );
}

export function ChangePasswordPopup({ onClose }: { onClose: () => void }) {
  const t = useTranslations("auth.profilePopups.changePassword");
  const common = useTranslations("auth.profilePopups");
  const [form, setForm] = useState<ChangePasswordForm>({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const isDarkHomeTheme = useIsDarkHomeTheme();
  const popupIconColor = isDarkHomeTheme ? "#F6EAD2" : "#432817";

  const update = (key: keyof ChangePasswordForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) { setError(t("errors.required")); return; }
    if (form.newPassword !== form.confirmNewPassword) { setError(t("errors.mismatch")); return; }
    setLoading(true);
    try {
<<<<<<< HEAD
      console.log("Payload:", form);
=======
      const email = getAuthUserEmail();
      if (!email) { setError("Could not determine your email. Please log in again."); setLoading(false); return; }
      const forgotRes = await fetch(`${API_URL}/api/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const forgotData = await forgotRes.json().catch(() => null);
      if (!forgotRes.ok) {
        const msg = forgotData?.errors?.email?.[0] || forgotData?.message || "Failed to send OTP.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }
      setOtpStep(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setError("");
    if (!otpCode.trim()) { setError("Please enter the OTP code."); return; }
    if (otpCode.trim().length !== 6) { setError("OTP code must be exactly 6 digits."); return; }
    setLoading(true);
    try {
      const email = getAuthUserEmail();
      const res = await fetch(`${API_URL}/api/auth/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpCode, password: form.newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data?.errors?.otp_code?.[0] ||
          data?.errors?.password?.[0] ||
          data?.errors?.detail ||
          data?.message ||
          "Failed to reset password.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }
>>>>>>> 35e83fc66c1153301525f4272de59d76264cbaf0
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : common("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <PopupCard onClick={onClose}>
        <IconBadge><Lock size={26} color={popupIconColor} strokeWidth={1.5} /></IconBadge>
<<<<<<< HEAD
        <PopupTitle text={t("title")} />
        <PopupSubtitle text={t("subtitle")} />
        <div style={{ width: "100%" }}>
          <Field placeholder={t("fields.currentPassword")} value={form.currentPassword} onChange={update("currentPassword")} type="password" />
          <Field placeholder={t("fields.newPassword")} value={form.newPassword} onChange={update("newPassword")} type="password" />
          <Field placeholder={t("fields.confirmNewPassword")} value={form.confirmNewPassword} onChange={update("confirmNewPassword")} type="password" />
        </div>
        {error && <p style={{ color: "#C0392B", fontSize: "13px", margin: "4px 0 0", fontFamily: "'Lato', sans-serif" }}>{error}</p>}
        <PrimaryBtn label={loading ? t("actions.updating") : t("actions.update")} onClick={handleSubmit} disabled={loading} />
        <CancelBtn onClick={onClose} label={common("actions.cancel")} />
=======
        <PopupTitle text="Change password" />
        {!otpStep ? (
          <>
            <PopupSubtitle text="Choose a strong new password" />
            <div style={{ width: "100%" }}>
              <PasswordField placeholder="Current password"     value={form.currentPassword}    onChange={update("currentPassword")} />
              <PasswordField placeholder="New password"         value={form.newPassword}        onChange={update("newPassword")} />
              <PasswordField placeholder="Confirm new password" value={form.confirmNewPassword} onChange={update("confirmNewPassword")} />
            </div>
            {error && <p style={{ color: "#C0392B", fontSize: "13px", margin: "4px 0 0", fontFamily: "'Lato', sans-serif" }}>{error}</p>}
            <PrimaryBtn label={loading ? "Sending OTP…" : "Update password"} onClick={handleSubmit} disabled={loading} />
          </>
        ) : (
          <>
            <PopupSubtitle text="Enter the OTP code sent to your email" />
            <div style={{ width: "100%" }}>
              <TextField placeholder="Enter 6-digit OTP" value={otpCode} onChange={setOtpCode} maxLength={6} />
            </div>
            {error && <p style={{ color: "#C0392B", fontSize: "13px", margin: "4px 0 0", fontFamily: "'Lato', sans-serif" }}>{error}</p>}
            <PrimaryBtn label={loading ? "Updating…" : "Confirm"} onClick={handleOtpSubmit} disabled={loading} />
          </>
        )}
        <CancelBtn onClick={onClose} />
>>>>>>> 35e83fc66c1153301525f4272de59d76264cbaf0
      </PopupCard>
      <GlobalStyles />
    </>
  );
}

<<<<<<< HEAD
=======
// ═════════════════════════════════════════════════════════
//  POPUP 3 — Dashboard
// ═════════════════════════════════════════════════════════
>>>>>>> 35e83fc66c1153301525f4272de59d76264cbaf0
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
  const t = useTranslations("auth.profilePopups.dashboard");
  const isDarkDashboard = useIsDarkHomeTheme();
  const neutralIconColor = isDarkDashboard ? "#F6EAD2" : "#432817";
  const dangerIconColor = isDarkDashboard ? "#F6EAD2" : "#C0392B";

  const items = [
    {
      label: t("items.changeEmail"),
      icon: <Mail size={18} color={neutralIconColor} strokeWidth={1.5} />,
      onClick: () => { onClose(); onChangeEmail(); },
      danger: false,
    },
    {
      label: t("items.changePassword"),
      icon: <Lock size={18} color={neutralIconColor} strokeWidth={1.5} />,
      onClick: () => { onClose(); onChangePassword(); },
      danger: false,
    },
    ...(isModerator
      ? [{
          label: t("items.platformStatistics"),
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={neutralIconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      label: t("items.deleteAccount"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dangerIconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      label: t("items.logout"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={neutralIconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
        style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center" }}
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #E0D5C5" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1.5px solid #432817", backgroundColor: "rgba(67,40,23,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LayoutDashboard size={20} color="#432817" strokeWidth={1.5} />
            </div>
            <p style={{ margin: 0, color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "20px" }}>
              {t("title")}
            </p>
          </div>
<<<<<<< HEAD

=======
>>>>>>> 35e83fc66c1153301525f4272de59d76264cbaf0
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className="profile-dashboard-action"
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
