import { fetchJson } from "@/lib/apiClient";

export const upcomingEventsQueryKey = ["events", "upcoming", "v4"] as const;

type ListEnvelope<T> = {
  data?: { results?: T[] } | T[];
  results?: T[];
};

function unwrapList<T>(payload: ListEnvelope<T> | T[] | null | undefined): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return payload.data?.results ?? payload.results ?? [];
}

export async function fetchUpcomingEventsWithFallback<TEvent = unknown>() {
  const endpoints = [
    "posts/upcoming-events/?page_size=6",
    "posts/events/filter/?status=upcoming&page_size=6",
    "posts/events/?page_size=6",
    "posts/?post_type=event&page_size=6",
    "posts/events/filter/?page_size=6",
  ];

  for (const endpoint of endpoints) {
    try {
      const events = unwrapList(await fetchJson<ListEnvelope<TEvent> | TEvent[]>(endpoint));
      if (events.length > 0) return events;
    } catch {
      // Try the next compatible backend endpoint.
    }
  }

  return [];
}
