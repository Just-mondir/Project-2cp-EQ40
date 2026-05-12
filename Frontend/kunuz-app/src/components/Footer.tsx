"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on specific pages
  if (
    pathname === "/home-page" ||
    pathname === "/events" ||
    pathname === "/monuments-in-danger" ||
    pathname.startsWith("/communities") ||
    pathname === "/login" ||
    pathname === "/sign-up" ||
    pathname === "/set-profile" ||
    pathname === "/verify-email" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/user") ||
    pathname.startsWith("/add-post") ||
    pathname.startsWith("/add-event") ||
    pathname.startsWith("/edit-post") ||
    pathname.startsWith("/edit-profile") ||
    pathname.startsWith("/create-group") ||
    pathname.startsWith("/edit-group") ||
    pathname.startsWith("/group") ||
     pathname.startsWith("/moderator-page")
  ) {
    return null;
  }

  // Layout Styles
  const desktopLinkClass =
    "text-[#e8d9c0] hover:text-[#BB9557] relative w-fit after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#BB9557] after:transition-all after:duration-300 hover:after:w-full cursor-pointer";

  const mobileLinkClass =
    "text-[#e8d9c0] hover:text-[#BB9557] transition-all duration-300 cursor-pointer text-[15px] font-medium";

  const mobileSocialIconClass =
    "w-10 h-10 rounded-full border border-[#e8d9c0]/30 flex items-center justify-center hover:bg-[#e8d9c0]/10 transition-all duration-300 transform hover:scale-110";

  return (
    <>
      {/* MOBILE FOOTER - Custom design from image */}
      <footer style={{ backgroundColor: "#3b2314" }} className="block sm:hidden w-full mt-10 text-[#e8d9c0]">
        <div className="px-8 py-10">
          {/* Logo & Tagline */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img src="/kunuz-icon.svg" alt="Kunuz Icon" className="w-10 h-10 object-contain" />
              <span className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-aclonica), sans-serif" }}>Kunuz</span>
            </div>

            <p className="text-[#e8d9c0]/90 font-medium text-base leading-relaxed italic" style={{ fontFamily: "var(--font-aclonica), sans-serif" }}>
              &quot;Preserving Algerian heritage through community knowledge and technology.&quot;
            </p>

            <div className="flex gap-4 mt-2">
              <a href="#" className={mobileSocialIconClass} aria-label="X (Twitter)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="#" className={mobileSocialIconClass} aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              <a href="#" className={mobileSocialIconClass} aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
              </a>
              <a href="#" className={mobileSocialIconClass} aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>

          <hr className="border-[#e8d9c0]/10 mb-8" />

          {/* Mobile Links */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 mb-10">
            <div className="flex flex-col gap-4">
              <Link href="/about" className={mobileLinkClass}>About the Project</Link>
              <Link href="/#explore" className={mobileLinkClass}>Monuments</Link>
              <Link href="/#at-risk" className={mobileLinkClass}>Endangered Sites</Link>
              <Link href="/guidelines" className={mobileLinkClass}>Guidelines</Link>
            </div>
            <div className="flex flex-col gap-4">
              <Link href="/#events" className={mobileLinkClass}>Events</Link>
              <Link href="/login" className={mobileLinkClass}>Join the Community</Link>
              <Link href="/#groups" className={mobileLinkClass}>Groups</Link>
              <Link href="/legal" className={mobileLinkClass}>Legal</Link>
            </div>
          </div>

          <hr className="border-[#e8d9c0]/10 mb-8" />

          {/* Mobile Footer Bottom */}
          <div className="flex flex-col items-center gap-2 text-[13px] font-medium text-[#e8d9c0]/40">
            <p>© 2025 Kunuz. All rights reserved.</p>
            <p>Made with care in Algeria</p>
          </div>
        </div>
      </footer>

      {/* DESKTOP FOOTER - Original design */}
      <footer style={{ backgroundColor: "#3b2314" }} className="hidden sm:block text-[#e8d9c0] px-4 sm:px-6 md:px-12 py-8 md:py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
          {/* Logo + tagline + socials */}
          <div className="flex flex-col gap-3 md:gap-4 sm:col-span-2 lg:col-span-2 -mt-0 sm:-mt-10">
            <div className="flex items-start mb-2 md:mb-4">
              <img src="/kunuz-logo-light.svg" alt="Kunuz logo" className="w-[240px] sm:w-[280px] md:w-[320px] h-auto object-contain flex-shrink-0" />
            </div>

            <p className="text-[#e8d9c0] font-normal text-base sm:text-lg md:text-xl leading-snug -mt-2 md:-mt-6" style={{ fontFamily: "Aclonica, sans-serif" }}>
              &quot;Preserving Algerian heritage <br className="hidden sm:block"></br>through community knowledge and technology.&quot;
            </p>

            <div className="flex gap-3 md:gap-4 mt-2">
              <div className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="101%" height="100%" fill="#FFF8E2" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </div>
              <div className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="#FFF8E2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </div>
              <div className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="#FFF8E2" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
              </div>
              <div className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="#FFF8E2" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:gap-3 text-base sm:text-lg">
            <Link href="/about" className={desktopLinkClass}>About the Project</Link>
            <Link href="/#explore" className={desktopLinkClass}>Monuments</Link>
            <Link href="/#at-risk" className={desktopLinkClass}>Endangered Sites</Link>
          </div>

          <div className="flex flex-col gap-2 md:gap-3 text-base sm:text-lg">
            <Link href="/#events" className={desktopLinkClass}>Events</Link>
            <Link href="/login" className={desktopLinkClass}>Join the Community</Link>
            <Link href="/#groups" className={desktopLinkClass}>Groups</Link>
          </div>

          <div className="flex flex-col gap-2 md:gap-3 text-base sm:text-lg">
            <Link href="/guidelines" className={desktopLinkClass}>Guidelines</Link>
            <Link href="/legal" className={desktopLinkClass}>Legal</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
