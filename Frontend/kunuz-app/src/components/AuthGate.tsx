"use client";

import { useEffect, useMemo } from "react";
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

  const token = typeof window === "undefined" ? "" : localStorage.getItem("accessToken") || "";
  const isAuthenticated = Boolean(token);

  const isPublicRoute = useMemo(() => {
    if (!pathname) return true;
    return PUBLIC_PATHS.has(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isPublicRoute, router]);

  if (!isPublicRoute && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
