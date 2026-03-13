import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="mt-16 border-t border-[rgba(59,42,26,0.12)] bg-[#FFF4D2]"
      style={{ fontFamily: "var(--font-lato)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 md:flex-row md:items-start md:justify-between">
        {/* Brand + short description */}
        <div className="flex flex-1 flex-col gap-4 max-w-sm">
          <div className="flex items-center gap-3">
            <Image
              src="/kunuz-logo.svg"
              alt="Kunuz logo"
              width={56}
              height={56}
              className="h-14 w-auto"
              priority
            />
            <span
              className="text-xl font-semibold tracking-wide"
              style={{ fontFamily: "var(--font-aclonica)" }}
            >
              Kunuz
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[#3B2A1A] opacity-80">
            Connecting generations through Algeria&apos;s living heritage –
            stories, monuments, guilds and events that keep our culture alive.
          </p>
        </div>

        {/* Navigation columns */}
        <div className="flex flex-[1.2] flex-wrap gap-10 text-sm text-[#3B2A1A]">
          <div className="min-w-[140px] space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B6343]"
              style={{ fontFamily: "var(--font-aclonica)" }}
            >
              Explore
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-[#8B6343]">
                  Landing
                </Link>
              </li>
              <li>
                <Link href="/home" className="hover:text-[#8B6343]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/monuments-in-danger" className="hover:text-[#8B6343]">
                  Monuments in danger
                </Link>
              </li>
            </ul>
          </div>

          <div className="min-w-[140px] space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B6343]"
              style={{ fontFamily: "var(--font-aclonica)" }}
            >
              About
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-[#8B6343]">
                  About Kunuz
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="hover:text-[#8B6343]">
                  Community guidelines
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-[#8B6343]">
                  Legal &amp; policies
                </Link>
              </li>
            </ul>
          </div>

          <div className="min-w-[160px] space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B6343]"
              style={{ fontFamily: "var(--font-aclonica)" }}
            >
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:hello@kunuz.dz"
                  className="hover:text-[#8B6343]"
                >
                  hello@kunuz.dz
                </a>
              </li>
              <li className="text-[13px] opacity-80">
                Algiers, Algeria
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(59,42,26,0.08)] bg-[#FFE9B0]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 text-[11px] text-[#3B2A1A] opacity-80 sm:flex-row sm:px-10">
          <p>© {new Date().getFullYear()} Kunuz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

