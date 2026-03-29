"use client";

import { useState } from "react";
import Image from "next/image";

const HERO_IMAGE = "/hero-bg.jpg";

export default function Hero() {
  const [hovered, setHovered] = useState(false);

  return (
    <section
      id="hero"
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
          quality={100}
          unoptimized
          className="object-cover object-[center_30%]"
          sizes="100vw"
        />
        {/* Gradient overlay — white to dark */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />
      </div>

      {/* Content — left-aligned with generous spacing */}
      <div
        className="absolute z-10 flex flex-col items-start px-6 sm:px-0"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          left: "clamp(16px, 8%, 120px)",
          right: "clamp(16px, 8%, 120px)",
          gap: "clamp(16px, 3.5vh, 40px)",
          maxWidth: "min(860px, 92vw)",
        }}
      >
        <h1
          className="font-bold uppercase sm:whitespace-nowrap"
          style={{
            color: "#F0EAD6",
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(24px, 5.5vw, 80px)",
            letterSpacing: "0.06em",
            lineHeight: "1.25",
            wordSpacing: "0.10em",
          }}
        >
          DISCOVER THE SOUL
          <br />
          OF ALGERIA
        </h1>

        <p
          className=""
          style={{
            color: "#F0EAD6",
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(18px, 2.4vw, 34px)",
            maxWidth: "min(750px, 88vw)",
            lineHeight: "1.6",
            letterSpacing: "0.03em",
            wordSpacing: "0.08em",
          }}
        >
          <span className="font-bold" style={{ fontFamily: "var(--font-aclonica), system-ui, sans-serif" }}>
            Kunuz
          </span>{" "}
          Connects Generations Through Algeria&apos;s Rich Cultural Heritage
        </p>

        {/* Get Started — hover via React state */}
        <button
          type="button"
          className="w-fit rounded-full border-2 font-bold transition-all duration-300"
          style={{
            borderColor: "#FFFFFF",
            color: "#FFFFFF",
            fontFamily: "var(--font-lato)",
            backgroundColor: hovered ? "rgba(255,255,255,0.2)" : "transparent",
            fontSize: "clamp(14px, 1.5vw, 24px)",
            padding: "clamp(10px, 1.8vh, 22px) clamp(28px, 4.5vw, 64px)",
            marginTop: "clamp(6px, 1.2vh, 14px)",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          Get Started
        </button>
      </div>
    </section>
  );
}