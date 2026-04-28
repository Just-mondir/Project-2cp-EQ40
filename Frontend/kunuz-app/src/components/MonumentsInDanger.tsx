"use client";
import { useState, useEffect } from "react";

type Monument = {
  src: string;
  alt: string;
  name: string;
  boldLocation: string;
  urgenceLevel: string;
  currentStatus: string;
};

type AlertApiPost = {
  title?: string;
  images?: Array<{ image?: string }>;
  region?: string;
  location?: string;
  alert_details?: {
    urgence_level?: string;
    current_status?: string;
  };
};

const fallbackMonuments: Monument[] = [
  {
    src: "/timgad%201.jpg",
    alt: "Timgad Roman arch and columns",
    name: "Timgad City",
    boldLocation: "Batna",
    urgenceLevel: "high",
    currentStatus: "alert",
  },
  {
    src: "/Conception%20photograpie%201.jpg",
    alt: "Suspension bridge over dramatic gorge",
    name: "El Kantara Bridge",
    boldLocation: "Biskra",
    urgenceLevel: "medium",
    currentStatus: "alert",
  },
  {
    src: "/casbah%201.jpg",
    alt: "Traditional Algerian courtyard with tiles and arches",
    name: "Casbah of Algiers",
    boldLocation: "Algiers",
    urgenceLevel: "critical",
    currentStatus: "alert",
  },
];

export default function MonumentsInDanger() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [monuments, setMonuments] = useState<Monument[]>(fallbackMonuments);

  useEffect(() => {
    async function fetchMonuments() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts/?post_type=alert`
        );
        if (!res.ok) return;
        const data = await res.json();

        const fetched: Monument[] = ((data.results || []) as AlertApiPost[])
          .filter((post) => post.images?.[0]?.image)
          .slice(0, 3)
          .map((post) => {
            const stripHtml = (html: string) => {
              if (!html) return "";
              let result = html;
              let prev: string;
              do {
                prev = result;
                result = prev.replace(/<[^>]*>/g, "");
              } while (result !== prev);
              return result;
            };
            const cleanTitle = stripHtml(post.title || "");

            // Handle image URL correctly:
            const imgPath = post.images?.[0]?.image || "";
            const imageUrl = imgPath.startsWith("http")
              ? imgPath
              : `https://res.cloudinary.com/dq3jtkxtp/image/upload/${imgPath}`;

            return {
              src: imageUrl || "/fallback-image.jpg",  // Fallback image if URL is not found
              alt: cleanTitle,
              name: cleanTitle,
              boldLocation: post.region || post.location || "Unknown",
              urgenceLevel: post.alert_details?.urgence_level || "unknown",
              currentStatus: post.alert_details?.current_status || "unknown",
            };
          });

        if (fetched.length > 0) setMonuments(fetched);
      } catch {
        console.error("Failed to fetch monuments.");
      }
    }
    fetchMonuments();
  }, []);

  const active = monuments[activeIndex];

  return (
    <section
      id="at-risk"
      className="relative w-full min-h-[600px] sm:min-h-[700px] md:min-h-[720px] lg:min-h-[750px] scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2" }}
    >
      <div className="absolute inset-y-0 left-0 w-full md:w-1/2 overflow-hidden">
        <img
          src={active.src}
          alt={active.alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "blur(4px)",
            transform: "scale(1.03)",
            objectPosition: "left center",
          }}
        />
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(255,248,226,0) 0%, rgba(255,248,226,0) 75%, rgba(255,248,226,0.6) 90%, rgba(255,248,226,1) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,248,226,0.6) 0%, transparent 12%, transparent 88%, rgba(255,248,226,0.6) 100%)",
          }}
        />
      </div>
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 flex justify-center">
        <div className="max-w-7xl w-full flex flex-col gap-6 sm:gap-8 md:gap-12 lg:gap-16">
          <div className="max-w-2xl text-center mx-auto">
            <h2
              className="font-bold text-[clamp(24px,6vw,56px)] leading-tight text-[#2C1A0E] mb-3 sm:mb-4 md:mb-5"
              style={{ fontFamily: "var(--font-lato), system-ui, sans-serif" }}
            >
              Monuments In Danger
            </h2>
            <p className="text-[clamp(13px,2.5vw,21px)] text-[#2C1A0E] opacity-80">
              Discover endangered heritage sites and help preserve them.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-10 lg:gap-16">
            <div className="max-w-sm md:max-w-md lg:max-w-lg text-center md:text-left w-full md:w-auto">
              <h3
                className="text-[clamp(20px,5vw,40px)] font-bold text-[#2C1A0E] mb-2 sm:mb-3 md:mb-4"
                style={{ transition: "opacity 0.4s ease" }}
              >
                {active.name}
              </h3>
              <p
                className="text-[clamp(14px,2vw,21px)] text-[#2C1A0E] leading-relaxed mb-2 sm:mb-3"
                style={{ transition: "opacity 0.4s ease" }}
              >
                Located in{" "}
                <span className="font-bold">{active.boldLocation}</span>,
                Algeria
              </p>
              <p className="text-[clamp(14px,2vw,21px)] text-[#2C1A0E]">
                <span className="font-bold capitalize">
                  Urgence Level: {active.urgenceLevel}
                </span>
                <br />
                <span className="font-bold capitalize">
                  Current Status: {active.currentStatus}
                </span>
              </p>
            </div>
            <div
              className="flex flex-row items-end justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-nowrap overflow-x-auto pb-2 w-full md:w-auto"
            >
              {monuments.map((monument, idx) => (
                <div
                  key={idx}
                  className="relative w-[90px] sm:w-[120px] md:w-[160px] lg:w-[220px] h-[150px] sm:h-[200px] md:h-[260px] lg:h-[340px] rounded-2xl sm:rounded-3xl flex-shrink-0 overflow-hidden cursor-pointer"
                  style={{
                    transformOrigin: "center bottom",
                    transform: activeIndex === idx ? "scale(1.02)" : "scale(1)",
                    transition:
                      "transform 0.4s ease, filter 0.4s ease, box-shadow 0.4s ease",
                    boxShadow:
                      activeIndex === idx
                        ? "0 12px 32px rgba(44,26,14,0.3)"
                        : "none",
                    filter:
                      activeIndex === idx
                        ? "brightness(1.05)"
                        : "brightness(0.7)",
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                >
                  <img
                    src={monument.src}
                    alt={monument.alt}
                    className="w-full h-full object-cover"
                  />
                  {activeIndex === idx && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: "#2C1A0E" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
