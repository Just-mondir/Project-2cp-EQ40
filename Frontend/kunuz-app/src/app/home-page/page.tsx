"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ───────────────── MOCK DATA ───────────────── */

const POSTS = [
  {
    id: 1,
    username: "User7621053",
    date: "05/03/2025",
    location: "Sétif",
    title: "Djémila",
    body: "Djémila, also known as Cuicul, is a remarkably preserved Roman town perched at 900 meters in the mountains of Kabylie. Its forum, temples, basilicas, and triumphal arches paint a vivid picture of Roman life adapted to a mountainous environment, earning its place as a UNESCO World Heritage Site...",
    image: "/frame-243.jpg",
    badge: "Discover",
    gems: "27K",
    comments: "1.6K",
    annotations: "750",
    saves: "1.6K",
  },
];

const MOCK_COMMENTS = [
  { id: 1, user: "AminaBen", text: "Incredible architecture! The Roman influence is so well preserved here." },
  { id: 2, user: "YoucefDZ", text: "I visited last summer, the columns are breathtaking in person." },
  { id: 3, user: "LinaHeritage", text: "This site deserves more international recognition." },
  { id: 4, user: "KarimArch", text: "The forum area is my favorite part. So much history in one place." },
  { id: 5, user: "SarahExplorer", text: "Does anyone know the best time of year to visit?" },
  { id: 6, user: "MohamedDZ", text: "The triumphal arches are stunning. Great photo!" },
];

const GUILDS = [
  {
    name: "Heritage Photography",
    desc: "A space for sharing photos of cultural and historical landmarks",
    members: "2.7k",
    image: "/heritage-photography.jpg",
  },
  {
    name: "UNESCO World Heritage Sites",
    desc: "Dedicated to Algeria's UNESCO-recognized sites",
    members: "4.1k",
    image: "/unisco.jpg",
  },
  {
    name: "Monuments of Tipaza",
    desc: "Exploring and documenting the archaeological sites of Tipaza",
    members: "1.9k",
    image: "/monuments-of-tipaza.jpg",
  },
  {
    name: "Heritage Photography",
    desc: "A space for sharing photos of cultural and historical landmarks",
    members: "2.7k",
    image: "/heritage-photography.jpg",
  },
  {
    name: "UNESCO World Heritage Sites",
    desc: "Dedicated to Algeria's UNESCO-recognized sites",
    members: "4.1k",
    image: "/unisco.jpg",
  },
  {
    name: "Monuments of Tipaza",
    desc: "Exploring and documenting the archaeological sites of Tipaza",
    members: "1.9k",
    image: "/monuments-of-tipaza.jpg",
  },
];

const BADGE_COLORS = {
  Discover: "bg-[#8B6914] text-white",
  Tour: "bg-[#5C7A3E] text-white",
  Alert: "bg-[#A0522D] text-white",
  Question: "bg-[#4A6B8A] text-white",
};

/* ───────────────── SVG ICONS ───────────────── */

const GemIcon = ({ className = "", size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9z" />
    <path d="M2 9h20" />
    <path d="M12 22L6 9l3-6" />
    <path d="M12 22l6-13-3-6" />
  </svg>
);

const CommentIcon = ({ className = "", size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkIcon = ({ className = "", size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const AnnotationIcon = ({ className = "", size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

/* ───────────────── COMMENT ITEM ───────────────── */

function CommentItem({ comment }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
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
        className="w-[32px] h-[32px] rounded-full flex-shrink-0 flex items-center justify-center transition-opacity hover:opacity-75 cursor-pointer"
        style={{ backgroundColor: "#E0D5C5", border: "none" }}
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
            className="text-sm font-bold hover:underline transition-all cursor-pointer"
            style={{ color: "#432817", background: "none", border: "none", padding: 0 }}
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
  const [activeIdx, setActiveIdx] = useState(0);

  const navIcons = [
    {
      label: "Home",
      href: null,
      path: (
        <>
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </>
      ),
    },
    {
      label: "Communities",
      href: null,
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
      href: null,
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
      href: null,
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
      href: null,
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
      <div className="mb-6 px-1">
        <img src="/kunuz-icon.svg" alt="Kunuz" width={42} height={42} />
      </div>

      {/* Nav icons */}
      <nav className="flex flex-col items-center gap-5">
        {navIcons.map((item, i) => {
          const iconContent = (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={activeIdx === i ? "#FFF8E2" : "none"}
                stroke={activeIdx === i ? "#FFF8E2" : "#432817"}
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
            </>
          );

          return (
            <div key={i} className="relative group">
              {item.href ? (
                <Link
                  href={item.href}
                  className={`relative p-2.5 rounded-xl transition-all duration-200 block ${activeIdx === i
                    ? "bg-[#432817]"
                    : "hover:bg-[#F0E8CC]"
                    }`}
                >
                  {iconContent}
                </Link>
              ) : (
                <button
                  onClick={() => setActiveIdx(i)}
                  className={`relative p-2.5 rounded-xl transition-all duration-200 ${activeIdx === i
                    ? "bg-[#432817]"
                    : "hover:bg-[#F0E8CC]"
                    }`}
                >
                  {iconContent}
                </button>
              )}
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
          );
        })}

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

/* ───────────────── FILTER SECTION ───────────────── */

function FilterSection({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div
      className="px-3 py-2 mb-2"
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "10px",
        boxShadow: "0 2px 12px rgba(67,40,23,0.1)",
      }}
    >
      <h3
        className="text-sm font-bold mb-2 text-center"
        style={{
          color: "#432817",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        Personalise News feed filter
      </h3>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        {["Historical Period", "Region", "Monument Type", "User Expertise"].map(
          (label) => (
            <div key={label}>
              <label
                className="text-[9px] font-medium mb-0.5 block"
                style={{ color: "#6B5344" }}
              >
                {label}
              </label>
              <select
                className="w-full text-[10px] px-2 py-1.5 outline-none cursor-pointer appearance-none"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #432817",
                  borderRadius: "999px",
                  color: "#432817",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%23432817' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                }}
              >
                <option>All</option>
                <option>Roman</option>
                <option>Ottoman</option>
                <option>Islamic</option>
              </select>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ───────────────── POST MODAL ───────────────── */

function PostModal({ post, onClose }) {
  const [newComment, setNewComment] = useState("");
  const [showPostMenu, setShowPostMenu] = useState(false);
  const postMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
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
            <Link
              href={`/user/${post.username}`}
              className="w-[38px] h-[38px] rounded-full flex-shrink-0 flex items-center justify-center transition-opacity hover:opacity-75"
              style={{ backgroundColor: "#E0D5C5" }}
              title={`View ${post.username}'s profile`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355" stroke="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/user/${post.username}`} className="font-bold text-base hover:underline transition-all" style={{ color: "#432817" }}>{post.username}</Link>
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

/* ───────────────── RIGHT SIDEBAR ───────────────── */

function RightSidebar() {
  return (
    <aside className="w-[300px] flex-shrink-0 pl-5 pr-4 pt-4 overflow-y-auto h-full">
      <h2
        className="text-base font-bold mb-5"
        style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
      >
        View Popular Guilds
      </h2>
      <div className="flex flex-col gap-2">
        {GUILDS.map((guild, i) => (
          <div
            key={i}
            className="flex gap-4 py-5 px-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-[#F0EAD8] hover:-translate-y-0.5"
            style={{ width: "283px", boxShadow: "0 2px 10px rgba(67,40,23,0.07)" }}
          >
            {/* Guild circular thumbnail */}
            <img
              src={guild.image}
              alt={guild.name}
              className="w-[55px] h-[55px] rounded-full object-cover flex-shrink-0"
            />
            {/* Guild info */}
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-bold text-sm" style={{ color: "#432817" }}>
                {guild.name}
              </span>
              <span className="text-xs leading-tight mt-1 line-clamp-2" style={{ color: "#8B7355" }}>
                {guild.desc}
              </span>
              <span className="flex items-center gap-1 text-[11px] mt-1.5" style={{ color: "#8B7355" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {guild.members} Members
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ───────────────── POST CARD ───────────────── */

function PostCard({ post, isNew, onCommentClick }) {
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl mb-5 transition-all duration-200 hover:-translate-y-0.5 ${isNew ? "post-fade-in" : ""
        }`}
      style={{
        boxShadow: "0 2px 16px rgba(67,40,23,0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 24px rgba(67,40,23,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(67,40,23,0.08)";
      }}
    >
      {/* Header */}
      <div className="flex items-center px-5 pt-4 pb-2">
        {/* Avatar — clickable */}
        <Link
          href={`/user/${post.username}`}
          className="w-[42px] h-[42px] rounded-full flex-shrink-0 flex items-center justify-center transition-opacity hover:opacity-75"
          style={{ backgroundColor: "#E0D5C5" }}
          title={`View ${post.username}'s profile`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#8B7355" stroke="none">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/user/${post.username}`} className="font-bold text-base hover:underline transition-all" style={{ color: "#432817" }}>
              {post.username}
            </Link>
            <p className="text-xs" style={{ color: "#8B7355" }}>
              {post.date}
            </p>
          </div>
        </div>
        {/* Three dots with menu */}
        <div className="relative">
          <button
            className="p-1 rounded hover:bg-[#FFF8E2] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B7355">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 py-2 px-4 rounded-lg shadow-lg z-50"
              style={{ backgroundColor: "#FFF8E2" }}
            >
              <button
                className="text-sm font-bold whitespace-nowrap"
                style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              >
                Report post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 px-5 pb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="text-xs" style={{ color: "#8B7355" }}>
          {post.location}
        </span>
      </div>

      {/* Title — bold Lato */}
      <h3
        className="px-5 pb-2 text-xl font-bold"
        style={{ color: "#432817" }}
      >
        {post.title}
      </h3>

      {/* Body */}
      <p className="px-5 pb-3 text-sm leading-relaxed" style={{ color: "#432817" }}>
        {post.body}{" "}
        <button className="font-semibold" style={{ color: "#8B6914" }}>
          See more
        </button>
      </p>

      {/* Image */}
      <div className="relative px-4 pb-3">
        {imgError ? (
          <div
            className="w-full rounded-lg flex items-center justify-center"
            style={{
              height: 460,
              background: "linear-gradient(135deg, #C8A96E, #8B6914)",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        ) : (
          <img
            src={post.image}
            alt={post.title}
            className="w-full rounded-lg object-cover"
            style={{ maxHeight: 460, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
            onError={() => setImgError(true)}
          />
        )}

        {/* Badge */}
        {post.badge && (
          <span
            className={`absolute top-2 right-6 px-3 py-1 rounded-full text-xs font-semibold ${BADGE_COLORS[post.badge] || ""
              }`}
          >
            {post.badge}
          </span>
        )}
      </div>

      {/* Interaction bar — Left: Gem, Comment, Annotation | Right: Save */}
      <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F0EAD8" }}>
        <div className="flex items-center gap-5">
          <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#8B6914]" style={{ color: "#432817" }}>
            <GemIcon />
            <span>{post.gems}</span>
          </button>
          <button
            className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#8B6914] cursor-pointer"
            style={{ color: "#432817" }}
            onClick={onCommentClick}
          >
            <CommentIcon />
            <span>{post.comments}</span>
          </button>
          <button
            className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#8B6914] cursor-pointer"
            style={{ color: "#432817" }}
            onClick={onCommentClick}
          >
            <AnnotationIcon />
            <span>{post.annotations}</span>
          </button>
        </div>
        <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#8B6914]" style={{ color: "#432817" }}>
          <BookmarkIcon />
        </button>
      </div>
    </div>
  );
}

/* ───────────────── MAIN PAGE ───────────────── */

export default function HomePageRoute() {
  const [posts, setPosts] = useState(() => POSTS.map((p, i) => ({ ...p, _key: i })));
  const [loading, setLoading] = useState(false);
  const [newPostStart, setNewPostStart] = useState(-1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const sentinelRef = useRef(null);
  const counterRef = useRef(POSTS.length);
  const feedRef = useRef(null);

  // Track scroll position to hide filter when scrolled
  useEffect(() => {
    const feedElement = feedRef.current;
    if (!feedElement) return;

    const handleScroll = () => {
      const scrolled = feedElement.scrollTop > 10;
      setIsScrolled(scrolled);
      if (scrolled) {
        setShowFilter(false);
      }
    };

    feedElement.addEventListener('scroll', handleScroll);
    return () => feedElement.removeEventListener('scroll', handleScroll);
  }, []);

  const loadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const shuffled = [...POSTS].sort(() => Math.random() - 0.5).slice(0, 3);
      const newPosts = shuffled.map((p) => ({
        ...p,
        _key: counterRef.current++,
      }));
      setPosts((prev) => {
        setNewPostStart(prev.length);
        return [...prev, ...newPosts];
      });
      setLoading(false);
    }, 1200);
  }, [loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="flex h-screen overflow-hidden justify-center" style={{ fontFamily: "var(--font-lato), sans-serif", backgroundColor: "#FFF8E2" }}>
        {/* LEFT SIDEBAR — floating */}
        <LeftSidebar />

        {/* Constrained container */}
        <div className="flex h-full" style={{ width: "1116px", maxWidth: "100%", marginLeft: "80px" }}>
          {/* MAIN CONTENT AREA */}
          <div className="flex flex-1 flex-col">
            {/* TOP SEARCH BAR */}
            <div className="sticky top-0 z-40 px-6 pt-4 pb-3" style={{ backgroundColor: "#FFF8E2" }}>
              <div
                className="flex items-center w-full rounded-full px-4 py-2.5"
                style={{
                  backgroundColor: "#FFF8E2",
                  border: "1px solid #432817",
                  boxShadow: "0 1px 8px rgba(67,40,23,0.06)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#432817"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 ml-3 outline-none bg-transparent text-sm"
                  style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                />
                <button
                  className="flex-shrink-0 p-1 rounded hover:bg-[#F0E8CC] transition-colors"
                  onClick={() => {
                    if (isScrolled && feedRef.current) {
                      feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      setTimeout(() => setShowFilter(true), 300);
                    } else {
                      setShowFilter(!showFilter);
                    }
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#432817"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                    <circle cx="8" cy="6" r="1.5" fill="#432817" />
                    <circle cx="16" cy="12" r="1.5" fill="#432817" />
                    <circle cx="10" cy="18" r="1.5" fill="#432817" />
                  </svg>
                </button>
              </div>
            </div>

            {/* FEED + RIGHT SIDEBAR row */}
            <div className="flex flex-1 overflow-hidden">
              {/* CENTER FEED */}
              <main ref={feedRef} className="flex-1 overflow-y-auto feed-scroll px-6 py-2">
                {/* Filter Section — toggleable, hidden when scrolled */}
                <FilterSection isVisible={showFilter} />

                {posts.map((post, index) => (
                  <PostCard
                    key={post._key}
                    post={post}
                    isNew={index >= newPostStart && newPostStart !== -1}
                    onCommentClick={() => setSelectedPost(post)}
                  />
                ))}

                {/* Loader */}
                {loading && (
                  <div className="flex justify-center py-6">
                    <div
                      className="w-8 h-8 rounded-full border-3 border-t-transparent loader-spin"
                      style={{ borderColor: "#E0D5C5", borderTopColor: "#8B6914" }}
                    />
                  </div>
                )}

                {/* Sentinel for infinite scroll */}
                <div ref={sentinelRef} className="h-4" />
              </main>

              {/* RIGHT SIDEBAR */}
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>

      {/* POST MODAL */}
      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </>
  );
}
