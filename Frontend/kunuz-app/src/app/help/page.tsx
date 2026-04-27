"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { UserCog, SquarePen, MessagesSquare, Church, FileX, Search } from "lucide-react";
import LeftSidebar from "@/components/LeftSidebar";

const helpTopics = [
  {
    title: "Account Management",
    description: "login, signup, profile edit.",
    href: "/help/Account-management",
    keywords: [
      "sign up", "signup", "register", "create account",
      "login", "log in", "password", "remember me",
      "edit profile", "profile picture", "personal information",
      "username", "email", "next", "done",
    ],
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <p style={{ color: "#432817", fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>How to Sign Up</p>
          <ol style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "28px", listStyleType: "decimal" }}>
            <li>Click <strong>"Sign Up"</strong></li>
            <li>Fill your email, Password and confirm it.</li>
            <li>Click <strong>"Next"</strong></li>
            <li>If you already have an Account, Click on <strong>"Login"</strong></li>
          </ol>
        </div>
        <div>
          <p style={{ color: "#432817", fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>How to Login</p>
          <ol style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "28px", listStyleType: "decimal" }}>
            <li>If you already have an account, click on <strong>"Login"</strong>.</li>
            <li>Enter your Username.</li>
            <li>Enter your Password.</li>
            <li>Check <strong>"Remember Me"</strong> to stay logged in.</li>
            <li>Click <strong>"Login"</strong> to access your account.</li>
          </ol>
        </div>
        <div>
          <p style={{ color: "#432817", fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>How to Edit Your Profile?</p>
          <ol style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "28px", listStyleType: "decimal" }}>
            <li>Go to your Profile page.</li>
            <li>Click on <strong>"Edit Profile"</strong>.</li>
            <li>Update your personal information.</li>
            <li>Change your profile picture if needed.</li>
            <li>Click <strong>"Done"</strong>.</li>
          </ol>
        </div>
      </div>
    ),
    icon: <UserCog size={34} color="white" strokeWidth={1.5} />,
  },
  {
    title: "Creating Posts",
    description: "posting, tagging, photos, and visibility.",
    href: "/help/Creating-posts",
    keywords: [
      "create post", "publication", "create publication", "add post",
      "title", "description", "upload", "image", "photo",
      "label", "historical period", "monument type", "region",
      "location", "visibility", "public", "private", "done", "share",
      "tag", "tagging",
    ],
    content: (
      <div>
        <p style={{ color: "#432817", fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>How to Create a Publication?</p>
        <ol style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "28px", listStyleType: "decimal" }}>
          <li>After logging in, go to your Home Page.</li>
          <li>Click on the <strong>"Create Publication"</strong> button.</li>
          <li>Enter a clear Title for your post.</li>
          <li>Write a detailed Description explaining the monument or topic.</li>
          <li>Upload relevant images to illustrate your publication.</li>
          <li>Add a short picture description if required.</li>
          <li>Choose the appropriate labels: Post Type, Historical Period, Monument Type, Region.</li>
          <li>Add the location of the monument.</li>
          <li>Select the visibility settings (public or private).</li>
          <li>Click <strong>"Done"</strong> to share your post.</li>
        </ol>
      </div>
    ),
    icon: <SquarePen size={34} color="white" strokeWidth={1.5} />,
  },
  {
    title:"Interaction with posts",
    description: "like, comment, report.",
    href: "/help/Interaction-withe-posts",
    keywords: [
      "like", "gem", "comment", "share", "repost",
      "interact", "interaction", "news feed", "browse",
      "report post", "inappropriate", "reason", "submit", "review",
      "appreciation", "opinion",
    ],
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <p style={{ color: "#432817", fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>How to Interact with a Post?</p>
          <ol style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "28px", listStyleType: "decimal" }}>
            <li>Browse the News Feed to view publications shared by other users.</li>
            <li>Click the <strong>"Gem"</strong> button to show your appreciation.</li>
            <li>Click <strong>"Comment"</strong> to write and share your opinion.</li>
            <li>Click <strong>"Share"</strong> to repost the publication on your profile.</li>
          </ol>
        </div>
        <div>
          <p style={{ color: "#432817", fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>How to Report a Post?</p>
          <ol style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "28px", listStyleType: "decimal" }}>
            <li>Click on the <strong>"Report"</strong> option if you find inappropriate content.</li>
            <li>Select the reason for reporting.</li>
            <li>Submit your report for review by the administration team.</li>
          </ol>
        </div>
      </div>
    ),
    icon: <MessagesSquare size={34} color="white" strokeWidth={1.5} />,
  },
  {
    title:"Monuments in Danger",
    description: "how to report endangered monuments.",
    href: "/help/Monuments-in-danger",
    keywords: [
      "monument in danger", "endangered", "report monument", "danger",
      "damage", "urgency", "low", "medium", "high",
      "city", "address", "photo", "submit report",
      "at risk", "heritage at risk", "destruction",
    ],
    content: (
      <div>
        <p style={{ color: "#432817", fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>How to Report a Monument in Danger?</p>
        <ol style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "28px", listStyleType: "decimal" }}>
          <li>Go to the <strong>"Monuments in Danger"</strong> section from the menu.</li>
          <li>Click on <strong>"Report a Monument"</strong>.</li>
          <li>Enter the name of the monument.</li>
          <li>Add the location (city or exact address).</li>
          <li>Select the urgency level (low, medium, high).</li>
          <li>Upload clear photos showing the damage.</li>
          <li>Provide a short description explaining the situation.</li>
          <li>Click <strong>"Submit Report"</strong> to send your request.</li>
        </ol>
      </div>
    ),
    icon: <Church size={34} color="white" strokeWidth={1.5} />,
  },
  {
    title: "Reporting Content",
    description: "moderation and review process.",
    href: "/help/Reporting-content",
    keywords: [
      "report content", "inappropriate content", "spam", "false information",
      "moderation", "review", "submit", "flag", "abuse",
      "post menu", "reason", "details",
    ],
    content: (
      <div>
        <p style={{ color: "#432817", fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>How to Report Inappropriate Content?</p>
        <ol style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "28px", listStyleType: "decimal" }}>
          <li>Go to the post you want to report.</li>
          <li>Click on the <strong>"Report"</strong> option (usually available in the post menu).</li>
          <li>Select the reason for reporting (spam, inappropriate content, false information, etc.).</li>
          <li>Provide additional details if required.</li>
          <li>Click <strong>"Submit"</strong> to send your request.</li>
        </ol>
      </div>
    ),
    icon: <FileX size={34} color="white" strokeWidth={1.5} />,
  },
  {
    title: "Search & Filters",
    description: "how to filter by region, period.",
    href: "/help/Searche-by-filter",
    keywords: [
      "search", "filter", "region", "period", "historical period",
      "monument type", "post type", "apply filters", "keyword",
      "refine", "results", "news feed", "find",
    ],
    content: (
      <div>
        <p style={{ color: "#432817", fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>How to Search Using Filters?</p>
        <ol style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "28px", listStyleType: "decimal" }}>
          <li>Go to the News Feed page.</li>
          <li>Use the Search Bar to type keywords related to a monument or topic.</li>
          <li>Click on the Filter option to refine your search.</li>
          <li>Select the desired Historical Period.</li>
          <li>Choose the appropriate Monument Type.</li>
          <li>Select the Region.</li>
          <li>Choose the Post Type if needed.</li>
          <li>Click <strong>"Apply Filters"</strong> to display the results.</li>
        </ol>
      </div>
    ),
    icon: <Search size={34} color="white" strokeWidth={1.5} />,
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<typeof helpTopics[0] | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredTopics = helpTopics.filter((topic) => {
    if (search.length === 0) return false;
    const q = search.toLowerCase();
    return (
      topic.title.toLowerCase().includes(q) ||
      topic.description.toLowerCase().includes(q) ||
      topic.keywords.some((kw) => q.includes(kw) || kw.includes(q))
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>

      <LeftSidebar activePage="help" />

      <div className="flex flex-col flex-1 overflow-y-auto ml-[68px]">

        {/* Hero Banner */}
        <div
          className="relative flex flex-col items-center justify-center text-center"
          style={{ height: "367px", minHeight: "367px" }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: "url('/timgad.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} />

          <div className="relative z-10 flex flex-col items-center gap-6 px-6">
            <h1 style={{ color: "#FFFFFF", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 800, fontSize: "50px", lineHeight: 1.2 }}>
              Help & User Guide
            </h1>
            <p style={{ color: "#FFFFFF", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 900, fontSize: "30px" }}>
              Navigate and contribute to preserving Algeria's Architectural legacy
            </p>

            {/* Search Bar */}
            <div ref={searchRef} style={{ position: "relative", width: "465px" }}>
              <div
                className="flex items-center gap-3"
                style={{ backgroundColor: "#FFFFFF", borderRadius: "50px", border: "2px solid #432817", padding: "0 20px", height: "63px" }}
              >
                <Search size={22} color="#79747E" strokeWidth={2} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search help topics ..."
                  style={{ border: "none", outline: "none", backgroundColor: "transparent", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "20px", color: "#79747E", width: "100%" }}
                />
              </div>

              {/* Dropdown */}
              {showDropdown && filteredTopics.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "70px",
                    left: 0,
                    right: 0,
                    backgroundColor: "#FFFFFF",
                    borderRadius: "16px",
                    border: "1px solid #D6CFC3",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {filteredTopics.map((topic, i) => (
                    <div
                      key={i}
                      onClick={() => { setSelectedTopic(topic); setShowDropdown(false); setSearch(""); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 20px",
                        cursor: "pointer",
                        borderBottom: i < filteredTopics.length - 1 ? "1px solid #F2F2F2" : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "#FFF8E2"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
                    >
                      <Search size={16} color="#79747E" strokeWidth={2} />
                      <div>
                        <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 600, fontSize: "15px", margin: 0 }}>
                          {topic.title}
                        </p>
                        <p style={{ color: "#79747E", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "13px", margin: 0 }}>
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-2 px-10 py-9" style={{ gap: "32px", backgroundColor: "#FFF8E2" }}>
          {helpTopics.map((topic, index) => (
            <Link key={index} href={topic.href} style={{ textDecoration: "none" }}>
              <div
                className="flex items-center gap-5 cursor-pointer relative"
                style={{
                  height: "120px",
                  borderRadius: "10px",
                  border: "2px solid #432817",
                  backgroundColor: "rgba(67, 40, 23, 0.10)",
                  padding: "0 24px",
                  transition: "all 0.25s ease",
                  boxShadow: "0 2px 8px rgba(67, 40, 23, 0.08)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.backgroundColor = "rgba(67, 40, 23, 0.18)";
                  el.style.boxShadow = "0 8px 24px rgba(67, 40, 23, 0.20)";
                  el.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.backgroundColor = "rgba(67, 40, 23, 0.10)";
                  el.style.boxShadow = "0 2px 8px rgba(67, 40, 23, 0.08)";
                  el.style.transform = "translateY(0)";
                }}
              >
                {/* Icon circle */}
                <div
                  style={{
                    width: "65px",
                    height: "65px",
                    borderRadius: "50%",
                    backgroundColor: "#432817",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {topic.icon}
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 700, fontSize: "20px", margin: 0 }}>
                    {topic.title}
                  </p>
                  <p style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "20px", margin: 0 }}>
                    {topic.description}
                  </p>
                </div>

                {/* Arrow */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

      </div>

      {/* Modal Popup */}
      {selectedTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setSelectedTopic(null)}
        >
          <div
            style={{
              backgroundColor: "#FFF8E2",
              borderRadius: "20px",
              padding: "36px 40px",
              width: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTopic(null)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "#432817", lineHeight: 1 }}
            >
              ×
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#432817", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {selectedTopic.icon}
              </div>
              <div>
                <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 700, fontSize: "24px", margin: 0 }}>
                  {selectedTopic.title}
                </p>
                <p style={{ color: "#79747E", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontSize: "14px", margin: 0 }}>
                  {selectedTopic.description}
                </p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #C4A882", paddingTop: "20px", fontFamily: "var(--font-lato), 'Lato', sans-serif", color: "#000000" }}>
              {selectedTopic.content}
            </div>

            <Link
              href={selectedTopic.href}
              style={{ display: "inline-block", marginTop: "24px", color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 600, fontSize: "14px", textDecoration: "underline" }}
            >
              View full page →
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
