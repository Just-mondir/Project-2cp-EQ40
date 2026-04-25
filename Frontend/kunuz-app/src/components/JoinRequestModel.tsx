"use client";

const FONT = "var(--font-lato), 'Lato', sans-serif";
const GREEN = "#168F66";

interface JoinRequestSentModalProps {
  onClose: () => void;
}

export default function JoinRequestSentModal({ onClose }: JoinRequestSentModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div
        className="fixed inset-0 z-[201] flex items-center justify-center"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 490,
            backgroundColor: "#F7F5EF",
            borderRadius: 10,
            overflow: "hidden",           // clips the green top bar to rounded corners
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: FONT,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          {/* ── Green top bar (Frame 4045, height 10) ── */}
          <div style={{ width: "100%", height: 10, backgroundColor: GREEN, flexShrink: 0 }} />

          {/* ── Content with padding ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 29,
              paddingTop: 29,
              paddingBottom: 30,
              width: "100%",
            }}
          >
            {/* ── Green checkmark icon ── */}
            <svg
              width="87.5"
              height="85"
              viewBox="0 0 88 86"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="44" cy="43" r="40" stroke={GREEN} strokeWidth="5" fill="none" />
              <path
                d="M24 43 L38 57 L64 30"
                stroke={GREEN}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>

            {/* ── Text content ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <p
                style={{
                  margin: 0,
                  color: "#000000",
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 26,
                  lineHeight: "32px",
                  textAlign: "center",
                }}
              >
                Join request sent
              </p>
              <p
                style={{
                  margin: 0,
                  width: 248,
                  color: "#000000",
                  fontFamily: FONT,
                  fontWeight: 400,
                  fontSize: 20,
                  textAlign: "center",
                  lineHeight: "1.5",
                  marginTop: 8,
                }}
              >
                Thank you!<br />Waiting for admin approval.
              </p>
            </div>

            {/* ── Cancel button ── */}
            <button
              onClick={onClose}
              style={{
                backgroundColor: GREEN,
                border: "none",
                borderRadius: 10,
                padding: "10px 48px",
                color: "#FFFFFF",
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 20,
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
