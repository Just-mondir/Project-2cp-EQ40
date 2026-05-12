"use client";

import { useTranslations } from "next-intl";

const FONT = "var(--font-lato), 'Lato', sans-serif";
const GREEN = "#168F66";

interface JoinRequestSentModalProps {
  onClose: () => void;
}

export default function JoinRequestSentModal({ onClose }: JoinRequestSentModalProps) {
  const t = useTranslations("auth.pages.home");
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 200 }}
      />

      {/* Modal card */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "var(--panel-bg)",
            border: "1px solid var(--border-soft)",
            borderRadius: "20px",
            padding: "36px 32px 28px",
            width: "400px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            fontFamily: FONT,
          }}
        >
          {/* Circle icon */}
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            border: `1.5px solid ${GREEN}`,
            backgroundColor: `rgba(22,143,102,0.07)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "16px",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          {/* Title */}
          <p style={{ margin: "0 0 6px", color: "var(--foreground)", fontFamily: FONT, fontWeight: 700, fontSize: "22px", textAlign: "center" }}>
            {t("community.joinRequestTitle")}
          </p>

          {/* Subtitle */}
          <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontFamily: FONT, fontWeight: 400, fontSize: "14px", textAlign: "center", lineHeight: 1.5 }}>
            {t("community.joinRequestMessage")}
          </p>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: "100%", height: "50px", borderRadius: "10px", border: "none",
              backgroundColor: GREEN, color: "#FFFFFF",
              fontFamily: FONT, fontWeight: 700, fontSize: "16px",
              cursor: "pointer", transition: "background 0.18s", marginTop: "6px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#117a57"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = GREEN; }}
          >
            {t("community.close")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
