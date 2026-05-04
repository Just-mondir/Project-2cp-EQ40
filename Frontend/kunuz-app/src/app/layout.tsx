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

        // Dyslexia Mode Resolver
        if (localStorage.getItem("dyslexia_mode") === "1") {
          document.body.classList.add("dyslexia-mode");
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function () {
              const STORAGE_KEY = 'screen_reader_enabled';
              let isActive = false;
              let lastSpokenLabel = '';
              let lastSpokenTime = 0;
              const LABEL_COOLDOWN = 300; // ms - prevent rapid repeat

              // Extract text label from element with priority
              function getElementLabel(el) {
                const label = 
                  el.getAttribute('data-sound-label') ||
                  el.getAttribute('aria-label') ||
                  el.getAttribute('title') ||
                  el.getAttribute('alt') ||
                  (el.innerText && el.innerText.trim()) ||
                  el.getAttribute('placeholder');

                return label ? label.trim() : null;
              }

              // Speak label using SpeechSynthesis
              function speakLabel(label) {
                if (!label || !isActive) return;

                // Prevent rapid repeats of the same label
                const now = Date.now();
                if (label === lastSpokenLabel && now - lastSpokenTime < LABEL_COOLDOWN) {
                  return;
                }

                try {
                  // Cancel any ongoing speech
                  window.speechSynthesis.cancel();

                  // Create and configure utterance
                  const utterance = new SpeechSynthesisUtterance(label);
                  utterance.lang = 'en-US';
                  utterance.rate = 0.9;
                  utterance.pitch = 1;
                  utterance.volume = 1;

                  // Track spoken label and time
                  lastSpokenLabel = label;
                  lastSpokenTime = now;

                  // Speak
                  window.speechSynthesis.speak(utterance);
                } catch (e) {
                  console.log('Speech failed:', e);
                }
              }

              // Handle element hover - read any element with text/label
              function handleElementHover(e) {
                if (!isActive) return;

                const target = e.target;
                let current = target;

                // Traverse up to find readable element
                for (let i = 0; i < 5; i++) {
                  if (!current) break;

                  const label = getElementLabel(current);
                  if (label) {
                    speakLabel(label);
                    break;
                  }

                  current = current.parentElement;
                }
              }

              // Toggle screen reader mode
              function toggleMode(enabled) {
                isActive = enabled;
                btn.classList.toggle('active', enabled);
                document.getElementById('screen-reader-btn-label').textContent = enabled
                  ? 'Screen Reader ON'
                  : 'Screen Reader';
                localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');

                if (!enabled) {
                  window.speechSynthesis.cancel();
                  lastSpokenLabel = '';
                }
              }

              // Create floating toggle button
              const btn = document.createElement('button');
              btn.id = 'screen-reader-toggle-btn';
              btn.setAttribute('aria-label', 'Toggle screen reader');
              btn.innerHTML = \`
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                     stroke-width="1.5" stroke-linecap="round" style="flex-shrink:0">
                  <circle cx="8" cy="5" r="2"/>
                  <path d="M3 10c1-1 2.5-2 5-2s4 1 5 2"/>
                  <path d="M2 13c1.5-1.5 3.5-2.5 6-2.5s4.5 1 6 2.5"/>
                </svg>
                <span id="screen-reader-btn-label">Screen Reader</span>
              \`;
              document.body.appendChild(btn);

              // Button click handler - toggle mode
              btn.addEventListener('click', () => {
                toggleMode(!isActive);
              });

              // Hover detection for reading elements
              document.addEventListener('mouseover', handleElementHover, true);

              // Restore saved preference on load
              const saved = localStorage.getItem(STORAGE_KEY);
              if (saved === '1') {
                // Request user interaction before enabling speech
                const enableOnInteraction = () => {
                  toggleMode(true);
                  document.removeEventListener('click', enableOnInteraction);
                  document.removeEventListener('keydown', enableOnInteraction);
                };
                document.addEventListener('click', enableOnInteraction);
                document.addEventListener('keydown', enableOnInteraction);
              }
            })();
            `,
          }}
        />
      </body>
    </html>
  );
}
