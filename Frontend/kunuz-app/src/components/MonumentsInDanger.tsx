"use client";

import Image from "next/image";
import { useState } from "react";

type Monument = {
  src: string;
  alt: string;
  name: string;
  boldLocation: string;
  riskLevel: string;
};

const monuments: Monument[] = [
  {
    src: "/timgad%201.jpg",
    alt: "Timgad Roman arch and columns",
    name: "Timgad City",
    boldLocation: "Batna",
    riskLevel: "high level",
  },
  {
    src: "/Conception%20photograpie%201.jpg",
    alt: "Suspension bridge over dramatic gorge",
    name: "El Kantara Bridge",
    boldLocation: "Biskra",
    riskLevel: "medium level",
  },
  {
    src: "/about-4.jpg",
    alt: "Traditional Algerian courtyard with tiles and arches",
    name: "Casbah of Algiers",
    boldLocation: "Algiers",
    riskLevel: "critical level",
  },
];

export default function MonumentsInDanger() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = monuments[activeIndex];

  return (
    <section
      id="at-risk"
      className="relative w-full min-h-[650px] md:min-h-[720px] scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2" }}
    >
      {/* Background image — clipped separately so cards can overflow */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={active.src}
          alt={active.alt}
          fill
          priority
          className="object-cover"
          style={{
            filter: "blur(8px)",
            transform: "scale(1.05)",
            objectPosition:
              active.name === "El Kantara Bridge" ? "right center" : "left center",
          }}
        />
        {/* Horizontal fade */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(255,248,226,0) 0%, rgba(255,248,226,0) 20%, rgba(255,248,226,0.5) 38%, rgba(255,248,226,0.85) 50%, rgba(255,248,226,1) 62%, rgba(255,248,226,1) 100%)",
          }}
        />
        {/* Top/bottom fade */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,248,226,0.6) 0%, transparent 12%, transparent 88%, rgba(255,248,226,0.6) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-8 lg:px-16 py-16 md:py-20 lg:py-24 flex justify-center">
        <div className="max-w-7xl w-full flex flex-col gap-12 lg:gap-16">

          {/* Title */}
          <div className="max-w-2xl text-center mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold text-[#2C1A0E] mb-5">
              Monuments In Danger
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-[#2C1A0E] opacity-80">
              Discover endangered heritage sites and help preserve them.
            </p>
          </div>

          {/* Left text + Right images */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-16">

            {/* Left — dynamic text */}
            <div className="max-w-md lg:max-w-lg text-left">
              <h3
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#2C1A0E] mb-4"
                style={{
                  transition: "opacity 0.4s ease",
                  color:
                    active.name === "El Kantara Bridge" ? "#FFF8E2" : "#2C1A0E",
                }}
              >
                {active.name}
              </h3>
              <p
                className="text-base md:text-lg lg:text-xl text-[#2C1A0E] leading-relaxed"
                style={{
                  transition: "opacity 0.4s ease",
                  color:
                    active.name === "El Kantara Bridge" ? "#FFF8E2" : "#2C1A0E",
                }}
              >
                Located in{" "}
                <span className="font-bold">{active.boldLocation}</span>,
                Algeria
                <br />
                faces a{" "}
                <span className="font-bold">{active.riskLevel}</span> of risk.
              </p>
            </div>

            {/* Right — three images, overflow visible so scale isn't clipped */}
            <div
              className="flex flex-row items-end justify-center gap-5 lg:gap-6"
              style={{ overflow: "visible" }}
            >
              {monuments.map((monument, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className="relative w-[180px] md:w-[200px] lg:w-[220px] h-[280px] md:h-[310px] lg:h-[340px] rounded-3xl flex-shrink-0 cursor-pointer"
                  style={{
                    overflow: "hidden",
                    transformOrigin: "center bottom",
                    transform:
                      activeIndex === idx ? "scale(1.08)" : "scale(1)",
                    filter:
                      activeIndex === idx
                        ? "brightness(1.05)"
                        : "brightness(0.7)",
                    transition:
                      "transform 0.4s ease, filter 0.4s ease, box-shadow 0.4s ease",
                    boxShadow:
                      activeIndex === idx
                        ? "0 12px 32px rgba(44,26,14,0.3)"
                        : "none",
                    /* Give last card enough room to scale without clipping */
                    marginRight: idx === monuments.length - 1 ? "32px" : "0",
                  }}
                >
                  <Image
                    src={monument.src}
                    alt={monument.alt}
                    width={220}
                    height={340}
                    className="w-full h-full object-cover"
                  />
                  {activeIndex === idx && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl"
                      style={{ backgroundColor: "#2C1A0E" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* View more */}
          <div className="flex justify-end">
            <button
              className="px-6 py-2 rounded-full border border-[#2C1A0E] text-[#2C1A0E] text-sm font-medium bg-transparent hover:bg-[#2C1A0E]/5 transition-colors duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(44,26,14,0.2)]"
              type="button"
            >
              View more
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}