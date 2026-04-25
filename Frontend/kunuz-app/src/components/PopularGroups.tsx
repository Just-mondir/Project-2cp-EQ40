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
      className="bg-white rounded-xl p-6 lg:p-8 flex flex-row items-start gap-4 lg:gap-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(44,26,14,0.14)] hover:bg-[#FFFCF2] w-full"
    >
      <div className="relative w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0">
        <Image
          src={resolveProfilePictureUrl(group.profile_picture)}
          alt={group.name}
          fill
          className="rounded-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        <h3
          className={`${lato.className} font-bold text-base lg:text-lg text-[#2C1A0E] mb-1 line-clamp-1`}
        >
          {group.name}
        </h3>
        <p
          className={`${lato.className} font-normal text-xs lg:text-sm leading-relaxed text-[#5a4a3a] line-clamp-2`}
        >
          {group.description}
        </p>
        <div className="flex flex-row items-center gap-2 mt-2 text-[#7a5a3a]">
          <PeopleIcon className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className={`${lato.className} font-normal text-xs lg:text-sm`}>
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
      <section id="groups" className="w-full py-20 lg:py-28 px-8 lg:px-24 xl:px-32" style={{ backgroundColor: "#FFF8E2" }}>
        <h2 className="font-bold text-[32px] md:text-[36px] lg:text-[44px] text-[#2C1A0E] text-center mb-12">Popular Groups</h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-white/50 animate-pulse rounded-xl" />
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
      className="w-full py-20 lg:py-28 px-8 lg:px-24 xl:px-32 scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2" }}
    >
      <h2
        className="font-bold text-[32px] md:text-[36px] lg:text-[44px] text-[#2C1A0E] text-center mb-12 lg:mb-16"
        style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
      >
        Popular Groups
      </h2>

      <div
        className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 lg:gap-10"
      >
        <div className="w-full md:w-1/2 flex flex-col gap-8">
          {leftColumn.map((group) => (
            <GroupCard key={`left-${group.id}`} group={group} />
          ))}
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-8">
          {rightColumn.map((group) => (
            <GroupCard key={`right-${group.id}`} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
}


