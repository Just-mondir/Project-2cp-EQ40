import type { Metadata } from "next";
import { Lato, Aclonica, Playfair_Display } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import GoogleProvider from "@/components/GoogleProvider";
import AuthGate from "@/components/AuthGate";

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
    <html lang="en">
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

