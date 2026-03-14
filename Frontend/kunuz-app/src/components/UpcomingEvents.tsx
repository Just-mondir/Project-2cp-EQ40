"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Lato } from "next/font/google";

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

const fallbackEvents: EventItem[] = [
  {
    title: "Casbah Restoration Workshop",
    description: "Volunteers learn basic preservation techniques",
    location: "Casbah, Algiers",
    date: "20/04/2026",
    imageUrl: "/e872c9fc6c332498e59e855e78490c56%201.jpg",
  },
  {
    title: "Stone Cleaning Training",
    description: "Students practice safe restoration methods on sites",
    location: "Tlemcen",
    date: "27/05/2026",
    imageUrl: "/e108c4a81ca8f617b8f5c16cfc0e2e7f%201.jpg",
  },
  {
    title: "Stone Cleaning Training",
    description: "Students practice safe restoration methods on sites",
    location: "Tlemcen",
    date: "27/05/2026",
    imageUrl: "/e108c4a81ca8f617b8f5c16cfc0e2e7f%201.jpg",
  },
  {
    title: "Casbah Restoration Workshop",
    description: "Volunteers learn basic preservation techniques",
    location: "Casbah, Algiers",
    date: "20/04/2026",
    imageUrl: "/e872c9fc6c332498e59e855e78490c56%201.jpg",
  },
  {
    title: "Casbah Restoration Workshop",
    description: "Volunteers learn basic preservation techniques",
    location: "Casbah, Algiers",
    date: "20/04/2026",
    imageUrl: "/e872c9fc6c332498e59e855e78490c56%201.jpg",
  },
  {
    title: "Stone Cleaning Training",
    description: "Students practice safe restoration methods on sites",
    location: "Tlemcen",
    date: "27/05/2026",
    imageUrl: "/e108c4a81ca8f617b8f5c16cfc0e2e7f%201.jpg",
  },
];

// Format "2026-04-20T09:00:00Z" → "20/04/2026"
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR"); // gives DD/MM/YYYY
}

function EventCard({ item }: { item: EventItem }) {
  return (
    <div className="bg-white rounded-2xl h-[130px] lg:h-[150px] flex flex-row items-stretch overflow-hidden transition-colors duration-200 hover:bg-[#FFFCF2] hover:-translate-y-1">
      <div className="relative h-full shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover rounded-l-2xl"
        />
      </div>

      <div className={`${lato.className} flex-1 px-5 lg:px-6 py-4 flex flex-col justify-between`}>
        <div>
          <h3 className="font-bold text-base lg:text-lg text-[#2C1A0E] mb-1">
            {item.title}
          </h3>
          <p
            className="font-normal text-xs lg:text-sm text-[#5a4a3a] leading-relaxed overflow-hidden"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.description}
          </p>
        </div>

        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4 text-[#7a5a3a]">
            <span className="flex items-center gap-1.5 text-xs lg:text-sm">
              <PinIcon className="w-3.5 h-3.5 text-[#7a5a3a]" />
              {item.location}
            </span>
            <span className="flex items-center gap-1.5 text-xs lg:text-sm">
              <ClockIcon className="w-3.5 h-3.5 text-[#7a5a3a]" />
              {item.date}
            </span>
          </div>
          <CalendarIcon className="w-9 h-9 lg:w-10 lg:h-10 text-[#2C1A0E]" />
        </div>
      </div>
    </div>
  );
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<EventItem[]>(fallbackEvents);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts/?post_type=event`
        );
        if (!res.ok) return;

        const data = await res.json();

        const fetched: EventItem[] = data.results
          .filter((post: any) => post.images?.[0]?.image)
          .slice(0, 6)
          .map((post: any) => ({
            title: post.title,
            description: post.content ?? "",
            location: post.location || post.region || "",
            date: formatDate(post.event_details?.starts_at ?? ""),
            imageUrl: post.images[0].image,
          }));

        if (fetched.length > 0) setEvents(fetched);
      } catch {
        // silently keep fallback
      }
    }

    fetchEvents();
  }, []);

  return (
    <section
      id="events"
      className="w-full py-24 md:py-28 lg:py-32 px-8 lg:px-24 xl:px-32 scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2", minHeight: "80vh" }}
    >
      <h2
        className="font-bold text-[32px] md:text-[36px] lg:text-[44px] text-[#2C1A0E] text-center mb-14 lg:mb-20"
        style={{ fontFamily: "var(--font-lato), system-ui, sans-serif" }}
      >
        Upcoming Events
      </h2>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {events.map((item, idx) => (
          <EventCard key={`${item.title}-${idx}`} item={item} />
        ))}
      </div>
    </section>
  );
}