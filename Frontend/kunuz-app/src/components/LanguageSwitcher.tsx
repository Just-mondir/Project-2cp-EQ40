"use client";

import { Check, Globe } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocaleSettings } from "@/components/LocaleProvider";
import { LOCALE_LABELS, type AppLocale } from "@/lib/i18n";

const LOCALE_OPTIONS = Object.entries(LOCALE_LABELS) as Array<[AppLocale, string]>;

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleSettings();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const activeLabel = useMemo(() => LOCALE_LABELS[locale], [locale]);

  return (
    <div
      ref={containerRef}
      className="relative"
      dir="ltr"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Change language"
        title={`Change language: ${activeLabel}`}
        onClick={() => setIsOpen((current) => !current)}
        className="theme-toggle theme-toggle--inline"
        style={{
          opacity: 1,
          boxShadow: "var(--theme-toggle-shadow)",
        }}
      >
        <span className="theme-toggle__glow" />
        <span className="theme-toggle__icon">
          <Globe size={18} strokeWidth={1.8} />
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full z-[120] mt-3 min-w-[190px] overflow-hidden rounded-2xl border py-2 shadow-[0_18px_40px_rgba(44,26,14,0.16)]"
          style={{
            backgroundColor: "var(--panel-bg)",
            borderColor: "var(--border-soft)",
            color: "var(--foreground)",
            insetInlineEnd: 0,
          }}
          role="menu"
        >
          {LOCALE_OPTIONS.map(([optionLocale, label]) => {
            const isActive = optionLocale === locale;

            return (
              <button
                key={optionLocale}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setLocale(optionLocale);
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: isActive ? "rgba(67, 40, 23, 0.08)" : "transparent",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-lato), sans-serif",
                }}
              >
                <span dir="auto">{label}</span>
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isActive ? "rgba(67, 40, 23, 0.12)" : "transparent",
                    color: "var(--foreground)",
                  }}
                >
                  {isActive ? <Check size={14} strokeWidth={2} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
