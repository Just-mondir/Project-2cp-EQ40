"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthenticatedControls from "@/components/AuthenticatedControls";
import LocaleProvider from "@/components/LocaleProvider";

const PUBLIC_PATHS = new Set([
  "/",
  "/landingpage",
  "/login",
  "/sign-up",
  "/signup",
  "/verify-email",
  "/forgot-password",
]);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
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

  // Hide protected content during initial SSR and hydration to prevent flash
  if (!mounted && !isPublicRoute) {
    return <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }} />;
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }} />;
  }

  return (
    <LocaleProvider>
      <div className="authenticated-app-shell">
        <AuthenticatedControls />
        {children}
      </div>
    </LocaleProvider>
  );
}
