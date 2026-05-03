import type { Metadata } from "next";
import { Lato, Aclonica, Playfair_Display } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import GoogleProvider from "@/components/GoogleProvider";
import AuthGate from "@/components/AuthGate";
import ReactQueryProvider from "@/components/ReactQueryProvider";
import LocaleProvider from "@/components/LocaleProvider";
import {
  LIGHT_ONLY_PLATFORM_ROUTE_LIST,
  PUBLIC_ROUTE_LIST,
} from "@/lib/themeRoutes";

const lato = Lato({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-lato",
});

const aclonica = Aclonica({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-aclonica",
});

const playfair = Playfair_Display({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-brand",
});

export const metadata: Metadata = {
  title: "Kunuz - Discover the Soul of Algeria",
  description: "Kunuz connects generations through Algeria's rich cultural heritage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const combinedResolverScript = `
    (function () {
      try {
        // Theme Resolver
        var storedTheme = localStorage.getItem("theme-mode");
        var theme = storedTheme === "dark" ? "dark" : "light";
        var pathname = window.location.pathname.replace(/\\/+$/, "") || "/";
        var publicRoutes = ${JSON.stringify(PUBLIC_ROUTE_LIST)};
        var lightOnlyPlatformRoutes = ${JSON.stringify(LIGHT_ONLY_PLATFORM_ROUTE_LIST)};
        var isHomeTheme =
          publicRoutes.indexOf(pathname) === -1 &&
          lightOnlyPlatformRoutes.indexOf(pathname) === -1;
        document.documentElement.dataset.theme = theme;
        document.documentElement.dataset.themeScope = isHomeTheme ? "home" : "default";
        document.documentElement.style.colorScheme = isHomeTheme ? theme : "light";

        // Daltonism Resolver
        var daltonismMode = localStorage.getItem("daltonism-mode") || "off";
        if (daltonismMode !== "off") {
          document.documentElement.classList.add("daltonism-" + daltonismMode);
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: combinedResolverScript,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
          /* Apply filter to body when daltonism class is on html */
          .daltonism-deuteranopia body { filter: url(#filter-deuteranopia) !important; -webkit-filter: url(#filter-deuteranopia) !important; }
          .daltonism-protanopia body { filter: url(#filter-protanopia) !important; -webkit-filter: url(#filter-protanopia) !important; }
          .daltonism-tritanopia body { filter: url(#filter-tritanopia) !important; -webkit-filter: url(#filter-tritanopia) !important; }
          
          /* Ensure the SVG defs don't cause layout issues but are still "rendered" */
          .daltonism-filter-defs {
            position: absolute;
            width: 1px;
            height: 1px;
            opacity: 0;
            pointer-events: none;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
          }
        `}} />
      </head>
      <body
        className={`${lato.variable} ${aclonica.variable} ${playfair.variable} font-sans antialiased`}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          className="daltonism-filter-defs"
        >
          <defs>
            <filter id="filter-deuteranopia">
              <feColorMatrix
                type="matrix"
                values="0.367 0.861 -0.228 0 0 0.280 0.673 0.047 0 0 -0.012 0.043 0.926 0 0 0 0 0 1 0"
              />
            </filter>
            <filter id="filter-protanopia">
              <feColorMatrix
                type="matrix"
                values="0.152 1.053 -0.205 0 0 0.115 0.786 0.099 0 0 -0.004 -0.048 1.052 0 0 0 0 0 1 0"
              />
            </filter>
            <filter id="filter-tritanopia">
              <feColorMatrix
                type="matrix"
                values="1.256 -0.077 -0.179 0 0 -0.078 0.931 0.148 0 0 0.005 0.691 0.304 0 0 0 0 0 1 0"
              />
            </filter>
          </defs>
        </svg>
        <ReactQueryProvider>
          <LocaleProvider>
            <GoogleProvider>
              <AuthGate>{children}</AuthGate>
            </GoogleProvider>
          </LocaleProvider>
        </ReactQueryProvider>
        <Footer />
      </body>
    </html>
  );
}
