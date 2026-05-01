"use client";

import { useEffect, useRef, useState } from "react";

type DaltonismMode = "off" | "deuteranopia" | "protanopia" | "tritanopia";
type DaltonismFilterMode = Exclude<DaltonismMode, "off">;

const STORAGE_KEY = "daltonism-mode";
const LAST_FILTER_KEY = "daltonism-last-mode";
const DEFAULT_FILTER_MODE: DaltonismFilterMode = "deuteranopia";
const FILTER_MODES: DaltonismFilterMode[] = ["deuteranopia", "protanopia", "tritanopia"];

const MODE_LABELS: Record<DaltonismMode, string> = {
  off: "Off",
  deuteranopia: "Deuteranopia (green-blind)",
  protanopia: "Protanopia (red-blind)",
  tritanopia: "Tritanopia (blue-blind)",
};

function normalizeMode(value: string | null): DaltonismMode {
  if (value === "deuteranopia" || value === "protanopia" || value === "tritanopia") return value;
  return "off";
}

function normalizeFilterMode(value: string | null): DaltonismFilterMode {
  const mode = normalizeMode(value);
  return mode === "off" ? DEFAULT_FILTER_MODE : mode;
}

function applyDaltonismMode(mode: DaltonismMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  FILTER_MODES.forEach(filterMode => root.classList.remove(`daltonism-${filterMode}`));
  if (mode !== "off") {
    root.classList.add(`daltonism-${mode}`);
  }
}

function AccessibilityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 9v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m8 20 4-8 4 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DaltonismToggle() {
  const [mode, setMode] = useState<DaltonismMode>("off");
  const [lastFilterMode, setLastFilterMode] = useState<DaltonismFilterMode>(DEFAULT_FILTER_MODE);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedMode = normalizeMode(window.localStorage.getItem(STORAGE_KEY));
    const storedLastFilterMode = normalizeFilterMode(window.localStorage.getItem(LAST_FILTER_KEY) || (storedMode === "off" ? null : storedMode));
    setMode(storedMode);
    setLastFilterMode(storedLastFilterMode);
    applyDaltonismMode(storedMode);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const setAndStoreMode = (nextMode: DaltonismMode) => {
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    if (nextMode !== "off") {
      setLastFilterMode(nextMode);
      window.localStorage.setItem(LAST_FILTER_KEY, nextMode);
    }
    applyDaltonismMode(nextMode);
  };

  const toggleEnabled = () => {
    setAndStoreMode(mode === "off" ? lastFilterMode : "off");
  };

  const isEnabled = mode !== "off";
  const selectedFilterMode = isEnabled ? mode : lastFilterMode;
  const label = isEnabled
    ? `Disable color blindness mode. Current filter: ${MODE_LABELS[mode]}.`
    : `Enable color blindness mode. Last filter: ${MODE_LABELS[lastFilterMode]}.`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        className={`theme-toggle theme-toggle--inline daltonism-toggle${isEnabled ? " daltonism-toggle--active" : ""}`}
        onClick={() => setOpen(value => !value)}
      >
        <span className="theme-toggle__glow" />
        <span className="theme-toggle__icon">
          <AccessibilityIcon />
        </span>
      </button>

      {open && (
        <div
          className="daltonism-toggle__panel"
          role="dialog"
          aria-label="Color blindness accessibility settings"
        >
          <button
            type="button"
            className="daltonism-toggle__switch"
            onClick={toggleEnabled}
            aria-label={isEnabled ? "Disable color blindness mode" : "Enable color blindness mode"}
          >
            <span>{isEnabled ? "Daltonism on" : "Daltonism off"}</span>
            <span className={`daltonism-toggle__track${isEnabled ? " daltonism-toggle__track--active" : ""}`}>
              <span className="daltonism-toggle__thumb" />
            </span>
          </button>

          <div className="daltonism-toggle__tabs" role="tablist" aria-label="Color blindness filter type">
            {FILTER_MODES.map(filterMode => (
              <button
                key={filterMode}
                type="button"
                role="tab"
                aria-selected={selectedFilterMode === filterMode}
                className={`daltonism-toggle__tab${selectedFilterMode === filterMode ? " daltonism-toggle__tab--active" : ""}`}
                onClick={() => setAndStoreMode(filterMode)}
              >
                {MODE_LABELS[filterMode]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
