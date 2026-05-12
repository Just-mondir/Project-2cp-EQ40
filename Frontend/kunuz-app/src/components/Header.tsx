"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = ["Explore", "About", "Groups", "At Risk", "Events", "Help", "Contact"] as const;

const NAV_HREFS: Record<(typeof NAV_LINKS)[number], string> = {
  Explore: "#explore",
  About: "#about",
  Groups: "#groups",
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
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      event.preventDefault();
      const heroSection = document.getElementById("hero");
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen]);

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
        style={{ height: "52px" }}
      >
        {/* Logo */}
        <Link
          href="/#hero"
          onClick={handleLogoClick}
          className="flex flex-shrink-0 items-end"
          style={{ marginBottom: "-14px", marginLeft: "10px" }}
        >
          <Image
            src="/kunuz-logo.svg"
            alt="Kunuz logo"
            width={144}
            height={99}
            style={{
              height: "76px",
              width: "auto",
              filter: scrolled
                ? "none"
                : "brightness(0) saturate(100%) invert(97%) sepia(10%) saturate(500%) hue-rotate(340deg) brightness(105%)",
            }}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-4 lg:gap-8 xl:gap-13">
          {NAV_LINKS.map((label) => (
            <Link
              key={label}
              href={NAV_HREFS[label]}
              className="group relative whitespace-nowrap text-[14px] md:text-[16px] lg:text-[19px] xl:text-[23px] font-bold transition-colors duration-200"
              style={{
                fontFamily: "var(--font-lato)",
                color: scrolled ? "var(--brown)" : "var(--cream)",
              }}
            >
              {label}
              <span
                className="absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: scrolled ? "var(--brown)" : "var(--cream)" }}
              />
            </Link>
          ))}
        </nav>

        {/* Sign Up — desktop */}
        <Link
          href="/sign-up"
          className="hidden cursor-pointer md:flex flex-shrink-0 items-center justify-center rounded-full border-2 px-3 lg:px-5 xl:px-6 py-1 lg:py-1.5 text-[12px] md:text-[13px] lg:text-[15px] font-bold transition-all duration-300"
          style={{
            borderColor: scrolled ? "var(--brown)" : "var(--cream)",
            color: scrolled ? "var(--brown)" : "var(--cream)",
            fontFamily: "var(--font-lato)",
            backgroundColor: signUpHovered ? "rgba(255, 255, 255, 0.22)" : "transparent",
          }}
          onMouseEnter={() => setSignUpHovered(true)}
          onMouseLeave={() => setSignUpHovered(false)}
        >
          Sign Up
        </Link>
        {/* Hamburger + Dropdown — mobile */}
        <div className="md:hidden relative" ref={menuRef}>
          {/* Hamburger */}
          <button
            type="button"
            className="flex flex-col justify-center gap-[5px] p-2 cursor-pointer"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span
              className="block h-[1.5px] w-6 rounded transition-all duration-300"
              style={{
                backgroundColor: (scrolled || mobileOpen) ? "var(--brown)" : "var(--cream)",
                transform: mobileOpen ? "translateY(7px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block h-[1.5px] w-6 rounded transition-all duration-200"
              style={{
                backgroundColor: (scrolled || mobileOpen) ? "var(--brown)" : "var(--cream)",
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="block h-[1.5px] w-6 rounded transition-all duration-300"
              style={{
                backgroundColor: (scrolled || mobileOpen) ? "var(--brown)" : "var(--cream)",
                transform: mobileOpen ? "translateY(-7px) rotate(-45deg)" : "none",
              }}
            />
          </button>

          {/* Dropdown */}
          <div
            className={`absolute right-0 top-[125%] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-[1.75rem]`}
            style={{
              maxHeight: mobileOpen ? "520px" : "0px",
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.98)",
              boxShadow: mobileOpen ? "0 20px 40px -10px rgba(44, 26, 14, 0.2)" : "none",
              minWidth: "230px",
              backgroundColor: "rgba(255, 252, 240, 0.94)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(224, 213, 197, 0.25)",
              transformOrigin: "top right",
            }}
          >
            <nav className="flex flex-col gap-0.5 px-2 py-3">
              {NAV_LINKS.map((label, index) => (
                <Link
                  key={label}
                  href={NAV_HREFS[label]}
                  className="group flex items-center justify-between rounded-2xl px-4 py-3 text-[16px] font-bold transition-all duration-300 hover:bg-[#E0D5C5]/30"
                  style={{
                    fontFamily: "var(--font-lato)",
                    color: "var(--brown)",
                    transitionDelay: mobileOpen ? `${index * 40}ms` : "0ms",
                    transform: mobileOpen ? "translateX(0)" : "translateX(15px)",
                    opacity: mobileOpen ? 1 : 0,
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="relative">
                    {label}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--brown)] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                </Link>
              ))}

              <div className="mx-4 my-2 h-[1px]" style={{ backgroundColor: "rgba(59, 42, 26, 0.05)" }} />

              <Link
                href="/sign-up"
                className="mx-1.5 rounded-[1.25rem] py-3.5 text-[15px] font-black transition-all duration-300 text-center uppercase tracking-widest hover:brightness-110 active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--brown)",
                  color: "#FFF8E2",
                  fontFamily: "var(--font-lato)",
                  boxShadow: "0 8px 16px -4px rgba(59, 42, 26, 0.3)",
                  transform: mobileOpen ? "translateY(0)" : "translateY(15px)",
                  opacity: mobileOpen ? 1 : 0,
                  transitionDelay: mobileOpen ? `${NAV_LINKS.length * 40 + 50}ms` : "0ms",
                }}
                onClick={() => setMobileOpen(false)}
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
