"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import LeftSidebar from "@/components/LeftSidebar";
import { useLocaleSettings } from "@/components/LocaleProvider";
import { getHelpContent, helpDirection, helpTextAlign, TopicContent, type HelpTopic } from "./helpContent";

export default function HelpPage() {
  const { locale } = useLocaleSettings();
  const content = getHelpContent(locale);
  const direction = helpDirection(locale);
  const textAlign = helpTextAlign(locale);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredTopics = content.topics.filter((topic) => {
    if (search.length === 0) return false;
    const query = search.toLowerCase();
    return (
      topic.title.toLowerCase().includes(query) ||
      topic.description.toLowerCase().includes(query) ||
      topic.keywords.some((keyword) => query.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
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
        <div className="relative flex flex-col items-center justify-center text-center" style={{ height: 367, minHeight: 367 }}>
          <div className="absolute inset-0" style={{ backgroundImage: "url('/timgad.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} />
          <div className="relative z-10 flex flex-col items-center gap-6 px-6" dir={direction}>
            <h1 style={{ color: "#FFFFFF", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 800, fontSize: 50, lineHeight: 1.2, textAlign: "center" }}>
              {content.heroTitle}
            </h1>
            <p style={{ color: "#FFFFFF", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 900, fontSize: 30, textAlign: "center" }}>
              {content.heroSubtitle}
            </p>

            <div ref={searchRef} style={{ position: "relative", width: 465 }}>
              <div className="flex items-center gap-3" style={{ backgroundColor: "#FFFFFF", borderRadius: 50, border: "2px solid #432817", padding: "0 20px", height: 63 }}>
                <Search size={22} color="#79747E" strokeWidth={2} />
                <input
                  dir={direction}
                  type="text"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={content.searchPlaceholder}
                  style={{ border: "none", outline: "none", backgroundColor: "transparent", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: 20, color: "#79747E", width: "100%", textAlign }}
                />
              </div>

              {showDropdown && filteredTopics.length > 0 && (
                <div style={{ position: "absolute", top: 70, left: 0, right: 0, backgroundColor: "#FFFFFF", borderRadius: 16, border: "1px solid #D6CFC3", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 50, overflow: "hidden" }}>
                  {filteredTopics.map((topic, index) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => { setSelectedTopic(topic); setShowDropdown(false); setSearch(""); }}
                      className="flex w-full items-center gap-3 text-left"
                      style={{ padding: "12px 20px", cursor: "pointer", border: "none", borderBottom: index < filteredTopics.length - 1 ? "1px solid #F2F2F2" : "none", background: "transparent" }}
                    >
                      <Search size={16} color="#79747E" strokeWidth={2} />
                      <div dir={direction} style={{ textAlign }}>
                        <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 600, fontSize: 15, margin: 0 }}>{topic.title}</p>
                        <p style={{ color: "#79747E", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: 13, margin: 0 }}>{topic.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 px-10 py-9" style={{ gap: 32, backgroundColor: "#FFF8E2" }}>
          {content.topics.map((topic) => (
            <Link key={topic.id} href={topic.href} style={{ textDecoration: "none" }}>
              <div className="flex items-center gap-5 cursor-pointer relative" style={{ height: 120, borderRadius: 10, border: "2px solid #432817", backgroundColor: "rgba(67, 40, 23, 0.10)", padding: "0 24px", transition: "all 0.25s ease", boxShadow: "0 2px 8px rgba(67, 40, 23, 0.08)" }}>
                <div style={{ width: 65, height: 65, borderRadius: "50%", backgroundColor: "#432817", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {topic.icon}
                </div>
                <div className="flex flex-col gap-2 flex-1" dir={direction} style={{ textAlign }}>
                  <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 700, fontSize: 20, margin: 0 }}>{topic.title}</p>
                  <p style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: 20, margin: 0 }}>{topic.description}</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ transform: direction === "rtl" ? "rotate(180deg)" : undefined }}>
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedTopic(null)}>
          <div style={{ backgroundColor: "#FFF8E2", borderRadius: 20, padding: "36px 40px", width: 600, maxHeight: "80vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setSelectedTopic(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#432817", lineHeight: 1 }}>×</button>
            <div className="flex items-center gap-4 mb-6">
              <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "#432817", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{selectedTopic.icon}</div>
              <div dir={direction} style={{ textAlign }}>
                <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 700, fontSize: 24, margin: 0 }}>{selectedTopic.title}</p>
                <p style={{ color: "#79747E", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontSize: 14, margin: 0 }}>{selectedTopic.description}</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #C4A882", paddingTop: 20, fontFamily: "var(--font-lato), 'Lato', sans-serif", color: "#000000" }}>
              <TopicContent topic={selectedTopic} locale={locale} compact />
            </div>
            <Link href={selectedTopic.href} style={{ display: "inline-block", marginTop: 24, color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 600, fontSize: 14, textDecoration: "underline" }}>
              {content.viewFullPage}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
