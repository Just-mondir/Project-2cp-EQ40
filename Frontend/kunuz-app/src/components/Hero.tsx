"use client";

import Image from "next/image";

const HERO_IMAGE = "/hero-bg.jpg";

export default function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "100vh", minHeight: "500px" }}
    >
      {/* Background image — anchored to top */}
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Ornate Algerian Moorish architecture with arches and tilework"
          fill
          priority
          className="object-cover object-top"
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.05) 80%, rgba(0,0,0,0) 100%)",
          }}
        />
      </div>

      {/* Content — centered on desktop, left-aligned */}
      <div
        className="absolute z-10 flex flex-col items-start lg:items-start"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          left: "8%",
          right: "8%",
          gap: "clamp(16px, 2.5vh, 28px)",
          maxWidth: "min(860px, 88vw)",
        }}
      >
        <h1
          className="font-bold uppercase leading-none"
          style={{
            color: "#FFFFFF",
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(36px, 6vw, 80px)",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          DISCOVER THE SOUL
          <br />
          OF ALGERIA
        </h1>

        <p
          className="leading-snug"
          style={{
            color: "#F0EAD6",
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(18px, 2.4vw, 34px)",
            maxWidth: "min(700px, 88vw)",
          }}
        >
          <span className="font-bold" style={{ fontFamily: "var(--font-brand)" }}>
            Kunuz
          </span>{" "}
          Connects Generations Through Algeria&apos;s Rich Cultural Heritage
        </p>

        {/* Get Started — hover via Tailwind only, no styled-jsx */}
        <button
          type="button"
        className="w-fit rounded-full border-2 font-bold transition-all duration-300 hover:bg-white/15 hover:-translate-y-1 hover:shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
          style={{
            borderColor: "#FFFFFF",
            color: "#FFFFFF",
            fontFamily: "var(--font-lato)",
            backgroundColor: "transparent",
            fontSize: "clamp(16px, 1.5vw, 24px)",
            padding: "clamp(14px, 1.8vh, 22px) clamp(40px, 4.5vw, 64px)",
            marginTop: "clamp(6px, 1.2vh, 14px)",
          }}
        >
          Get Started
        </button>
      </div>
    </section>
  );
}