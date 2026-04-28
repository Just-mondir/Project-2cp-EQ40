"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Lato } from "next/font/google";
import Link from "next/link";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";

type Group = {
  id: string;
  name: string;
  description: string;
  member_count: number;
  profile_picture?: string;
};

function resolveProfilePictureUrl(profilePicture?: string): string {
  const value = String(profilePicture ?? "").trim();
  if (!value) return "/heritage-photography.jpg";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  return `${API_URL}/${value}`;
}

function formatCount(n: number): string {
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k Members";
  }
  return n + " Members";
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M16 11a4 4 0 1 0-3.999-4A4.004 4.004 0 0 0 16 11Zm-8 0a3.5 3.5 0 1 0-3.5-3.5A3.504 3.504 0 0 0 8 11Zm8 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4ZM8 13c-2.61 0-7 1.31-7 3.5V19h6v-2c0-1.63.83-2.9 2.18-3.82A12.92 12.92 0 0 0 8 13Z" />
    </svg>
  );
}

function GroupCard({ group }: { group: Group }) {
  return (
    <Link
      href={`/group/${group.id}`}
      className="bg-white rounded-xl p-4 sm:p-5 md:p-6 lg:p-8 flex flex-row items-start gap-3 sm:gap-4 md:gap-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(44,26,14,0.14)] hover:bg-[#FFFCF2] w-full"
    >
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex-shrink-0">
        <Image
          src={resolveProfilePictureUrl(group.profile_picture)}
          alt={group.name}
          fill
          className="rounded-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 min-w-0">
        <h3
          className={`${lato.className} font-bold text-sm sm:text-base md:text-lg text-[#2C1A0E] mb-0.5 sm:mb-1 line-clamp-1`}
        >
          {group.name}
        </h3>
        <p
          className={`${lato.className} font-normal text-xs sm:text-xs md:text-sm leading-relaxed text-[#5a4a3a] line-clamp-2`}
        >
          {group.description}
        </p>
        <div className="flex flex-row items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2 text-[#7a5a3a]">
          <PeopleIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className={`${lato.className} font-normal text-xs sm:text-xs md:text-sm line-clamp-1`}>
            {formatCount(group.member_count)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function PopularGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(`${API_URL}/api/groups/popular/`);
        const data = await res.json();
        // Matching the extraction logic from communities page
        const groupData = data.data?.results || data.data || data.results || data;
        setGroups(Array.isArray(groupData) ? groupData : []);
      } catch (err) {
        console.error("Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) {
    return (
      <section id="groups" className="w-full py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-8 lg:px-24 xl:px-32" style={{ backgroundColor: "#FFF8E2" }}>
        <h2 className="font-bold text-[clamp(24px,6vw,44px)] text-[#2C1A0E] text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16" style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}>Popular Groups</h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 sm:h-40 bg-white/50 animate-pulse rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (groups.length === 0) return null;

  // Split groups into two columns (limited to 6 total to match previous design)
  const displayedGroups = groups.slice(0, 6);
  const leftColumn = displayedGroups.filter((_, i) => i % 2 === 0);
  const rightColumn = displayedGroups.filter((_, i) => i % 2 !== 0);

  return (
    <section
      id="groups"
      className="w-full py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-8 lg:px-24 xl:px-32 scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2" }}
    >
      <h2
        className="font-bold text-[clamp(24px,6vw,44px)] text-[#2C1A0E] text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16"
        style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
      >
        Popular Groups
      </h2>

      <div
        className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-10"
      >
        <div className="w-full md:w-1/2 flex flex-col gap-4 sm:gap-6 md:gap-8">
          {leftColumn.map((group) => (
            <GroupCard key={`left-${group.id}`} group={group} />
          ))}
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-4 sm:gap-6 md:gap-8">
          {rightColumn.map((group) => (
            <GroupCard key={`right-${group.id}`} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
}


