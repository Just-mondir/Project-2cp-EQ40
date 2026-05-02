import type { Metadata } from "next";
import { Lato, Aclonica, Playfair_Display } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import GoogleProvider from "@/components/GoogleProvider";
import AuthGate from "@/components/AuthGate";
import ReactQueryProvider from "@/components/ReactQueryProvider";
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
  const themeScopeResolverScript = `
    (function () {
      try {
        var stored = localStorage.getItem("theme-mode");
        var theme = stored === "dark" ? "dark" : "light";
        var daltonismMode = localStorage.getItem("daltonism-mode") || "off";
        var daltonismModes = ["deuteranopia", "protanopia", "tritanopia"];
        var pathname = window.location.pathname.replace(/\\/+$/, "") || "/";
        var publicRoutes = ${JSON.stringify(PUBLIC_ROUTE_LIST)};
        var lightOnlyPlatformRoutes = ${JSON.stringify(LIGHT_ONLY_PLATFORM_ROUTE_LIST)};
        var isHomeTheme =
          publicRoutes.indexOf(pathname) === -1 &&
          lightOnlyPlatformRoutes.indexOf(pathname) === -1;
        var canApplyDaltonism = publicRoutes.indexOf(pathname) === -1;
        document.documentElement.dataset.theme = theme;
        document.documentElement.dataset.themeScope = isHomeTheme ? "home" : "default";
        document.documentElement.style.colorScheme = isHomeTheme ? theme : "light";
        for (var i = 0; i < daltonismModes.length; i += 1) {
          document.documentElement.classList.remove("daltonism-" + daltonismModes[i]);
        }
        if (canApplyDaltonism && daltonismModes.indexOf(daltonismMode) !== -1) {
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
            __html: themeScopeResolverScript,
          }}
        />
      </head>
      <body
        className={`${lato.variable} ${aclonica.variable} ${playfair.variable} font-sans antialiased`}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          width="0"
          height="0"
          className="daltonism-filter-defs"
        >
          <defs>
            <filter id="filter-deuteranopia" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="0.367 0.861 -0.228 0 0 0.280 0.673 0.047 0 0 -0.012 0.043 0.926 0 0 0 0 0 1 0"
              />
            </filter>
            <filter id="filter-protanopia" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="0.152 1.053 -0.205 0 0 0.115 0.786 0.099 0 0 -0.004 -0.048 1.052 0 0 0 0 0 1 0"
              />
            </filter>
            <filter id="filter-tritanopia" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="1.256 -0.077 -0.179 0 0 -0.078 0.931 0.148 0 0 0.005 0.691 0.304 0 0 0 0 0 1 0"
              />
            </filter>
          </defs>
        </svg>
        <ReactQueryProvider>
          <GoogleProvider>
            <AuthGate>{children}</AuthGate>
          </GoogleProvider>
        </ReactQueryProvider>
        <Footer />
      </body>
    </html>
  );
}
