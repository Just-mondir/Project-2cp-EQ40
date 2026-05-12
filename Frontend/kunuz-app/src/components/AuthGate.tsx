"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthenticatedControls from "@/components/AuthenticatedControls";
import MobileEdgeTabs from "@/components/MobileEdgeTabs";

const PUBLIC_PATHS = new Set([
  "/",
  "/landingpage",
  "/login",
  "/sign-up",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/about",
  "/guidelines",
  "/legal",
]);

const DALTONISM_MODES = ["deuteranopia", "protanopia", "tritanopia"] as const;

function applyDaltonismForRoute() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const modes = ["deuteranopia", "protanopia", "tritanopia"];

  modes.forEach(mode => {
    root.classList.remove(`daltonism-${mode}`);
  });

  const storedMode = localStorage.getItem("daltonism-mode");
  if (storedMode && modes.includes(storedMode)) {
    root.classList.add(`daltonism-${storedMode}`);
  }
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );

  const token = mounted ? localStorage.getItem("accessToken") || "" : "";
  const isAuthenticated = Boolean(token);

  const isPublicRoute = useMemo(() => {
    if (!pathname) return true;
    return PUBLIC_PATHS.has(pathname);
  }, [pathname]);

  useEffect(() => {
    if (mounted && !isAuthenticated && !isPublicRoute) {
      router.replace("/");
    }
  }, [mounted, isAuthenticated, isPublicRoute, router]);

  useEffect(() => {
    if (!mounted) return;
    applyDaltonismForRoute();

    const handleUpdate = () => applyDaltonismForRoute();
    window.addEventListener("daltonism-updated", handleUpdate);
    return () => window.removeEventListener("daltonism-updated", handleUpdate);
  }, [mounted, isPublicRoute, pathname]);

  // Hide protected content during initial SSR and hydration to prevent flash
  if (!mounted && !isPublicRoute) {
    return <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }} />;
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return (
      <div className="authenticated-app-shell">
        <AuthenticatedControls />
        <MobileEdgeTabs />
        {children}
      </div>
    );
  }

  return <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }} />;
}
