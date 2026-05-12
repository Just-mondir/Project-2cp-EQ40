"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/apiClient";
import { FEED_CACHE_TIME, FEED_STALE_TIME, PROFILE_STALE_TIME } from "@/lib/queryClient";

type ProfilePayload<TProfile> = {
  data?: TProfile;
};

function unwrap<TProfile>(payload: ProfilePayload<TProfile> | TProfile): TProfile {
  return (payload as ProfilePayload<TProfile>).data ?? (payload as TProfile);
}

export function useProfile<TProfile = unknown>(userIdOrUsername: string | undefined, isOwnProfile = false) {
  return useQuery({
    queryKey: ["user", isOwnProfile ? "me" : userIdOrUsername],
    queryFn: async () => {
      const endpoint = isOwnProfile ? "users/me/" : `users/${userIdOrUsername}/`;
      const payload = await fetchJson<ProfilePayload<TProfile> | TProfile>(endpoint);
      return unwrap(payload);
    },
    enabled: Boolean(userIdOrUsername),
    staleTime: PROFILE_STALE_TIME,
    gcTime: FEED_CACHE_TIME,
  });
}

export function useProfileTab<TPost = unknown>(
  username: string | undefined,
  tab: "grid" | "gems" | "saved" | "reposts" | "events" | "alerts",
  isOwnProfile: boolean,
  enabled: boolean,
) {
  const tabKey = isOwnProfile ? "own" : "public";
  const queryClient = useQueryClient();
  const queryKey = ["profile-posts", username, tab, tabKey] as const;
  return useQuery({
    queryKey,
    queryFn: () => fetchProfileTabPosts<TPost>(username, tab, isOwnProfile),
    enabled: Boolean(username) && enabled,
    initialData: () => queryClient.getQueryData<TPost[]>(queryKey),
    staleTime: FEED_STALE_TIME,
    gcTime: FEED_CACHE_TIME,
  });
}

export function profileTabQueryKey(
  username: string | undefined,
  tab: "grid" | "gems" | "saved" | "reposts" | "events" | "alerts",
  isOwnProfile: boolean,
) {
  return ["profile-posts", username, tab, isOwnProfile ? "own" : "public"] as const;
}

export async function fetchProfileTabPosts<TPost = unknown>(
  username: string | undefined,
  tab: "grid" | "gems" | "saved" | "reposts" | "events" | "alerts",
  isOwnProfile: boolean,
) {
  const endpoints = {
    grid: `posts/user/${username}/?page_size=10`,
    gems: "posts/gemed/?page_size=10",
    saved: "posts/saved/?page_size=10",
    reposts: isOwnProfile ? "posts/reposts/?page_size=10" : `posts/user/${username}/reposts/?page_size=10`,
    events: `posts/user/${username}/events/?page_size=10`,
    alerts: `posts/user/${username}/alerts/?page_size=10`,
  };
  const payload = await fetchJson<{
    data?: { results?: TPost[] } | TPost[];
    results?: TPost[];
  } | TPost[]>(endpoints[tab]);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return payload.data?.results ?? payload.results ?? [];
}
