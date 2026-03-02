"use client";

import { useState } from "react";
import Image from "next/image";

const NAV_LINKS = ["Explore", "About", "At Risk", "Help", "Contact"];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{ backgroundColor: "#F5F0E8" }}
    >
      {/* ── Main bar ── */}
      <div
        className="flex w-full items-center justify-between pl-0 pr-4 sm:pr-6 lg:pr-12"
        style={{ height: "64px", overflow: "hidden" }}
      >
        {/* Logo flush left, nudged down, clipped by overflow:hidden on this row */}
        <div className="flex flex-shrink-0 items-end" style={{ marginBottom: "-14px",marginLeft: "10px" }}>
          <Image
            src="/kunuz-logo.svg"
            alt="Kunuz logo"
            width={144}
            height={99}
            style={{ height: "76px", width: "auto" }}
            priority
          />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          {NAV_LINKS.map((label) => (
            <a
              key={label}
              href="#"
              className="group relative whitespace-nowrap text-[14px] lg:text-[16px] font-medium transition-colors duration-200"
              style={{ color: "#3B2A1A", fontFamily: "var(--font-lato)" }}
            >
              {label}
              <span
                className="absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: "#8B6343" }}
              />
            </a>
          ))}

          <button
            type="button"
            className="signin-btn ml-1 rounded-full border-2 px-4 lg:px-6 py-1.5 text-[13px] lg:text-[15px] font-bold transition-all duration-300"
            style={{
              borderColor: "#3B2A1A",
              color: "#3B2A1A",
              fontFamily: "var(--font-lato)",
              backgroundColor: "transparent",
            }}
          >
            Sign In
          </button>
        </nav>

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
            <a
              key={label}
              href="#"
              className="border-b py-3 text-[16px] font-medium transition-colors duration-200"
              style={{
                color: "#3B2A1A",
                fontFamily: "var(--font-lato)",
                borderColor: "rgba(59,42,26,0.10)",
              }}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </a>
          ))}
          <button
            type="button"
            className="mt-3 w-fit rounded-full border-2 px-6 py-2 text-[15px] font-bold"
            style={{
              borderColor: "#3B2A1A",
              color: "#3B2A1A",
              fontFamily: "var(--font-lato)",
              backgroundColor: "transparent",
            }}
          >
            Sign In
          </button>
        </nav>
      </div>

      <style jsx>{`
        .signin-btn:hover {
          background-color: rgba(59, 42, 26, 0.10);
          color: #3B2A1A;
        }
      `}</style>
    </header>
  );
}