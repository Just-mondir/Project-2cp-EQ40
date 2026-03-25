"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ bgColor = "#FFFFFF" }) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: bgColor,
                borderRadius: "9999px",
                border: "none",
                color: "#432817",
                fontFamily: "var(--font-lato), 'Lato', sans-serif",
                fontWeight: 600,
                fontSize: "16px",
                cursor: "pointer",
                padding: "8px 24px",
                boxShadow: "0 1px 4px rgba(67,40,23,0.10)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
            <span style={{ fontSize: "20px", display: "inline-block", transform: "translateY(-1px)" }}>←</span> Back
        </button>
    );
}