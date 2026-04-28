"use client";

import React from "react";
import { useState } from "react";
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
        backgroundColor: scrolled ? "var(--background)" : "transparent",
        boxShadow: scrolled ? "0 4px 18px rgba(44,26,14,0.07)" : "none",
      }}
    >
      {/* ── Main bar ── */}
      <div
        className="flex w-full items-center justify-between px-3 sm:px-4 md:px-6 lg:px-12"
        style={{ height: "clamp(48px, 8vh, 64px)" }}
      >
        {/* Logo */}
        <Link
          href="/#hero"
          onClick={handleLogoClick}
          className="flex flex-shrink-0 items-end"
          style={{ marginBottom: "clamp(-8px, -1.5vh, -14px)", marginLeft: "clamp(4px, 2vw, 10px)" }}
        >
          <Image
            src="/kunuz-logo.svg"
            alt="Kunuz logo"
            width={144}
            height={99}
            style={{
              height: "clamp(48px, 7vh, 76px)",
              width: "auto",
              filter: scrolled
                ? "none"
                : "brightness(0) saturate(100%) invert(97%) sepia(10%) saturate(500%) hue-rotate(340deg) brightness(105%)",
            }}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-2 lg:gap-4 xl:gap-6">
          {NAV_LINKS.map((label) => (
            <Link
              key={label}
              href={NAV_HREFS[label]}
              className="group relative whitespace-nowrap text-[clamp(12px,1.8vw,20px)] font-bold transition-colors duration-200"
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
          className="hidden cursor-pointer md:flex flex-shrink-0 rounded-full border-2 px-clamp px-[clamp(12px,2vw,24px)] py-[clamp(6px,1vh,10px)] text-[clamp(11px,1.5vw,16px)] font-bold transition-all duration-300"
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
        <div
          className="md:hidden relative"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {/* Hamburger */}
          <button
            type="button"
            className="flex flex-col justify-center gap-[4px] p-2 cursor-pointer"
            aria-label="Toggle menu"
          >
            <span
              className="block h-[2.5px] w-5 sm:w-6 rounded transition-all duration-300"
              style={{
                backgroundColor: scrolled ? "var(--brown)" : "var(--cream)",
                transform: mobileOpen ? "translateY(6px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block h-[2.5px] w-5 sm:w-6 rounded transition-all duration-200"
              style={{
                backgroundColor: scrolled ? "var(--brown)" : "var(--cream)",
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="block h-[2.5px] w-5 sm:w-6 rounded transition-all duration-300"
              style={{
                backgroundColor: scrolled ? "var(--brown)" : "var(--cream)",
                transform: mobileOpen ? "translateY(-6px) rotate(-45deg)" : "none",
              }}
            />
          </button>

          {/* Dropdown */}
          <div
            className="absolute right-0 top-full overflow-hidden transition-all duration-300 rounded-2xl"
            style={{
              backgroundColor: "var(--panel-bg)",
              maxHeight: mobileOpen ? "auto" : "0px",
              opacity: mobileOpen ? 1 : 0,
              boxShadow: mobileOpen ? "0 8px 24px rgba(0,0,0,0.10)" : "none",
              minWidth: "180px",
            }}
          >
            <nav className="flex flex-col gap-0 px-4 py-3 sm:px-6">
              {NAV_LINKS.map((label) => (
                <Link
                  key={label}
                  href={NAV_HREFS[label]}
                  className="border-b py-2.5 sm:py-3 text-[14px] sm:text-[16px] font-medium transition-colors duration-200 text-[var(--brown)] hover:text-[#8B6343]"
                  style={{
                    fontFamily: "var(--font-lato)",
                    borderColor: "rgba(59,42,26,0.10)",
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/sign-up"
                className="mt-2 sm:mt-3 w-fit rounded-full border-2 px-4 sm:px-6 py-1.5 sm:py-2 text-[13px] sm:text-[15px] font-bold transition-all duration-300 cursor-pointer inline-block"
                style={{
                  borderColor: "var(--brown)",
                  color: "var(--brown)",
                  fontFamily: "var(--font-lato)",
                  backgroundColor: signUpMobileHovered
                    ? "rgba(255,255,255,0.2)"
                    : "transparent",
                }}
                onMouseEnter={() => setSignUpMobileHovered(true)}
                onMouseLeave={() => setSignUpMobileHovered(false)}
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
