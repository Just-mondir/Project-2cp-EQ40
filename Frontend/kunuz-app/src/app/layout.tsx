import type { Metadata } from "next";
import { Lato, Aclonica, Playfair_Display } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import GoogleProvider from "@/components/GoogleProvider";
import AuthGate from "@/components/AuthGate";
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
        var pathname = window.location.pathname.replace(/\\/+$/, "") || "/";
        var publicRoutes = ${JSON.stringify(PUBLIC_ROUTE_LIST)};
        var lightOnlyPlatformRoutes = ${JSON.stringify(LIGHT_ONLY_PLATFORM_ROUTE_LIST)};
        var isHomeTheme =
          publicRoutes.indexOf(pathname) === -1 &&
          lightOnlyPlatformRoutes.indexOf(pathname) === -1;
        document.documentElement.dataset.theme = theme;
        document.documentElement.dataset.themeScope = isHomeTheme ? "home" : "default";
        document.documentElement.style.colorScheme = isHomeTheme ? theme : "light";
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
        <GoogleProvider>
          <AuthGate>{children}</AuthGate>
        </GoogleProvider>
        <Footer />
      </body>
    </html>
  );
}
