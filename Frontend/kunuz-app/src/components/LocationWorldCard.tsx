"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type LocationWorldCardProps = {
  location?: string;
  region?: string;
  textClassName?: string;
  textStyle?: CSSProperties;
  iconColor?: string;
  iconSize?: number;
  buttonClassName?: string;
  buttonStyle?: CSSProperties;
};

const LOCATION_TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    Algeria: "Algérie",
    "southeastern Algeria": "sud-est de l'Algérie",
    "southern Algeria": "sud de l'Algérie",
    "northern Algeria": "nord de l'Algérie",
    "eastern Algeria": "est de l'Algérie",
    "western Algeria": "ouest de l'Algérie",
    "central Algeria": "centre de l'Algérie",
    "Illizi Province": "wilaya d'Illizi",
    Province: "wilaya",
  },
  ar: {
    Algeria: "الجزائر",
    Djanet: "جانيت",
    Illizi: "إليزي",
    "southeastern Algeria": "جنوب شرق الجزائر",
    "southern Algeria": "جنوب الجزائر",
    "northern Algeria": "شمال الجزائر",
    "eastern Algeria": "شرق الجزائر",
    "western Algeria": "غرب الجزائر",
    "central Algeria": "وسط الجزائر",
    "Illizi Province": "ولاية إليزي",
    Province: "ولاية",
  },
};

export function localizeLocationLabel(value: string, locale: string) {
  const translations = LOCATION_TRANSLATIONS[locale];
  if (!translations) return value;

  return Object.entries(translations).sort(([a], [b]) => b.length - a.length).reduce((label, [source, translated]) => {
    return label.replace(new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), translated);
  }, value);
}

export default function LocationWorldCard({
  location,
  region,
  textClassName = "text-xs",
  textStyle,
  iconColor = "#8B7355",
  iconSize = 14,
  buttonClassName = "",
  buttonStyle,
}: LocationWorldCardProps) {
  const t = useTranslations("auth.locationCard");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const label = (location || region || t("defaultLocation")).trim();
  const displayLabel = localizeLocationLabel(label, locale);

  const mapUrl = useMemo(
    () => `https://maps.google.com/maps?q=${encodeURIComponent(label)}&z=6&output=embed`,
    [label],
  );

  const mapsLink = useMemo(
    () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`,
    [label],
  );

  return (
    <>
      <button
        type="button"
        className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${buttonClassName}`}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          ...buttonStyle,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className={textClassName} style={textStyle}>
          {displayLabel}
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center px-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/45" />
          <div
            className="relative w-full max-w-[720px] overflow-hidden rounded-[28px] shadow-2xl"
            style={{ backgroundColor: "#FFF8E2", border: "1px solid rgba(67,40,23,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(67,40,23,0.12)" }}
            >
              <div>
                <p
                  className="text-[11px] font-black uppercase tracking-wider"
                  style={{ color: "#8B7355" }}
                >
                  {t("title")}
                </p>
                <h3 className="text-xl font-bold mt-1" style={{ color: "#432817" }}>
                  {displayLabel}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 transition-colors hover:bg-[#EADFC9]"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#432817"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div
                className="overflow-hidden rounded-[22px]"
                style={{ border: "1px solid rgba(67,40,23,0.12)", backgroundColor: "#F5EFE0" }}
              >
                <iframe
                  src={mapUrl}
                  title={t("mapTitle", { location: displayLabel })}
                  className="h-[360px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm" style={{ color: "#6B5A47" }}>
                  {t("description")}
                </p>
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: "#432817", color: "#FFF8E2" }}
                >
                  {t("openMap")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
