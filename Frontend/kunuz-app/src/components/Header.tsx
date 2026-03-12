"use client";

import React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = ["Explore", "About", "Guilds", "At Risk", "Events", "Help", "Contact"] as const;

const NAV_HREFS: Record<(typeof NAV_LINKS)[number], string> = {
  Explore: "#explore",
  About: "#about",
  Guilds: "#guilds",
  "At Risk": "#at-risk",
  Events: "#events",
  Help: "#help",
  Contact: "#contact",
};

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signUpHovered, setSignUpHovered] = useState(false);
  const [signUpMobileHovered, setSignUpMobileHovered] = useState(false);

  // Scroll effect for nav bar appearance
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
      style={{
        backgroundColor: scrolled ? "#FFF8E2" : "transparent",
        boxShadow: scrolled ? "0 4px 18px rgba(44,26,14,0.07)" : "none",
      }}
    >
      {/* ── Main bar ── */}
      <div
        className="flex w-full items-center justify-between pl-0 pr-4 sm:pr-6 lg:pr-12"
        style={{ height: "52px", overflow: "hidden" }}
      >
        {/* Logo flush left */}
        <div className="flex flex-shrink-0 items-end" style={{ marginBottom: "-14px", marginLeft: "10px" }}>
          <Image
            src="/kunuz-logo.svg"
            alt="Kunuz logo"
            width={144}
            height={99}
            style={{ height: "76px", width: "auto" }}
            priority
          />
        </div>

        {/* Desktop nav — centered links with spacing from logo & sign in */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-4 lg:gap-8 xl:gap-13">
          {NAV_LINKS.map((label) => (
            <Link
              key={label}
              href={NAV_HREFS[label]}
              className="group relative whitespace-nowrap text-[14px] md:text-[16px] lg:text-[19px] xl:text-[23px] font-bold transition-colors duration-200"
              style={{ color: "#3B2A1A", fontFamily: "var(--font-lato)" }}
            >
              {label}
              <span
                className="absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: "#8B6343" }}
              />
            </Link>
          ))}
        </nav>

        {/* Sign Up — pinned to the right */}
        <button
          type="button"
          className="hidden md:block flex-shrink-0 rounded-full border-2 px-3 lg:px-5 xl:px-6 py-1 lg:py-1.5 text-[12px] md:text-[13px] lg:text-[15px] font-bold transition-all duration-300"
          style={{
            borderColor: "#3B2A1A",
            color: "#3B2A1A",
            fontFamily: "var(--font-lato)",
            backgroundColor: signUpHovered ? "rgba(255,255,255,0.2)" : "transparent",
          }}
          onMouseEnter={() => setSignUpHovered(true)}
          onMouseLeave={() => setSignUpHovered(false)}
        >
          Sign Up
        </button>

        {/* Hamburger — mobile only */}
        <button
          type="button"
          className="md:hidden flex flex-col justify-center gap-[5px] p-2"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span
            className="block h-[2px] w-6 rounded transition-all duration-300"
            style={{
              backgroundColor: "#3B2A1A",
              transform: mobileOpen ? "translateY(7px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block h-[2px] w-6 rounded transition-all duration-200"
            style={{
              backgroundColor: "#3B2A1A",
              opacity: mobileOpen ? 0 : 1,
            }}
          />
          <span
            className="block h-[2px] w-6 rounded transition-all duration-300"
            style={{
              backgroundColor: "#3B2A1A",
              transform: mobileOpen ? "translateY(-7px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {/* ── Mobile dropdown — inside <header> so no layout shift ── */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: mobileOpen ? "320px" : "0px",
          boxShadow: mobileOpen ? "0 8px 24px rgba(0,0,0,0.10)" : "none",
        }}
      >
        <nav className="flex flex-col gap-1 px-6 pb-5 pt-2">
          {NAV_LINKS.map((label) => (
            <Link
              key={label}
              href={NAV_HREFS[label]}
              className="border-b py-3 text-[16px] font-medium transition-colors duration-200"
              style={{
                color: "#3B2A1A",
                fontFamily: "var(--font-lato)",
                borderColor: "rgba(59,42,26,0.10)",
              }}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            className="mt-3 w-fit rounded-full border-2 px-6 py-2 text-[15px] font-bold transition-all duration-300"
            style={{
              borderColor: "#3B2A1A",
              color: "#3B2A1A",
              fontFamily: "var(--font-lato)",
              backgroundColor: signUpMobileHovered ? "rgba(255,255,255,0.2)" : "transparent",
            }}
            onMouseEnter={() => setSignUpMobileHovered(true)}
            onMouseLeave={() => setSignUpMobileHovered(false)}
          >
            Sign Up
          </button>
        </nav>
      </div>
    </header>
  );
}