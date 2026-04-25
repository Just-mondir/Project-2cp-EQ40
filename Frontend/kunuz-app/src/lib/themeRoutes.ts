export const PUBLIC_ROUTE_LIST = [
  "/",
  "/landingpage",
  "/login",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  "/Moderator-page",
] as const;

export const LIGHT_ONLY_PLATFORM_ROUTE_LIST = [] as const;

export const PUBLIC_ROUTES = new Set<string>(PUBLIC_ROUTE_LIST);
export const LIGHT_ONLY_PLATFORM_ROUTES = new Set<string>(LIGHT_ONLY_PLATFORM_ROUTE_LIST);

export function normalizeThemePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

export function isDarkThemeRoute(pathname: string) {
  const normalizedPathname = normalizeThemePathname(pathname);
  return (
    !PUBLIC_ROUTES.has(normalizedPathname) &&
    !LIGHT_ONLY_PLATFORM_ROUTES.has(normalizedPathname)
  );
}
