"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

/* ───────────────── MOCK DATA ───────────────── */

const MOCK_USERS: Record<string, any> = {
    User7621053: {
        name: "User7621053",
        handle: "@User7621053",
        bio: "Passionate about Algerian history and heritage. Always exploring new sites and sharing discoveries with the community.",
        stats: { posted: "320", gemed: "2.4k", events: "5" },
        tags: ["#Explorer", "#Heritage", "#Photography"],
        posts: [
            { id: 1, image: "/algerian-architecture-1.jpg", type: "Discover", username: "User7621053", date: "05/03/2025", title: "Traditional Algerian Architecture", body: "Beautiful example of traditional Algerian architectural design with intricate details and patterns.", gems: "1.2k", comments: "48", annotations: "12" },
            { id: 2, image: "/alger 1.jpg", type: "Tour", username: "User7621053", date: "04/03/2025", title: "Streets of Algiers", body: "Exploring the historic streets and buildings of Algiers, a city rich in cultural heritage.", gems: "890", comments: "32", annotations: "8" },
            { id: 3, image: "/download 1.jpg", type: "Question", username: "User7621053", date: "03/03/2025", title: "Historic Courtyard", body: "A stunning courtyard featuring traditional Moorish design elements and zellige tilework.", gems: "2.1k", comments: "156", annotations: "24" },
            { id: 4, image: "/algerian-architecture-1.jpg", type: "Alert", username: "User7621053", date: "02/03/2025", title: "Heritage Site Alert", body: "Important update about the preservation status of this historic location.", gems: "567", comments: "89", annotations: "5" },
            { id: 5, image: "/alger 1.jpg", type: "Discover", username: "User7621053", date: "01/03/2025", title: "Algiers Discovery", body: "New discoveries in the heart of old Algiers revealing centuries of history.", gems: "1.5k", comments: "67", annotations: "19" },
            { id: 6, image: "/download 1.jpg", type: "Discover", username: "User7621053", date: "28/02/2025", title: "Moorish Palace", body: "Inside one of the most beautiful Moorish palaces still standing in Algeria.", gems: "3.2k", comments: "234", annotations: "45" },
        ],
    },
    AminaBen: {
        name: "AminaBen",
        handle: "@AminaBen",
        bio: "History student with a deep love for Algerian architecture. Every stone tells a story.",
        stats: { posted: "180", gemed: "1.8k", events: "2" },
        tags: ["#Student", "#History", "#Architecture"],
        posts: [
            { id: 1, image: "/algerian-architecture-1.jpg", type: "Discover", username: "AminaBen", date: "05/03/2025", title: "Roman Columns in Djémila", body: "Incredible architecture! The Roman influence is so well preserved here.", gems: "920", comments: "34", annotations: "9" },
            { id: 2, image: "/download 1.jpg", type: "Tour", username: "AminaBen", date: "03/03/2025", title: "Walking Through Casbah", body: "A walking tour through the historic Casbah of Algiers.", gems: "1.4k", comments: "78", annotations: "21" },
            { id: 3, image: "/alger 1.jpg", type: "Discover", username: "AminaBen", date: "01/03/2025", title: "Hidden Alleyways", body: "Secret passages and alleyways in the old city.", gems: "650", comments: "25", annotations: "6" },
        ],
    },
    YoucefDZ: {
        name: "YoucefDZ",
        handle: "@YoucefDZ",
        bio: "Traveler & culture enthusiast. Documenting Algeria's most beautiful heritage sites one post at a time.",
        stats: { posted: "95", gemed: "980", events: "1" },
        tags: ["#Traveler", "#Culture", "#Algeria"],
        posts: [
            { id: 1, image: "/alger 1.jpg", type: "Tour", username: "YoucefDZ", date: "04/03/2025", title: "Breathtaking Columns", body: "I visited last summer, the columns are breathtaking in person.", gems: "540", comments: "19", annotations: "5" },
            { id: 2, image: "/algerian-architecture-1.jpg", type: "Discover", username: "YoucefDZ", date: "02/03/2025", title: "Ancient Mosaics", body: "Stunning mosaics found during a recent archaeological dig.", gems: "1.1k", comments: "45", annotations: "14" },
        ],
    },
    LinaHeritage: {
        name: "LinaHeritage",
        handle: "@LinaHeritage",
        bio: "Advocate for heritage preservation. Believing Algeria's history deserves international recognition.",
        stats: { posted: "210", gemed: "3.1k", events: "7" },
        tags: ["#Preservation", "#Advocate", "#Heritage"],
        posts: [
            { id: 1, image: "/download 1.jpg", type: "Alert", username: "LinaHeritage", date: "05/03/2025", title: "International Recognition", body: "This site deserves more international recognition.", gems: "2.3k", comments: "156", annotations: "38" },
            { id: 2, image: "/algerian-architecture-1.jpg", type: "Discover", username: "LinaHeritage", date: "03/03/2025", title: "Ottoman Doorways", body: "Beautiful Ottoman-era doorways in Constantine.", gems: "890", comments: "42", annotations: "11" },
            { id: 3, image: "/alger 1.jpg", type: "Question", username: "LinaHeritage", date: "01/03/2025", title: "Preservation Efforts", body: "What preservation efforts are being made for this site?", gems: "670", comments: "89", annotations: "7" },
            { id: 4, image: "/download 1.jpg", type: "Discover", username: "LinaHeritage", date: "28/02/2025", title: "Ancient Carvings", body: "Intricate carvings found in south Algeria.", gems: "1.5k", comments: "67", annotations: "22" },
        ],
    },
    KarimArch: {
        name: "KarimArch",
        handle: "@KarimArch",
        bio: "Architecture enthusiast & photographer. Capturing the beauty of North African design.",
        stats: { posted: "420", gemed: "5.2k", events: "4" },
        tags: ["#Architecture", "#Photography", "#Design"],
        posts: [
            { id: 1, image: "/algerian-architecture-1.jpg", type: "Discover", username: "KarimArch", date: "05/03/2025", title: "Forum Favorites", body: "The forum area is my favorite part. So much history in one place.", gems: "1.8k", comments: "92", annotations: "28" },
            { id: 2, image: "/alger 1.jpg", type: "Tour", username: "KarimArch", date: "04/03/2025", title: "Arched Walkways", body: "Stunning arched walkways throughout the old city.", gems: "2.1k", comments: "105", annotations: "33" },
            { id: 3, image: "/download 1.jpg", type: "Discover", username: "KarimArch", date: "02/03/2025", title: "Geometric Patterns", body: "Islamic geometric patterns in traditional buildings.", gems: "3.4k", comments: "201", annotations: "52" },
        ],
    },
    SarahExplorer: {
        name: "SarahExplorer",
        handle: "@SarahExplorer",
        bio: "Always curious, always exploring. Sharing tips and guides for visiting heritage sites in Algeria.",
        stats: { posted: "75", gemed: "560", events: "2" },
        tags: ["#Explorer", "#Tips", "#Travel"],
        posts: [
            { id: 1, image: "/alger 1.jpg", type: "Question", username: "SarahExplorer", date: "05/03/2025", title: "Best Visit Time", body: "Does anyone know the best time of year to visit?", gems: "340", comments: "67", annotations: "3" },
            { id: 2, image: "/download 1.jpg", type: "Tour", username: "SarahExplorer", date: "03/03/2025", title: "Spring Visit Guide", body: "A comprehensive guide for visiting heritage sites in spring.", gems: "780", comments: "45", annotations: "12" },
        ],
    },
    MohamedDZ: {
        name: "MohamedDZ",
        handle: "@MohamedDZ",
        bio: "Algerian photographer specializing in heritage sites and historical monuments.",
        stats: { posted: "290", gemed: "4.7k", events: "6" },
        tags: ["#Photographer", "#Monuments", "#Algeria"],
        posts: [
            { id: 1, image: "/algerian-architecture-1.jpg", type: "Discover", username: "MohamedDZ", date: "05/03/2025", title: "Triumphal Arches", body: "The triumphal arches are stunning. Great photo!", gems: "2.6k", comments: "134", annotations: "41" },
            { id: 2, image: "/alger 1.jpg", type: "Tour", username: "MohamedDZ", date: "04/03/2025", title: "Golden Hour Shots", body: "Best photography spots during golden hour.", gems: "3.1k", comments: "178", annotations: "48" },
            { id: 3, image: "/download 1.jpg", type: "Discover", username: "MohamedDZ", date: "02/03/2025", title: "Night Photography", body: "Heritage sites look magical at night.", gems: "1.9k", comments: "89", annotations: "25" },
            { id: 4, image: "/algerian-architecture-1.jpg", type: "Alert", username: "MohamedDZ", date: "01/03/2025", title: "Erosion Warning", body: "This site is suffering from severe erosion.", gems: "980", comments: "56", annotations: "15" },
            { id: 5, image: "/alger 1.jpg", type: "Discover", username: "MohamedDZ", date: "28/02/2025", title: "Hidden Courtyards", body: "Secret courtyards in the medina of Algiers.", gems: "1.4k", comments: "62", annotations: "18" },
        ],
    },
};

// Fallback for unknown users
const DEFAULT_USER = {
    name: "",
    handle: "",
    bio: "This user hasn't added a bio yet.",
    stats: { posted: "0", gemed: "0", events: "0" },
    tags: [],
    posts: [],
};

const MOCK_COMMENTS = [
    { id: 1, user: "AminaBen", text: "Incredible architecture! The Roman influence is so well preserved here." },
    { id: 2, user: "YoucefDZ", text: "I visited last summer, the columns are breathtaking in person." },
    { id: 3, user: "LinaHeritage", text: "This site deserves more international recognition." },
    { id: 4, user: "KarimArch", text: "The forum area is my favorite part. So much history in one place." },
    { id: 5, user: "SarahExplorer", text: "Does anyone know the best time of year to visit?" },
    { id: 6, user: "MohamedDZ", text: "The triumphal arches are stunning. Great photo!" },
];

/* ───────────────── ICONS ───────────────── */

const GemIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 13L2 9z" />
        <path d="M2 9h20" />
        <path d="M12 22L6 9l3-6" />
        <path d="M12 22l6-13-3-6" />
    </svg>
);

const CommentIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const GridIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const AnnotationIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

const BookmarkIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
);

const CalendarIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const DangerIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

/* ───────────────── COMMENT ITEM ───────────────── */

function CommentItem({ comment }: { comment: any }) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<any>(null);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            className="flex gap-3 p-3 rounded-xl"
            style={{
                backgroundColor: "#FFF3D0",
                boxShadow: "0 1px 6px rgba(67,40,23,0.06)",
            }}
        >
            <button
                className="w-[32px] h-[32px] rounded-full flex-shrink-0 flex items-center justify-center transition-opacity hover:opacity-75"
                style={{ backgroundColor: "#E0D5C5", border: "none", cursor: "pointer" }}
                onClick={() => router.push(`/user/${comment.user}`)}
                title={`View ${comment.user}'s profile`}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#8B7355" stroke="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <button
                        className="text-sm font-bold hover:underline transition-all"
                        style={{ color: "#432817", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                        onClick={() => router.push(`/user/${comment.user}`)}
                    >
                        {comment.user}
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button
                            className="p-0.5 rounded hover:bg-[#E0D5C5] transition-colors text-sm font-bold leading-none"
                            style={{ color: "#8B7355" }}
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            ...
                        </button>
                        {showMenu && (
                            <div
                                className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-50"
                                style={{ backgroundColor: "#FFF8E2" }}
                            >
                                <button
                                    className="block w-full text-left px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]"
                                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                                    onClick={() => setShowMenu(false)}
                                >
                                    Report comment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#432817" }}>{comment.text}</p>
                <div className="flex items-center gap-3 mt-1.5">
                    <button className="text-[10px] flex items-center gap-1 hover:text-[#8B6914] transition-colors" style={{ color: "#8B7355" }}>
                        <GemIcon size={12} />
                        <span>10</span>
                    </button>
                    <button className="text-[10px] flex items-center gap-1 hover:text-[#8B6914] transition-colors" style={{ color: "#8B7355" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 14 4 9 9 4" />
                            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                        </svg>
                        <span>10</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ───────────────── LEFT SIDEBAR (FLOATING) ───────────────── */

function LeftSidebar() {
    const navIcons = [
        {
            label: "Home",
            href: "/home-page",
            path: (
                <>
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </>
            ),
        },
        {
            label: "Communities",
            href: "#",
            path: (
                <>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </>
            ),
        },
        {
            label: "Monuments in Danger",
            href: "#",
            path: (
                <>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </>
            ),
        },
        {
            label: "Events",
            href: "#",
            path: (
                <>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </>
            ),
        },
        {
            label: "Notifications",
            href: "#",
            hasBadge: true,
            path: (
                <>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </>
            ),
        },
        {
            label: "Profile",
            href: "/profile",
            path: (
                <>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </>
            ),
        },
    ];

    return (
        <aside
            className="fixed left-4 top-4 w-[56px] flex flex-col items-center py-6 z-50 rounded-2xl"
            style={{
                backgroundColor: "#FFF8E2",
                boxShadow: "0 4px 24px rgba(67,40,23,0.12)",
            }}
        >
            {/* Logo — icon only */}
            <Link href="/home-page" className="mb-6 px-1">
                <img src="/kunuz-icon.svg" alt="Kunuz" width={42} height={42} />
            </Link>

            {/* Nav icons */}
            <nav className="flex flex-col items-center gap-5">
                {navIcons.map((item, i) => (
                    <div key={i} className="relative group">
                        <Link
                            href={item.href}
                            className="relative p-2.5 rounded-xl transition-all duration-200 block hover:bg-[#F0E8CC]"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#432817"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-colors"
                            >
                                {item.path}
                            </svg>
                            {item.hasBadge && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </Link>
                        {/* Tooltip */}
                        <span
                            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50"
                            style={{
                                backgroundColor: "#432817",
                                color: "#FFF8E2",
                                boxShadow: "0 2px 8px rgba(67,40,23,0.2)",
                            }}
                        >
                            {item.label}
                        </span>
                    </div>
                ))}

                {/* Spacer */}
                <div className="h-40" />

                {/* Help icon — at the end with spacing */}
                <div className="relative group">
                    <button
                        className="p-2.5 rounded-xl transition-all duration-200 hover:bg-[#F0E8CC]"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#432817"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </button>
                    {/* Tooltip */}
                    <span
                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50"
                        style={{
                            backgroundColor: "#432817",
                            color: "#FFF8E2",
                            boxShadow: "0 2px 8px rgba(67,40,23,0.2)",
                        }}
                    >
                        Help
                    </span>
                </div>
            </nav>
        </aside>
    );
}

/* ───────────────── PUBLIC PROFILE HEADER (no edit/add buttons) ───────────────── */

function PublicProfileHeader({ userData }: { userData: any }) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<any>(null);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col pt-8 pb-6 px-6 relative">
            {/* Three dots menu - top right */}
            <div className="absolute top-4 right-6" ref={menuRef}>
                <button
                    className="p-2 rounded hover:bg-[#F0EAD8] transition-colors"
                    onClick={() => setShowMenu(!showMenu)}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                    </svg>
                </button>
                {showMenu && (
                    <div
                        className="absolute right-0 top-full mt-1 py-2 rounded-lg shadow-lg z-50"
                        style={{ backgroundColor: "#FFF8E2" }}
                    >
                        <button
                            className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]"
                            style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                            onClick={() => setShowMenu(false)}
                        >
                            Report user
                        </button>
                    </div>
                )}
            </div>

            {/* Top section: Avatar + Info */}
            <div className="flex items-start gap-8">
                {/* Avatar - Left side */}
                <div
                    className="w-[140px] h-[140px] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{
                        boxShadow: "0 4px 20px rgba(67,40,23,0.15)",
                        backgroundColor: "#E0D5C5",
                    }}
                >
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="#8B7355" stroke="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>

                {/* Info - Right side */}
                <div className="flex flex-col items-start">
                    {/* Username */}
                    <h1
                        className="text-2xl font-bold mb-1"
                        style={{ color: "#432817" }}
                    >
                        {userData.name}
                    </h1>

                    {/* Handle/Pseudo */}
                    <p className="text-sm mb-4" style={{ color: "#8B7355" }}>
                        {userData.handle}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold" style={{ color: "#432817" }}>{userData.stats.posted}</span>
                            <span className="text-sm" style={{ color: "#8B7355" }}>Posts</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold" style={{ color: "#432817" }}>{userData.stats.gemed}</span>
                            <span className="text-sm" style={{ color: "#8B7355" }}>Likes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold" style={{ color: "#432817" }}>{userData.stats.events}</span>
                            <span className="text-sm" style={{ color: "#8B7355" }}>Events</span>
                        </div>
                    </div>

                    {/* Tags */}
                    {userData.tags.length > 0 && (
                        <div className="flex items-center gap-3 mb-4">
                            {userData.tags.map((tag: string, i: number) => (
                                <span key={i} className="text-sm" style={{ color: "#432817" }}>{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Bio */}
                    <p
                        className="text-sm leading-relaxed max-w-md"
                        style={{ color: "#432817" }}
                    >
                        {userData.bio}
                    </p>
                </div>
            </div>

            {/* NO "Add post" or "Edit profile" buttons for public view */}
        </div>
    );
}

/* ───────────────── TABS (only grid, events, alerts — no saved/liked for public) ───────────────── */

function PublicProfileTabs({ activeTab, setActiveTab }: { activeTab: any; setActiveTab: any }) {
    const tabs = [
        { id: "grid", icon: <GridIcon size={20} /> },
        { id: "events", icon: <CalendarIcon size={20} /> },
        { id: "alerts", icon: <DangerIcon size={20} /> },
    ];

    return (
        <div className="flex items-center justify-between px-20 py-2 mb-6">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="p-3 transition-all duration-200 hover:opacity-70 relative"
                    style={{
                        color: "#432817",
                    }}
                >
                    {tab.icon}
                    {activeTab === tab.id && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-[3px]"
                            style={{ backgroundColor: "#432817" }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}

/* ───────────────── POST MODAL ───────────────── */

function PostModal({ post, onClose }: { post: any; onClose: any }) {
    const router = useRouter();
    const [newComment, setNewComment] = useState("");
    const [showPostMenu, setShowPostMenu] = useState(false);
    const postMenuRef = useRef<any>(null);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (postMenuRef.current && !postMenuRef.current.contains(event.target)) {
                setShowPostMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!post) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Modal */}
            <div
                className="relative flex w-[900px] max-w-[95vw] max-h-[85vh] rounded-2xl overflow-hidden"
                style={{
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left — Image */}
                <div className="w-1/2 flex-shrink-0 bg-black flex items-center justify-center">
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Right — Comments */}
                <div className="w-1/2 flex flex-col" style={{ backgroundColor: "#FFF8E2" }}>
                    {/* Modal header */}
                    <div className="flex items-center px-5 pt-4 pb-3 border-b" style={{ borderColor: "#E0D5C5" }}>
                        <button
                            className="w-[38px] h-[38px] rounded-full flex-shrink-0 flex items-center justify-center transition-opacity hover:opacity-75"
                            style={{ backgroundColor: "#E0D5C5", border: "none", cursor: "pointer" }}
                            onClick={() => router.push(`/user/${post.username}`)}
                            title={`View ${post.username}'s profile`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355" stroke="none">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </button>
                        <div className="ml-3 flex-1">
                            <div className="flex items-center gap-2">
                                <button
                                    className="font-bold text-base hover:underline transition-all"
                                    style={{ color: "#432817", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                                    onClick={() => router.push(`/user/${post.username}`)}
                                >
                                    {post.username}
                                </button>
                                <p className="text-[11px]" style={{ color: "#8B7355" }}>{post.date}</p>
                            </div>
                        </div>
                        {/* Three dots - horizontal */}
                        <div className="relative" ref={postMenuRef}>
                            <button
                                className="p-1 rounded hover:bg-[#E0D5C5] transition-colors mr-2"
                                onClick={() => setShowPostMenu(!showPostMenu)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B7355">
                                    <circle cx="5" cy="12" r="1.5" />
                                    <circle cx="12" cy="12" r="1.5" />
                                    <circle cx="19" cy="12" r="1.5" />
                                </svg>
                            </button>
                            {showPostMenu && (
                                <div
                                    className="absolute right-0 top-full mt-1 py-2 rounded-lg shadow-lg z-50"
                                    style={{ backgroundColor: "#FFF8E2" }}
                                >
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]"
                                        style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                                        onClick={() => setShowPostMenu(false)}
                                    >
                                        Report post
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-[#E0D5C5] transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Post title & description */}
                    <div className="px-5 pt-3 pb-2 border-b" style={{ borderColor: "#E0D5C5" }}>
                        <h3 className="text-lg font-bold mb-1" style={{ color: "#432817" }}>{post.title}</h3>
                        <p className="text-xs leading-relaxed" style={{ color: "#432817" }}>{post.body}</p>
                    </div>

                    {/* Comments scrollable */}
                    <div className="flex-1 overflow-y-auto px-5 py-3 feed-scroll" style={{ maxHeight: "calc(85vh - 280px)" }}>
                        <div className="flex flex-col gap-3">
                            {MOCK_COMMENTS.map((c) => (
                                <CommentItem key={c.id} comment={c} />
                            ))}
                        </div>
                    </div>

                    {/* Interaction stats bar */}
                    <div className="px-5 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#432817" }}>
                                <GemIcon size={14} /> {post.gems}
                            </span>
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#432817" }}>
                                <CommentIcon size={14} /> {post.comments}
                            </span>
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#432817" }}>
                                <AnnotationIcon size={14} /> {post.annotations}
                            </span>
                        </div>
                        <button className="transition-colors hover:text-[#8B6914]" style={{ color: "#432817" }}>
                            <BookmarkIcon size={18} />
                        </button>
                    </div>

                    {/* Add comment */}
                    <div className="px-5 py-3 flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Add a comment"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 text-xs rounded-xl px-4 py-2.5 outline-none border"
                            style={{
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #E0D5C5",
                                color: "#432817",
                            }}
                        />
                        <button
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-80"
                            style={{ backgroundColor: "#432817" }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF8E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ───────────────── POST GRID ───────────────── */

const TYPE_COLORS: Record<string, string> = {
    Discover: "bg-green-100 text-green-700",
    Tour: "bg-blue-100 text-blue-700",
    Question: "bg-purple-100 text-purple-700",
    Alert: "bg-red-100 text-red-700",
};

function PostGrid({ posts, onPostClick }: { posts: any[]; onPostClick: any }) {
    if (posts.length === 0) {
        return (
            <div className="text-center py-12 flex flex-col items-center" style={{ color: "#8B7355" }}>
                <GridIcon size={48} />
                <p className="mt-4">No posts yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-3 px-4 pb-8">
            {posts.map((post: any) => (
                <div
                    key={post.id}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                    style={{ boxShadow: "0 2px 12px rgba(67,40,23,0.1)" }}
                    onClick={() => onPostClick(post)}
                >
                    <img
                        src={post.image}
                        alt={`Post ${post.id}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-1.5" style={{ color: "#FFFFFF" }}>
                            <GemIcon size={20} />
                            <span className="font-semibold text-sm">{post.gems}</span>
                        </div>
                        <div className="flex items-center gap-1.5" style={{ color: "#FFFFFF" }}>
                            <CommentIcon size={20} />
                            <span className="font-semibold text-sm">{post.comments}</span>
                        </div>
                    </div>
                    {/* Type badge */}
                    <span
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${TYPE_COLORS[post.type]}`}
                    >
                        {post.type}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ───────────────── MAIN PAGE ───────────────── */

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const userData = MOCK_USERS[username] || { ...DEFAULT_USER, name: username, handle: `@${username}` };

    const [activeTab, setActiveTab] = useState("grid");
    const [selectedPost, setSelectedPost] = useState(null);

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: "#FFF8E2",
                fontFamily: "var(--font-lato)",
            }}
        >
            {/* Post Modal */}
            {selectedPost && (
                <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
            )}

            {/* Floating Sidebar */}
            <LeftSidebar />

            {/* Main Content */}
            <main className="pl-[80px] pr-4">
                <div className="max-w-4xl mx-auto">
                    {/* Back button */}
                    <div className="pt-6 pb-2">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-70"
                            style={{ color: "#432817", background: "none", border: "none", cursor: "pointer" }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            Back
                        </button>
                    </div>

                    <PublicProfileHeader userData={userData} />
                    <PublicProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                    {activeTab === "grid" && <PostGrid posts={userData.posts} onPostClick={setSelectedPost} />}
                    {activeTab === "events" && (
                        <div className="text-center py-12 flex flex-col items-center" style={{ color: "#8B7355" }}>
                            <CalendarIcon size={48} />
                            <p className="mt-4">No upcoming events</p>
                        </div>
                    )}
                    {activeTab === "alerts" && (
                        <div className="text-center py-12 flex flex-col items-center" style={{ color: "#8B7355" }}>
                            <DangerIcon size={48} />
                            <p className="mt-4">No monuments in danger</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
