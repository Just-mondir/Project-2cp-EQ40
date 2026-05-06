import { useEffect, useMemo, useState } from "react";
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
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSnapshots() {
      setLoading(true);
      setError(null);

      try {
        const payload = await fetchJson<
        AnalyticsSnapshot[] | ApiEnvelope<AnalyticsSnapshot[]>
      >(`/api/moderator/analytics/?range=${encodeURIComponent(range)}`);

      if (!cancelled) {
        if (Array.isArray(payload)) {
          setSnapshots(payload);
        } else if (payload && typeof payload === "object" && Array.isArray(payload.data)) {
          setSnapshots(payload.data);
        } else {
          setSnapshots([]);
        }
      }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analytics data.");
          setSnapshots([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchSnapshots();

    return () => {
      cancelled = true;
    };
  }, [range]);

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
    loading,
    error,
  } as AnalyticsResult;
}
