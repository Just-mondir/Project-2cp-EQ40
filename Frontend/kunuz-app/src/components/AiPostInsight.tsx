"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

const API_URL = "http://127.0.0.1:8000";

type AiInsightSource = {
  title: string;
  uri: string;
};

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function AiInsightIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="7" width="14" height="12" rx="3" />
      <path d="M12 3v4" />
      <path d="M8.5 3h7" />
      <path d="M9 13h.01" />
      <path d="M15 13h.01" />
      <path d="M10 17h4" />
      <path d="M3 11v4" />
      <path d="M21 11v4" />
    </svg>
  );
}

export default function AiPostInsight({
  postId,
  title,
  buttonClassName = "flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--accent-gold)] cursor-pointer",
  buttonStyle,
}: {
  postId: string;
  title: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}) {
  const t = useTranslations("auth.aiResearch");
  const [open, setOpen] = useState(false);
  const [insight, setInsight] = useState("");
  const [sources, setSources] = useState<AiInsightSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
    setError("");

    if (insight) return;

    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/posts/${postId}/ai-insight/`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || t("error"));

      setInsight(String(data?.data?.insight ?? ""));
      setSources(Array.isArray(data?.data?.sources) ? data.data.sources : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  const modal = open && typeof document !== "undefined"
    ? createPortal(
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6"
        style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
        onClick={(e) => { e.stopPropagation(); setOpen(false); }}
      >
        <div
          className="flex w-[min(92vw,864px)] h-[min(82vh,760px)] flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-4 border-b px-6 py-4" style={{ borderColor: "var(--border-soft)" }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: "#8B6914" }}>
                <AiInsightIcon size={16} />
                {t("title")}
              </div>
              <h3 className="mt-1 truncate text-lg font-bold" style={{ color: "var(--foreground)" }}>
                {stripHtml(title)}
              </h3>
            </div>
            <button
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              style={{ color: "var(--foreground)" }}
              onClick={() => setOpen(false)}
              aria-label={t("closeLabel")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto feed-scroll px-6 py-5">
            {loading ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--border-soft)", borderTopColor: "#8B6914" }} />
                {t("loading")}
              </div>
            ) : error ? (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FDE8E8", color: "#8B1E1E" }}>
                {error}
              </div>
            ) : (
              <>
                <div className="text-[15px] leading-7" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                  {insight}
                </div>
                {sources.length > 0 && (
                  <div className="mt-6 rounded-xl px-4 py-3" style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-soft)" }}>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "#8B6914" }}>{t("sources")}</h4>
                    <div className="flex flex-col gap-2">
                      {sources.map((source, index) => (
                        <a key={`${source.uri}-${index}`} href={source.uri} target="_blank" rel="noreferrer" className="text-sm font-semibold underline-offset-2 hover:underline" style={{ color: "var(--foreground)", overflowWrap: "anywhere" }}>
                          {index + 1}. {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <>
      <button
        className={buttonClassName}
        style={{ color: open ? "#8B6914" : "var(--foreground)", ...buttonStyle }}
        onClick={handleClick}
        title={t("buttonTitle")}
        aria-label={t("buttonLabel")}
      >
        <AiInsightIcon />
        <span>AI</span>
      </button>
      {modal}
    </>
  );
}
