"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS = new Set([
  "/",
  "/landingpage",
  "/login",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
]);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
    return <div style={{ minHeight: "100vh", backgroundColor: "#FFF8E2" }} />;
  }

  return <>{children}</>;
}
