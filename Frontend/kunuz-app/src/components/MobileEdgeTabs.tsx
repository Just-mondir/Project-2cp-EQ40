"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sun, Moon, Globe, ChevronLeft, Eye } from "lucide-react";
import { useLocaleSettings } from "@/components/LocaleProvider";
import { isDarkThemeRoute, normalizeThemePathname } from "@/lib/themeRoutes";
import { type AppLocale } from "@/lib/i18n";

type ThemeMode = "light" | "dark";

export default function MobileEdgeTabs() {
    const [isOpen, setIsOpen] = useState(false);
    const [theme, setTheme] = useState<ThemeMode>("light");
    const [daltonism, setDaltonism] = useState<string>("off");
    const { locale, setLocale } = useLocaleSettings();
    const pathname = usePathname();

    const applyDaltonism = (mode: string) => {
        const root = document.documentElement;
        ["deuteranopia", "protanopia", "tritanopia"].forEach(m => {
            root.classList.remove(`daltonism-${m}`);
        });
        if (mode !== "off") {
            root.classList.add(`daltonism-${mode}`);
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const getTheme = () => (document.documentElement.dataset.theme as ThemeMode) || "light";
            setTheme(getTheme());

            const storedDaltonism = localStorage.getItem("daltonism-mode") || "off";
            setDaltonism(storedDaltonism);
            applyDaltonism(storedDaltonism);

            // Sync with other components via events and mutation observer
            const handleThemeUpdate = () => setTheme(getTheme());
            const handleDaltonismUpdate = () => {
                const stored = localStorage.getItem("daltonism-mode") || "off";
                setDaltonism(stored);
                applyDaltonism(stored);
            };

            window.addEventListener("theme-updated", handleThemeUpdate);
            window.addEventListener("daltonism-updated", handleDaltonismUpdate);
            // Also listen to storage for other tabs
            window.addEventListener("storage", (e) => {
                if (e.key === "theme-mode") handleThemeUpdate();
                if (e.key === "daltonism-mode") handleDaltonismUpdate();
            });

            const observer = new MutationObserver(() => setTheme(getTheme()));
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["data-theme"],
            });

            return () => {
                window.removeEventListener("theme-updated", handleThemeUpdate);
                window.removeEventListener("daltonism-updated", handleDaltonismUpdate);
                observer.disconnect();
            };
        }
    }, []);

    const toggleDaltonism = (e: React.MouseEvent) => {
        e.stopPropagation();
        const modes = ["off", "deuteranopia", "protanopia", "tritanopia"];
        const idx = modes.indexOf(daltonism);
        const next = modes[(idx + 1) % modes.length];
        setDaltonism(next);
        localStorage.setItem("daltonism-mode", next);
        applyDaltonism(next);
        window.dispatchEvent(new CustomEvent("daltonism-updated"));
    };

    const toggleTheme = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        localStorage.setItem("theme-mode", next);

        const norm = normalizeThemePathname(pathname || "/");
        const isHome = isDarkThemeRoute(norm);

        document.documentElement.dataset.theme = next;
        document.documentElement.dataset.themeScope = isHome ? "home" : "default";
        document.documentElement.style.colorScheme = isHome ? next : "light";
        window.dispatchEvent(new CustomEvent("theme-updated"));
    };

    const cycleLocale = (e: React.MouseEvent) => {
        e.stopPropagation();
        const locales: AppLocale[] = ["en", "fr", "ar"];
        const idx = locales.indexOf(locale);
        const next = locales[(idx + 1) % locales.length];
        setLocale(next);
    };

    return (
        <>
            <div className="md:hidden">
                <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[999] flex items-center">
                    {/* Visual Hint (Sliver) */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className={`absolute right-0 w-[6px] h-[80px] rounded-l-full transition-all duration-500 flex items-center justify-center shadow-md ${isOpen ? "opacity-0 translate-x-full" : "opacity-80 translate-x-0"
                            }`}
                        style={{
                            backgroundColor: "var(--foreground)",
                            color: "var(--background)"
                        }}
                        aria-label="Open settings"
                    >
                        <ChevronLeft size={6} stroke="currentColor" className="mr-0.5" />
                    </button>

                    {/* Sliding Action Tabs */}
                    <div
                        className={`flex flex-col gap-[6px] transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                            }`}
                    >
                        {/* Theme Toggle Tab */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-l-2xl shadow-2xl min-w-[120px] border-y border-l active:scale-95 transition-all"
                            style={{
                                backgroundColor: "var(--foreground)",
                                color: "var(--background)",
                                borderColor: "rgba(128, 128, 128, 0.1)"
                            }}
                        >
                            <div className="w-6 h-6 flex items-center justify-center opacity-90">
                                {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Theme</span>
                                <span className="text-xs font-bold">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                            </div>
                        </button>

                        {/* Language Cycle Tab */}
                        <button
                            onClick={cycleLocale}
                            className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-l-2xl shadow-2xl min-w-[120px] border-y border-l active:scale-95 transition-all"
                            style={{
                                backgroundColor: "var(--foreground)",
                                color: "var(--background)",
                                borderColor: "rgba(128, 128, 128, 0.1)"
                            }}
                        >
                            <div className="w-6 h-6 flex items-center justify-center opacity-90">
                                <Globe size={20} />
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Language</span>
                                <span className="text-xs font-bold">{locale.toUpperCase()}</span>
                            </div>
                        </button>

                        {/* Daltonism Tab */}
                        <button
                            onClick={toggleDaltonism}
                            className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-l-2xl shadow-2xl min-w-[120px] border-y border-l active:scale-95 transition-all"
                            style={{
                                backgroundColor: "var(--foreground)",
                                color: "var(--background)",
                                borderColor: "rgba(128, 128, 128, 0.1)"
                            }}
                        >
                            <div className="w-6 h-6 flex items-center justify-center opacity-90">
                                <Eye size={20} />
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Accessibility</span>
                                <span className="text-xs font-bold">
                                    {daltonism === "off" ? "Off" : daltonism.charAt(0).toUpperCase() + daltonism.slice(1)}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Backdrop for easy closing */}
                {isOpen && (
                    <div
                        className="fixed inset-0 z-[998] bg-black/5 backdrop-blur-[1px]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </div>
        </>
    );
}
