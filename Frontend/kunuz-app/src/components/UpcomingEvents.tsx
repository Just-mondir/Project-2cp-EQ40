"use client";

import { useMemo } from "react";
import { Lato } from "next/font/google";
import { useQuery } from "@tanstack/react-query";
import { fetchUpcomingEventsWithFallback, upcomingEventsQueryKey } from "@/lib/upcomingEvents";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 2v4M16 2v4" />
      <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2M15 17h2" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

type EventItem = {
  title: string;
  description: string;
  location: string;
  date: string;
  imageUrl: string;
};

type EventApiPost = {
  content?: string;
  event_details?: {
    starts_at?: string;
  };
  images?: Array<{ image?: string }>;
  location?: string;
  region?: string;
  title?: string;
};

const fallbackEvents: EventItem[] = [
  {
    title: "Casbah Restoration Workshop",
    description: "Volunteers learn basic preservation techniques",
    location: "Casbah, Algiers",
    date: "20/04/2026",
    imageUrl: "/e872c9fc6c332498e59e855e78490c56 1.jpg",
  },
  {
    title: "Stone Cleaning Training",
    description: "Students practice safe restoration methods on sites",
    location: "Tlemcen",
    date: "27/05/2026",
    imageUrl: "/e108c4a81ca8f617b8f5c16cfc0e2e7f 1.jpg",
  },
  {
    title: "Stone Cleaning Training",
    description: "Students practice safe restoration methods on sites",
    location: "Tlemcen",
    date: "27/05/2026",
    imageUrl: "/e108c4a81ca8f617b8f5c16cfc0e2e7f 1.jpg",
  },
  {
    title: "Casbah Restoration Workshop",
    description: "Volunteers learn basic preservation techniques",
    location: "Casbah, Algiers",
    date: "20/04/2026",
    imageUrl: "/e872c9fc6c332498e59e855e78490c56 1.jpg",
  },
  {
    title: "Casbah Restoration Workshop",
    description: "Volunteers learn basic preservation techniques",
    location: "Casbah, Algiers",
    date: "20/04/2026",
    imageUrl: "/e872c9fc6c332498e59e855e78490c56 1.jpg",
  },
  {
    title: "Stone Cleaning Training",
    description: "Students practice safe restoration methods on sites",
    location: "Tlemcen",
    date: "27/05/2026",
    imageUrl: "/e108c4a81ca8f617b8f5c16cfc0e2e7f 1.jpg",
  },
];

function EventCard({ item }: { item: EventItem }) {
  const hasImage = !!item.imageUrl;

  return (
    <div
      className="rounded-2xl h-[110px] sm:h-[130px] md:h-[140px] lg:h-[150px] flex flex-row items-stretch overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(44,26,14,0.14)]"
      style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-soft)" }}
    >
      {hasImage && (
        <div className="relative h-full shrink-0 w-[100px] sm:w-[140px] md:w-[160px] lg:w-[200px]">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover rounded-l-2xl"
          />
        </div>
      )}

      <div
        className={`${lato.className} flex-1 px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 flex flex-col justify-between`}
        style={!hasImage ? { borderLeft: "4px solid var(--border-soft)" } : undefined}
      >
        <div>
          <h3 className="font-bold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 line-clamp-1" style={{ color: "var(--foreground)" }}>
            {item.title}
          </h3>
          <p
            className="font-normal text-xs sm:text-xs md:text-sm leading-relaxed overflow-hidden hidden sm:block"
            style={{
              color: "var(--text-soft)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.description}
          </p>
        </div>

        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2 sm:gap-3 md:gap-4 min-w-0" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1 text-xs sm:text-xs md:text-sm line-clamp-1 whitespace-nowrap">
              <PinIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{item.location}</span>
            </span>
            <span className="flex items-center gap-1 text-xs sm:text-xs md:text-sm whitespace-nowrap">
              <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              {item.date}
            </span>
          </div>
          <CalendarIcon className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 text-[var(--foreground)] flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

function mapEventPost(post: EventApiPost): EventItem {
  const stripHtml = (html = "") => html.replace(/<[^>]*>/g, "");
  const imgPath = post.images?.[0]?.image ?? "";
  const imageUrl = imgPath
    ? imgPath.startsWith("http")
      ? imgPath
      : `${process.env.NEXT_PUBLIC_API_URL}${imgPath}`
    : "";

  return {
    title: stripHtml(post.title),
    description: stripHtml(post.content ?? ""),
    location: post.location || post.region || "Algeria",
    date: post.event_details?.starts_at
      ? new Date(post.event_details.starts_at).toLocaleDateString("fr-FR")
      : "TBD",
    imageUrl,
  };
}

export default function UpcomingEvents() {
  const eventsQuery = useQuery({
    queryKey: upcomingEventsQueryKey,
    queryFn: () => fetchUpcomingEventsWithFallback<EventApiPost>(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const events = useMemo(() => {
    const fetched = (eventsQuery.data ?? []).slice(0, 6).map(mapEventPost);
    return fetched.length > 0 ? fetched : fallbackEvents;
  }, [eventsQuery.data]);

  return (
    <section
      id="events"
      className="w-full py-12 sm:py-16 md:py-24 lg:py-28 xl:py-32 px-4 sm:px-6 md:px-8 lg:px-24 xl:px-32 scroll-mt-24"
      style={{ backgroundColor: "var(--background)", minHeight: "auto" }}
    >
      <h2
        className="font-bold text-[clamp(24px,6vw,44px)] text-center mb-8 sm:mb-10 md:mb-14 lg:mb-20"
        style={{ fontFamily: "var(--font-lato), system-ui, sans-serif", color: "var(--foreground)" }}
      >
        Upcoming Events
      </h2>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
        {events.map((item, idx) => (
          <EventCard key={`${item.title}-${idx}`} item={item} />
        ))}
      </div>
    </section>
  );
}
