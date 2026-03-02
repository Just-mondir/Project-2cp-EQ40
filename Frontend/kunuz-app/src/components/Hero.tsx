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

      {/* Content — slightly above vertical center, left-aligned */}
      <div
        className="absolute z-10 flex flex-col"
        style={{
          top: "55%",
          transform: "translateY(-50%)",
          left: "4%",
          right: "4%",
          gap: "clamp(12px, 2vh, 22px)",
          maxWidth: "min(720px, 92vw)",
        }}
      >
        <h1
          className="font-bold uppercase leading-none"
          style={{
            color: "#FFFFFF",
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(32px, 5.5vw, 68px)",
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
            fontSize: "clamp(17px, 2.2vw, 30px)",
            maxWidth: "min(600px, 90vw)",
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
          className="w-fit rounded-full border-2 font-bold transition-all duration-300 hover:bg-white/15"
          style={{
            borderColor: "#FFFFFF",
            color: "#FFFFFF",
            fontFamily: "var(--font-lato)",
            backgroundColor: "transparent",
            fontSize: "clamp(15px, 1.4vw, 22px)",
            padding: "clamp(12px, 1.6vh, 18px) clamp(36px, 4vw, 58px)",
            marginTop: "clamp(4px, 1vh, 10px)",
          }}
        >
          Get Started
        </button>
      </div>
    </section>
  );
}