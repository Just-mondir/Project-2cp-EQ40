"use client";

import { QueryClient } from "@tanstack/react-query";

export const FEED_STALE_TIME = 5 * 60 * 1000;
export const FEED_CACHE_TIME = 10 * 60 * 1000;
export const PROFILE_STALE_TIME = 60 * 1000;

export function createKunuzQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FEED_STALE_TIME,
        gcTime: FEED_CACHE_TIME,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

