"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BackButton({ bgColor = "#FFFFFF" }) {
    const router = useRouter();
    const t = useTranslations("auth.common");

    return (
        <button
            onClick={() => router.back()}
            aria-label={t("back")}
            className="text-sm md:text-base px-4 py-1.5 md:px-6 md:py-2"
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
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(67,40,23,0.10)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
            <span style={{ fontSize: "20px", display: "inline-block", transform: "translateY(-1px)" }}>←</span> {t("back")}
        </button>
    );
}
