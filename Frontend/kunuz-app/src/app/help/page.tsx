"use client";

import React, { useState, useRef, useEffect, cloneElement } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import LeftSidebar from "@/components/LeftSidebar";
import { useLocaleSettings } from "@/components/LocaleProvider";
import { getHelpContent, helpDirection, helpTextAlign, TopicContent } from "./helpContent";


export default function HelpPage() {
  const { locale } = useLocaleSettings();
  const helpContent = getHelpContent(locale);
  const helpTopics = helpContent.topics;
  const direction = helpDirection(locale);
  const textAlign = helpTextAlign(locale);

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
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
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: "#FFF8E2" }} dir={direction}>

      <LeftSidebar activePage="help" />

      <div className="flex flex-col flex-1 overflow-y-auto ml-0 md:ml-[68px] pb-24 md:pb-0">

        {/* Hero Banner */}
        <div
          className="relative flex flex-col items-center justify-center text-center"
          style={{ height: "300px", minHeight: "300px" }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: "url('/timgad.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} />

          <div className="relative z-10 flex flex-col items-center gap-6 px-6">
            <h1 className="text-2xl md:text-4xl font-extrabold" style={{ color: "#FFFFFF", fontFamily: "var(--font-lato), 'Lato', sans-serif", lineHeight: 1.2, textAlign }}>
              {helpContent.heroTitle}
            </h1>
            <p className="text-base md:text-2xl font-black" style={{ color: "#FFFFFF", fontFamily: "var(--font-lato), 'Lato', sans-serif", textAlign }}>
              {helpContent.heroSubtitle}
            </p>

            {/* Search Bar */}
            <div ref={searchRef} className="relative w-full max-w-[465px] px-4 md:px-0">
              <div
                className="flex items-center gap-3 w-full h-[54px] md:h-[63px]"
                style={{ backgroundColor: "#FFFFFF", borderRadius: "50px", border: "2px solid #432817", padding: "0 20px" }}
              >
                <Search size={22} color="#79747E" strokeWidth={2} className="flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={helpContent.searchPlaceholder}
                  className="text-sm md:text-lg w-full"
                  style={{ border: "none", outline: "none", backgroundColor: "transparent", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, color: "#79747E", textAlign }}
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
                        <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 600, fontSize: "15px", margin: 0, textAlign }}>
                          {topic.title}
                        </p>
                        <p style={{ color: "#79747E", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "13px", margin: 0, textAlign }}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 px-4 md:px-10 py-6 md:py-9 bg-[#FFF8E2] gap-4 md:gap-8">
          {helpTopics.map((topic, index) => (
            <Link key={index} href={topic.href} style={{ textDecoration: "none" }}>
              <div
                className="flex items-center gap-4 md:gap-5 cursor-pointer relative"
                style={{
                  height: "auto",
                  minHeight: "100px",
                  borderRadius: "10px",
                  border: "2px solid #432817",
                  backgroundColor: "rgba(67, 40, 23, 0.10)",
                  padding: "16px 20px",
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
                  className="w-10 h-10 md:w-[60px] md:h-[60px] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#432817" }}
                >
                  <div className="scale-75 md:scale-100">
                    {topic.icon}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 md:gap-2 flex-1">
                  <p className="text-sm md:text-lg font-bold m-0" style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", textAlign }}>
                    {topic.title}
                  </p>
                  <p className="text-xs md:text-base font-normal m-0" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", textAlign }}>
                    {topic.description}
                  </p>
                </div>

                {/* Arrow */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="#432817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              width: "calc(100% - 32px)",
              maxWidth: "600px",
              maxHeight: "85vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            className="p-6 md:p-9"
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

            <div style={{ borderTop: "1px solid #C4A882", paddingTop: "20px", fontFamily: "var(--font-lato), 'Lato', sans-serif", color: "#000000", textAlign }}>
              <TopicContent topic={selectedTopic} locale={locale} compact />
            </div>

            <Link
              href={selectedTopic.href}
              style={{ display: "inline-block", marginTop: "24px", color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 600, fontSize: "14px", textDecoration: "underline", textAlign }}
            >
              {helpContent.viewFullPage}
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
