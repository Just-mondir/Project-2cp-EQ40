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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "mask-icon", url: "/kunuz-icon.svg", color: "#1c1b19" },
    ],
  },
  manifest: "/site.webmanifest",
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
              let availableVoices = [];
              let voiceWarningTimer = null;
              const warnedVoiceLocales = new Set();
              const LABEL_COOLDOWN = 300; // ms - prevent rapid repeat

              function refreshVoices() {
                try {
                  availableVoices = window.speechSynthesis.getVoices() || [];
                } catch (e) {
                  availableVoices = [];
                }
              }

              function getCurrentLocale() {
                const locale =
                  document.documentElement.dataset.locale ||
                  localStorage.getItem('locale') ||
                  document.documentElement.lang ||
                  'en';

                if (locale.toLowerCase().startsWith('fr')) return 'fr';
                if (locale.toLowerCase().startsWith('ar')) return 'ar';
                return 'en';
              }

              function getSpeechLanguage(locale) {
                if (locale === 'fr') return 'fr-FR';
                if (locale === 'ar') return 'ar-SA';
                return 'en-US';
              }

              function getVoiceForLanguage(language) {
                const languagePrefix = language.split('-')[0].toLowerCase();
                if (!availableVoices.length) {
                  refreshVoices();
                }
                return (
                  availableVoices.find((voice) => voice.lang && voice.lang.toLowerCase() === language.toLowerCase()) ||
                  availableVoices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith(languagePrefix)) ||
                  null
                );
              }

              function getLanguageName(locale) {
                if (locale === 'fr') return 'French';
                if (locale === 'ar') return 'Arabic';
                return 'English';
              }

              function showVoiceWarning(locale) {
                if (!voiceWarning) return;
                if (warnedVoiceLocales.has(locale)) return;
                warnedVoiceLocales.add(locale);
                voiceWarning.textContent = 'No ' + getLanguageName(locale) + ' voice is installed in this browser. Using the default voice.';
                voiceWarning.hidden = false;
                window.clearTimeout(voiceWarningTimer);
                voiceWarningTimer = window.setTimeout(() => {
                  voiceWarning.hidden = true;
                }, 4500);
              }

              function normalizeReadableText(value) {
                return value ? value.replace(/\\s+/g, ' ').trim() : '';
              }

              function getDirectText(el) {
                const text = Array.from(el.childNodes)
                  .filter((node) => node.nodeType === Node.TEXT_NODE)
                  .map((node) => node.textContent || '')
                  .join(' ');
                return normalizeReadableText(text);
              }

              function isLargeContainer(el) {
                const tagName = el.tagName ? el.tagName.toLowerCase() : '';
                if (tagName === 'html' || tagName === 'body' || tagName === 'main') return true;
                if (tagName === 'section' || tagName === 'article' || tagName === 'aside' || tagName === 'nav' || tagName === 'footer' || tagName === 'header') return true;
                return el.children && el.children.length > 3;
              }

              function getInteractiveLabel(el) {
                if (!el || !el.closest) return null;
                const interactive = el.closest('button, a, [role="button"], [role="link"], [aria-label], [title], [data-sound-label]');
                if (!interactive || interactive === document.documentElement || interactive === document.body) return null;
                if (interactive.closest('#screen-reader-toggle-btn, #screen-reader-voice-warning')) return null;
                return getElementLabel(interactive);
              }

              // Extract text label from element with priority
              function getElementLabel(el) {
                if (!el || el === document.documentElement || el === document.body) return null;
                if (el.closest && el.closest('#screen-reader-toggle-btn, #screen-reader-voice-warning')) return null;

                const explicitLabel =
                  el.getAttribute('data-sound-label') ||
                  el.getAttribute('aria-label') ||
                  el.getAttribute('title') ||
                  el.getAttribute('alt') ||
                  el.getAttribute('placeholder');
                if (explicitLabel) return normalizeReadableText(explicitLabel);

                const tagName = el.tagName ? el.tagName.toLowerCase() : '';
                if (tagName === 'input' || tagName === 'textarea') {
                  return normalizeReadableText(el.value || el.placeholder || '');
                }

                const directText = getDirectText(el);
                if (directText) return directText;

                if (!isLargeContainer(el) && el.children && el.children.length <= 1) {
                  const nestedText = normalizeReadableText(el.innerText || el.textContent || '');
                  if (nestedText.length <= 220) return nestedText;
                }

                return null;
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
                  const currentLocale = getCurrentLocale();
                  const speechLanguage = getSpeechLanguage(currentLocale);
                  const voice = getVoiceForLanguage(speechLanguage);
                  utterance.lang = speechLanguage;
                  if (voice) {
                    utterance.voice = voice;
                  } else {
                    showVoiceWarning(currentLocale);
                  }
                  if (currentLocale === 'ar') {
                    utterance.dir = 'rtl';
                  }
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
                const interactiveLabel = getInteractiveLabel(target);
                if (interactiveLabel) {
                  speakLabel(interactiveLabel);
                  return;
                }

                let current = target;

                // Traverse only a little so hovering a card/page shell does not read the whole platform.
                for (let i = 0; i < 3; i++) {
                  if (!current) break;
                  if (isLargeContainer(current)) break;

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

              const voiceWarning = document.createElement('div');
              voiceWarning.id = 'screen-reader-voice-warning';
              voiceWarning.setAttribute('role', 'status');
              voiceWarning.setAttribute('aria-live', 'polite');
              voiceWarning.hidden = true;
              voiceWarning.style.position = 'fixed';
              voiceWarning.style.right = '24px';
              voiceWarning.style.bottom = '76px';
              voiceWarning.style.zIndex = '10002';
              voiceWarning.style.maxWidth = '280px';
              voiceWarning.style.padding = '8px 12px';
              voiceWarning.style.border = '1px solid rgba(161, 98, 7, 0.28)';
              voiceWarning.style.borderRadius = '12px';
              voiceWarning.style.background = 'rgba(255, 251, 234, 0.96)';
              voiceWarning.style.color = '#7a4b00';
              voiceWarning.style.fontSize = '12px';
              voiceWarning.style.fontFamily = 'system-ui, -apple-system, sans-serif';
              voiceWarning.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              document.body.appendChild(voiceWarning);

              refreshVoices();
              window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);

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
