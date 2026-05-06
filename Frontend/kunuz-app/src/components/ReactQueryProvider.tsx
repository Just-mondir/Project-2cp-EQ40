"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createKunuzQueryClient } from "@/lib/queryClient";
import { API_BASE_URL, fetchJson } from "@/lib/apiClient";
import { fetchPostsPage, type PagePayload } from "@/hooks/usePosts";
import { fetchProfileTabPosts, profileTabQueryKey } from "@/hooks/useProfile";
import { fetchUpcomingEventsWithFallback, upcomingEventsQueryKey } from "@/lib/upcomingEvents";

type ApiDataEnvelope<T> = { data?: T };
type ListEnvelope<T> = {
  data?: { results?: T[] } | T[];
  results?: T[];
};

function unwrapData<T>(payload: ApiDataEnvelope<T> | T): T {
  return (payload as ApiDataEnvelope<T>).data ?? (payload as T);
}

function unwrapList<T>(payload: ListEnvelope<T> | T[] | null | undefined): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return payload.data?.results ?? payload.results ?? [];
}

async function prefetchOwnProfilePosts(queryClient: ReturnType<typeof createKunuzQueryClient>, username: string) {
  if (!username) return;
  const tabs = ["grid", "gems", "saved", "reposts", "events", "alerts"] as const;
  await Promise.all(tabs.map((tab) =>
    queryClient.prefetchQuery({
      queryKey: profileTabQueryKey(username, tab, true),
      queryFn: () => fetchProfileTabPosts(username, tab, true),
      staleTime: 5 * 60 * 1000,
    })
  ));
}

async function prefetchFeedPages(
  queryClient: ReturnType<typeof createKunuzQueryClient>,
  section: string,
  initialUrl: string,
  pageCount = 3,
) {
  const pages: PagePayload<unknown>[] = [];
  const pageParams: string[] = [];
  let nextUrl: string | undefined = initialUrl;

  for (let index = 0; index < pageCount && nextUrl; index += 1) {
    const currentUrl = nextUrl;
    const page: PagePayload<unknown> = await fetchPostsPage(currentUrl);
    pages.push(page);
    pageParams.push(currentUrl);
    queryClient.setQueryData(["posts", section, 10], {
      pages: [...pages],
      pageParams: [...pageParams],
    });
    nextUrl = page.next || undefined;
  }
}

function getCachedUsername(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("authUser") || localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    return user?.username ?? localStorage.getItem("username") ?? localStorage.getItem("user_username") ?? "";
  } catch {
    return localStorage.getItem("username") ?? localStorage.getItem("user_username") ?? "";
  }
}

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createKunuzQueryClient());

  useEffect(() => {
    // Only prefetch if we have a token to avoid 401 flood/redirect loop
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;

    const runPrefetches = () => {
      queryClient.prefetchQuery({
        queryKey: ["user", "me"],
        queryFn: async () => {
          const user = unwrapData<{ username?: string }>(await fetchJson("/users/me/"));
          if (user?.username) {
            prefetchOwnProfilePosts(queryClient, user.username).catch(() => undefined);
          }
          return user;
        },
        staleTime: 60 * 1000,
      }).catch(() => undefined);

      const username = getCachedUsername();
      if (username) {
        prefetchOwnProfilePosts(queryClient, username).catch(() => undefined);
      }

      [
        ["home", `${API_BASE_URL}/posts/?page_size=10`, 3],
        ["events", `${API_BASE_URL}/posts/events/filter/?page_size=10`, 3],
        ["monuments", `${API_BASE_URL}/posts/monuments-danger/?page_size=10`, 3],
        ["groups", `${API_BASE_URL}/groups/posts/?page_size=10`, 3],
        ["questions", `${API_BASE_URL}/posts/?post_type=question&page_size=10`, 2],
      ].forEach(([section, url, pageCount]) => {
        prefetchFeedPages(
          queryClient,
          String(section),
          String(url),
          Number(pageCount),
        ).catch(() => undefined);
      });

      queryClient.prefetchQuery({
        queryKey: upcomingEventsQueryKey,
        queryFn: fetchUpcomingEventsWithFallback,
        staleTime: 5 * 60 * 1000,
      }).catch(() => undefined);

      queryClient.prefetchQuery({
        queryKey: ["groups", "popular"],
        queryFn: async () => unwrapList(await fetchJson<ListEnvelope<unknown> | unknown[]>("/groups/popular/")),
        staleTime: 5 * 60 * 1000,
      }).catch(() => undefined);

      queryClient.prefetchQuery({
        queryKey: ["posts", "critical-alerts"],
        queryFn: async () => {
          const page = await fetchPostsPage(`${API_BASE_URL}/posts/critical/?page_size=10`);
          return page.results;
        },
        staleTime: 5 * 60 * 1000,
      }).catch(() => undefined);

      queryClient.prefetchQuery({
        queryKey: ["moderator", "stats"],
        queryFn: async () => {
          const [statsPayload, groupsPayload] = await Promise.all([
            fetchJson<{ data?: { members?: number; visitors?: number; posts?: number }; members?: number; visitors?: number; posts?: number }>("/moderator/stats/"),
            fetchJson<{ data?: { count?: number }; count?: number }>("/groups/?page=1&page_size=1"),
          ]);
          const platformStats = statsPayload.data ?? statsPayload;
          const groupStats = groupsPayload.data ?? groupsPayload;
          const stats = {
            members: platformStats.members ?? 0,
            groups: groupStats.count ?? 0,
            visitors: platformStats.visitors ?? 0,
            posts: platformStats.posts ?? 0,
          };
          localStorage.setItem("kunuz.moderator.stats.v1", JSON.stringify({ ...stats, cachedAt: Date.now() }));
          return stats;
        },
        staleTime: 2 * 60 * 1000,
      }).catch(() => undefined);

      queryClient.prefetchQuery({
        queryKey: ["moderator", "analytics", "30d"],
        queryFn: async () => {
          const payload = await fetchJson<{ data?: unknown[] } | unknown[]>("/moderator/analytics/?range=30d");
          const snapshots = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
          localStorage.setItem("kunuz.moderator.analytics.30d", JSON.stringify({ snapshots, cachedAt: Date.now() }));
          return snapshots;
        },
        staleTime: 2 * 60 * 1000,
      }).catch(() => undefined);
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(runPrefetches, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = globalThis.setTimeout(runPrefetches, 1200);
    return () => globalThis.clearTimeout(timer);
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
