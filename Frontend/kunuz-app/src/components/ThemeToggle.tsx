"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type ThemeMode = "light" | "dark";

const HIDDEN_ROUTES = new Set(["/", "/landingpage"]);

function SunIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="18" y1="1" x2="18" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="29" x2="18" y2="35" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="1" y1="18" x2="7" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="29" y1="18" x2="35" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6" y1="6" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="26" y1="26" x2="30" y2="30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="30" y1="6" x2="26" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10" y1="26" x2="6" y2="30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M27 19.5A11 11 0 0 1 16.5 9a11 11 0 0 0 0 18 11 11 0 0 0 10.5-7.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <line x1="28" y1="9" x2="30" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="30" y1="13" x2="33" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme =
      typeof window !== "undefined"
        ? (window.localStorage.getItem("theme-mode") as ThemeMode | null)
        : null;
    const nextTheme = storedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setMounted(true);
  }, []);

  if (HIDDEN_ROUTES.has(pathname)) {
    return null;
  }

  const handleToggle = () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme-mode", nextTheme);
    }
    applyTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={theme === "light" ? "Activate dark mode" : "Activate light mode"}
      title={theme === "light" ? "Activate dark mode" : "Activate light mode"}
      className="theme-toggle"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      <span className="theme-toggle__glow" />
      <span className="theme-toggle__icon">
        {theme === "light" ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
