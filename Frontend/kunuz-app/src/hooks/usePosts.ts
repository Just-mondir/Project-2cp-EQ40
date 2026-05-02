"use client";

import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson, resolveApiUrl } from "@/lib/apiClient";
import { FEED_CACHE_TIME, FEED_STALE_TIME } from "@/lib/queryClient";

export type PostSection = "home" | "events" | "monuments" | "groups" | "questions";

export type PagePayload<TPost> = {
  results: TPost[];
  next: string | null;
  count?: number;
};

type ApiEnvelope<TPost> = {
  data?: PagePayload<TPost> | TPost[];
  results?: TPost[];
  next?: string | null;
  count?: number;
};

const SECTION_ENDPOINTS: Record<PostSection, string> = {
  home: "/posts/",
  events: "/posts/events/filter/",
  monuments: "/posts/?post_type=alert",
  groups: "/groups/posts/",
  questions: "/posts/?post_type=question",
};

function withPageSize(endpoint: string, pageSize: number) {
  const url = new URL(resolveApiUrl(endpoint));
  url.searchParams.set("page_size", String(pageSize));
  return url.toString();
}

export function unwrapPostsPage<TPost>(payload: ApiEnvelope<TPost> | PagePayload<TPost> | TPost[]): PagePayload<TPost> {
  if (Array.isArray(payload)) return { results: payload, next: null };
  const data = "data" in payload ? payload.data : undefined;
  if (Array.isArray(data)) return { results: data, next: null, count: payload.count };
  if (data && "results" in data) return data;
  if ("results" in payload && Array.isArray(payload.results)) {
    return {
      results: payload.results,
      next: typeof payload.next === "string" ? payload.next : null,
      count: payload.count,
    };
  }
  return { results: [], next: null };
}

export async function fetchPostsPage<TPost = unknown>(url: string) {
  const payload = await fetchJson<ApiEnvelope<TPost> | PagePayload<TPost> | TPost[]>(url);
  return unwrapPostsPage(payload);
}

export function usePosts<TPost = unknown>(
  section: PostSection,
  options: {
    enabled?: boolean;
    pageSize?: number;
    extraKey?: unknown[];
    endpoint?: string;
    initialPage?: PagePayload<TPost>;
    prefetchNextPage?: boolean;
    prefetchPages?: number;
  } = {},
) {
  const pageSize = options.pageSize ?? 10;
  const initialUrl = useMemo(
    () => withPageSize(options.endpoint ?? SECTION_ENDPOINTS[section], pageSize),
    [options.endpoint, pageSize, section],
  );

  const query = useInfiniteQuery({
    queryKey: ["posts", section, pageSize, ...(options.extraKey ?? [])],
    queryFn: ({ pageParam }) => fetchPostsPage<TPost>(pageParam),
    initialPageParam: initialUrl,
    getNextPageParam: (lastPage) => lastPage.next || undefined,
    initialData: options.initialPage
      ? {
        pages: [options.initialPage],
        pageParams: [initialUrl],
      }
      : undefined,
    enabled: options.enabled ?? true,
    staleTime: FEED_STALE_TIME,
    gcTime: FEED_CACHE_TIME,
  });

  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => page.results) ?? [],
    [query.data],
  );

  const pageCount = query.data?.pages.length ?? 0;
  const { fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = query;
  const targetPrefetchPages = options.prefetchPages ?? (options.prefetchNextPage ? 2 : 1);

  useEffect(() => {
    if (!options.prefetchNextPage && !options.prefetchPages) return;
    if (!hasNextPage || isFetchingNextPage || isFetching) return;
    if (pageCount <= 0 || pageCount >= targetPrefetchPages) return;
    fetchNextPage().catch(() => undefined);
  }, [
    options.prefetchNextPage,
    options.prefetchPages,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    pageCount,
    targetPrefetchPages,
    fetchNextPage,
  ]);

  return {
    ...query,
    posts,
    isInitialLoading: query.isLoading && posts.length === 0,
    isLoadingMore: query.isFetchingNextPage,
  };
}
