import type { Metadata } from "next";
import { Lato, Aclonica, Playfair_Display } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import GoogleProvider from "@/components/GoogleProvider";
import AuthGate from "@/components/AuthGate";
import ThemeToggle from "@/components/ThemeToggle";

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
  title: "Kunuz — Discover the Soul of Algeria",
  description: "Kunuz connects generations through Algeria's rich cultural heritage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem("theme-mode");
                  var theme = stored === "dark" ? "dark" : "light";
                  var pathname = window.location.pathname;
                  var publicRoutes = ["/", "/landingpage", "/login", "/sign-up", "/verify-email", "/forgot-password"];
                  var isHomeTheme = publicRoutes.indexOf(pathname) === -1;
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.dataset.themeScope = isHomeTheme ? "home" : "default";
                  document.documentElement.style.colorScheme = isHomeTheme ? theme : "light";
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${lato.variable} ${aclonica.variable} ${playfair.variable} font-sans antialiased`}
      >
        <GoogleProvider>
          <AuthGate>
            <ThemeToggle />
            {children}
          </AuthGate>
        </GoogleProvider>
        <Footer />
      </body>
    </html>
  );
}

