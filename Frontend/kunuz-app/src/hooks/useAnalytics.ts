import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/apiClient";

type AnalyticsSnapshot = {
  date: string;
  members: number;
  groups: number;
  visitors: number;
  posts: number;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, unknown>;
};

type AnalyticsResult = {
  labels: string[];
  members: number[];
  groups: number[];
  visitors: number[];
  posts: number[];
  snapshots: AnalyticsSnapshot[];
  loading: boolean;
  error: string | null;
};

const EMPTY_SNAPSHOTS: AnalyticsSnapshot[] = [];
const ANALYTICS_CACHE_PREFIX = "kunuz.moderator.analytics";

function readCachedAnalytics(range: string): AnalyticsSnapshot[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(`${ANALYTICS_CACHE_PREFIX}.${range}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { snapshots?: AnalyticsSnapshot[] };
    return Array.isArray(parsed.snapshots) ? parsed.snapshots : undefined;
  } catch {
    return undefined;
  }
}

function writeCachedAnalytics(range: string, snapshots: AnalyticsSnapshot[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${ANALYTICS_CACHE_PREFIX}.${range}`, JSON.stringify({ snapshots, cachedAt: Date.now() }));
  } catch {
    // Cache is only a speed boost.
  }
}

function formatLabel(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export default function useAnalytics(range: "7d" | "30d" | "90d") {
  const query = useQuery({
    queryKey: ["moderator", "analytics", range],
    queryFn: async () => {
      const payload = await fetchJson<
        AnalyticsSnapshot[] | ApiEnvelope<AnalyticsSnapshot[]>
      >(`/api/moderator/analytics/?range=${encodeURIComponent(range)}`);

      if (Array.isArray(payload)) {
        writeCachedAnalytics(range, payload);
        return payload;
      }
      if (payload && typeof payload === "object" && Array.isArray(payload.data)) {
        writeCachedAnalytics(range, payload.data);
        return payload.data;
      }
      return [];
    },
    initialData: () => readCachedAnalytics(range),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const snapshots = query.data ?? EMPTY_SNAPSHOTS;

  const labels = useMemo(
    () => snapshots.map((snapshot) => formatLabel(snapshot.date)),
    [snapshots],
  );

  const members = useMemo(() => snapshots.map((snapshot) => snapshot.members), [snapshots]);
  const groups = useMemo(() => snapshots.map((snapshot) => snapshot.groups), [snapshots]);
  const visitors = useMemo(() => snapshots.map((snapshot) => snapshot.visitors), [snapshots]);
  const posts = useMemo(() => snapshots.map((snapshot) => snapshot.posts), [snapshots]);

  return {
    labels,
    members,
    groups,
    visitors,
    posts,
    snapshots,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  } as AnalyticsResult;
}
