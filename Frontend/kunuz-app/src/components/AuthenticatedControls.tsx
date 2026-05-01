"use client";

import { usePathname } from "next/navigation";
import DaltonismToggle from "@/components/DaltonismToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { normalizeThemePathname } from "@/lib/themeRoutes";

export default function AuthenticatedControls() {
  const pathname = usePathname();
  const normalizedPathname = normalizeThemePathname(pathname || "/");
  const shouldShowThemeControls =
    normalizedPathname === "/home-page" || normalizedPathname === "/home";

  if (!shouldShowThemeControls) {
    return null;
  }

  return (
    <div
      className="fixed top-[18px] z-[110] flex items-center gap-3"
      style={{ insetInlineEnd: "18px" }}
    >
      {shouldShowThemeControls && <LanguageSwitcher />}
      <DaltonismToggle />
      {shouldShowThemeControls && (
        <ThemeToggle
          forceVisible
          variant="inline"
          backgroundColor="linear-gradient(135deg, var(--surface-strong), var(--surface))"
          hoverBackgroundColor="linear-gradient(135deg, var(--surface-strong), var(--surface))"
          shadow="var(--theme-toggle-shadow)"
        />
      )}
    </div>
  );
}
