"use client";

import { useState, useRef, useEffect } from "react";
import LeftSidebar from "../../components/LeftSidebar";

/* ───────────────── DUMMY DATA ───────────────── */

const SANTA_CRUZ_EVENT = {
    user_display_name: "User4987838",
    user_username: "User4987838",
    created_at: "2026-03-25T09:15:00Z",
    location: "Oran",
    title: "FORT SANT KRUZ",
    content: "A hands-on session for students and history enthusiasts to learn about stone preservation techniques used at the iconic Santa Cruz Fort. Led by regional experts.",
    images: [{ id: "img1", image: "/or.jpg" }],
    event_details: {
        starts_at: "2026-05-01",
        ends_at: "2026-05-03",
    },
    gems_count: 256,
    comments_count: 45,
};

const DUMMY_EVENTS = [
    { ...SANTA_CRUZ_EVENT, id: "1" },
    { ...SANTA_CRUZ_EVENT, id: "2" },
    { ...SANTA_CRUZ_EVENT, id: "3" },
    { ...SANTA_CRUZ_EVENT, id: "4" },
    { ...SANTA_CRUZ_EVENT, id: "5" },
];

/* ───────────────── HELPERS ───────────────── */

function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR");
}

/* ───────────────── ICONS ───────────────── */

const PinIcon = ({ size = 14, color = "#432817" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
);

const ClockIcon = ({ size = 14, color = "#432817" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);

/* ───────────────── COMPONENTS ───────────────── */

function EventCard({ event }) {
    const dateRange = `${formatDate(event.event_details.starts_at)} - ${formatDate(event.event_details.ends_at)}`;

    return (
        <div
            className="rounded-xl mb-5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            style={{ boxShadow: "0 2px 16px rgba(67,40,23,0.08)", backgroundColor: "var(--light)" }}
        >
            {/* Header */}
            <div className="flex items-center px-5 pt-4 pb-2">
                <div className="w-[42px] h-[42px] rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#E0D5C5" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#8B7355" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-base" style={{ color: "#432817" }}>{event.user_display_name}</p>
                        <p className="text-xs" style={{ color: "#8B7355" }}>Posted in {formatDate(event.created_at)}</p>
                    </div>
                </div>
                <div className="relative">
                    <button className="p-1 rounded hover:bg-[#FFF8E2] transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                    </button>
                </div>
            </div>

            {/* Row: Location & Date Range (Simple Brown Icons) */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <PinIcon color="#8B7355" />
                    <span className="text-xs font-bold" style={{ color: "#8B7355" }}>{event.location}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ClockIcon color="#8B7355" />
                    <span className="text-xs font-bold" style={{ color: "#8B7355" }}>{dateRange}</span>
                </div>
            </div>

            {/* Title */}
            <h3 className="px-5 pb-2 text-xl font-bold prose prose-sm max-w-none" style={{ color: "#432817" }}>
                {event.title}
            </h3>

            {/* Description */}
            <div className="px-5 pb-2 text-sm leading-relaxed" style={{ color: "#432817" }}>
                {event.content}
            </div>

            {/* Image */}
            {event.images && event.images.length > 0 && (
                <div className="relative px-4 pb-3">
                    <div className="relative w-full overflow-hidden rounded-lg" style={{ height: 460, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
                        <img
                            src={event.images[0].image}
                            alt={event.title}
                            className="relative z-10 w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}
            {/* Footer explicitly removed */}
        </div>
    );
}

function UpcomingEventsPanel() {
    return (
        <aside className="w-[440px] flex-shrink-0 pl-5 pr-4 pt-4 h-full hidden lg:block overflow-hidden">
            <div className="sticky top-0 h-full flex flex-col">
                <h2 className="text-xl font-black mb-6 flex-shrink-0" style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>
                    Upcoming events
                </h2>
                <div className="flex flex-col gap-3 flex-shrink-0">
                    {DUMMY_EVENTS.map((event, i) => (
                        <div
                            key={i}
                            className="flex gap-4 py-5 px-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-[#F0EAD8] hover:-translate-y-0.5"
                            style={{ width: "100%", boxShadow: "0 2px 10px rgba(67,40,23,0.05)", backgroundColor: "rgba(255,255,255,0.4)" }}
                        >
                            <div className="relative flex-shrink-0">
                                <img
                                    src={event.images[0].image}
                                    alt={event.title}
                                    className="w-[56px] h-[72px] rounded-lg object-cover flex-shrink-0 shadow-sm"
                                />
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <span className="flex items-center gap-1.5 text-[11px] mb-1 font-bold" style={{ color: "#8B7355" }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B7355" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    {event.user_display_name}
                                </span>
                                <span className="font-bold text-sm leading-tight mb-1" style={{ color: "#432817" }}>{event.title}</span>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "#8B7355" }}>
                                        <PinIcon size={12} color="#8B7355" /> {event.location}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "#8B7355" }}>
                                        <ClockIcon size={12} color="#8B7355" /> {formatDate(event.event_details.starts_at)} - {formatDate(event.event_details.ends_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}

/* ───────────────── MAIN PAGE ───────────────── */

export default function EventsPage() {
    const [isFocused, setIsFocused] = useState(false);
    const [events, setEvents] = useState(DUMMY_EVENTS);
    const feedRef = useRef(null);

    // Infinite scroll logic
    useEffect(() => {
        const handleScroll = () => {
            if (!feedRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
            // Append more dummy events if we scroll near bottom
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                setEvents((prev) => [
                    ...prev,
                    { ...SANTA_CRUZ_EVENT, id: Math.random().toString() },
                    { ...SANTA_CRUZ_EVENT, id: Math.random().toString() },
                    { ...SANTA_CRUZ_EVENT, id: Math.random().toString() },
                ]);
            }
        };
        const ref = feedRef.current;
        if (ref) ref.addEventListener("scroll", handleScroll);
        return () => {
            if (ref) ref.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <div className="flex h-screen overflow-hidden justify-center" style={{ fontFamily: "var(--font-lato), sans-serif", backgroundColor: "#FFF8E2" }}>
            {/* Reused Sidebar */}
            <LeftSidebar activePage="events" />

            {/* Main Container EXACTLY matching home-page layout */}
            <div className="flex h-full" style={{ width: "1116px", maxWidth: "100%", marginLeft: "80px" }}>
                <div className="flex flex-1 flex-col">
                    {/* Top Search Bar */}
                    <div className="sticky top-0 z-40 px-6 pt-4 pb-3 flex flex-col gap-4" style={{ backgroundColor: "var(--cream)" }}>
                        <div
                            className="flex items-center w-full rounded-full px-4 py-2.5 transition-all duration-200"
                            style={{ backgroundColor: "var(--light)", border: isFocused ? "1px solid #432817" : "1px solid var(--brown)", boxShadow: isFocused ? "0 0 0 3px rgba(67,40,23,0.15)" : "0 1px 8px rgba(67,40,23,0.06)" }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search..."
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                className="flex-1 ml-3 outline-none bg-transparent text-sm"
                                style={{ color: "var(--brown)", fontFamily: "var(--font-lato)" }}
                            />
                            <button className="flex-shrink-0 p-1 rounded hover:bg-[#F0E8CC] transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                                    <circle cx="8" cy="6" r="1.5" fill="#432817" /><circle cx="16" cy="12" r="1.5" fill="#432817" /><circle cx="10" cy="18" r="1.5" fill="#432817" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Feed Column */}
                        <main ref={feedRef} className="flex-1 overflow-y-auto feed-scroll px-6 py-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                            {events.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                            <div className="h-4" />
                        </main>

                        {/* Right Column identical dimension bounds mapping to RightSidebar */}
                        <UpcomingEventsPanel />
                    </div>
                </div>
            </div>
        </div>
    );
}
