"use client";

import { usePathname } from "next/navigation";
import DaltonismToggle from "@/components/DaltonismToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { normalizeThemePathname } from "@/lib/themeRoutes";

export default function AuthenticatedControls() {
  const pathname = usePathname();
  const normalizedPathname = normalizeThemePathname(pathname || "/");
  const isHomePage =
    normalizedPathname === "/home-page" || normalizedPathname === "/home";

  // Only show the three toggle buttons on the home page (desktop)
  if (!isHomePage) return null;

  return (
    <div
      className="hidden md:flex fixed top-[18px] z-[110] items-center gap-3"
      style={{ insetInlineEnd: "18px" }}
    >
      <LanguageSwitcher />
      <DaltonismToggle />
      <ThemeToggle
        forceVisible
        variant="inline"
        backgroundColor="linear-gradient(135deg, var(--surface-strong), var(--surface))"
        hoverBackgroundColor="linear-gradient(135deg, var(--surface-strong), var(--surface))"
        shadow="none"
      />
    </div>
  );
}
