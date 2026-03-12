import Image from "next/image";
import { Lato } from "next/font/google";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
});

type Guild = {
  name: string;
  description: string;
  membersLabel: string;
  avatar:
    | { kind: "unesco" }
    | { kind: "photo"; src: string; alt: string };
};

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

function UnescoAvatar() {
  return (
    <div
      className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center"
      style={{ backgroundColor: "#1B6CA8" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        className="w-8 h-8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14 26h36v6H14v-6Zm4 8h4v18h-4V34Zm10 0h4v18h-4V34Zm10 0h4v18h-4V34Zm10 0h4v18h-4V34ZM12 54h40v4H12v-4Zm6-32 14-8 14 8H18Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}

function GuildCard({ guild }: { guild: Guild }) {
  return (
    <div className="bg-white rounded-xl p-6 lg:p-8 flex flex-row items-start gap-4 lg:gap-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(44,26,14,0.14)] hover:bg-[#FFFCF2]">
      {guild.avatar.kind === "unesco" ? (
        <UnescoAvatar />
      ) : (
        <Image
          src={guild.avatar.src}
          alt={guild.avatar.alt}
          width={80}
          height={80}
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover shrink-0"
        />
      )}

      <div className="flex flex-col gap-1.5">
        <h3
          className={`${lato.className} font-bold text-base lg:text-lg text-[#2C1A0E] mb-1`}
        >
          {guild.name}
        </h3>
        <p
          className={`${lato.className} font-normal text-xs lg:text-sm leading-relaxed text-[#5a4a3a]`}
        >
          {guild.description}
        </p>
        <div className="flex flex-row items-center gap-2 mt-2 text-[#7a5a3a]">
          <PeopleIcon className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className={`${lato.className} font-normal text-xs lg:text-sm`}>
            {guild.membersLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PopularGuilds() {
  const unesco: Guild = {
    name: "UNESCO World Heritage Sites",
    description:
      "A group for discovering, studying, and sharing content about sites recognized by UNESCO for their outstanding cultural or natural value",
    membersLabel: "3,7K Members",
    avatar: { kind: "unesco" },
  };

  const tipaza: Guild = {
    name: "Monuments of Tipaza",
    description:
      "A community dedicated to exploring, documenting, and celebrating the monuments and archaeological sites of Tipaza and its surrounding region",
    membersLabel: "3,7K Members",
    avatar: {
      kind: "photo",
      src: "https://images.unsplash.com/photo-1738873712992-60607f0df361?w=80&h=80&fit=crop&crop=entropy&cs=srgb&q=85&fm=jpg",
      alt: "Athar Jmila (Djemila) Roman ruins under a bright sky",
    },
  };

  const photography: Guild = {
    name: "Heritage Photography",
    description:
      "A space for sharing and discussing photos of cultural and historical landmarks, focusing on storytelling, technique, and respectful preservation of heritage",
    membersLabel: "3,7K Members",
    avatar: {
      kind: "photo",
      src: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=80&h=80&fit=crop",
      alt: "Camera lens and photographer outdoors",
    },
  };

  const leftColumn: Guild[] = [unesco, tipaza, photography];
  const rightColumn: Guild[] = [tipaza, photography, unesco];

  return (
    <section
      id="guilds"
      className="w-full py-20 lg:py-28 px-8 lg:px-24 xl:px-32 scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2" }}
    >
      <h2
        className="font-bold text-[32px] md:text-[36px] lg:text-[44px] text-[#2C1A0E] text-center mb-12 lg:mb-16"
        style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
      >
        Popular Guilds
      </h2>

      <div
        className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 lg:gap-10"
      >
        <div className="w-full md:w-1/2 flex flex-col gap-8">
          {leftColumn.map((guild, idx) => (
            <GuildCard key={`left-${idx}-${guild.name}`} guild={guild} />
          ))}
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-8">
          {rightColumn.map((guild, idx) => (
            <GuildCard key={`right-${idx}-${guild.name}`} guild={guild} />
          ))}
        </div>
      </div>
    </section>
  );
}

