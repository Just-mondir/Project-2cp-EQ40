"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import ConfirmActionModal from "@/components/ConfirmActionModal";

const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const SISAL = "#C4A882";

export interface User {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

// ADD this instead:
const API_URL = "http://127.0.0.1:8000";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : ""; }

async function searchUsers(query: string): Promise<User[]> {
  const url = `${API_URL}/api/groups/users/search/${query.trim() ? `?q=${encodeURIComponent(query)}` : ""}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    const results = data.data?.results ?? data.results ?? data.data ?? [];
    return (Array.isArray(results) ? results : []).map((u: any) => ({
      id: String(u.id), username: u.username ?? "",
      avatarUrl: u.profile_picture ? (u.profile_picture.startsWith("http") ? u.profile_picture : `${API_URL}${u.profile_picture}`) : null,
    })).filter((u) => u.username.trim() !== "");
  } catch { return []; }
}

function UserAvatar({ user, size = 40 }: { user: User; size?: number }) {
  if (user.avatarUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: SISAL,
        }}
      >
        <img
          src={user.avatarUrl}
          alt={user.username}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        backgroundColor: "#D9CFC3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#A89070"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

interface InviteUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (users: User[]) => Promise<void> | void;
  alreadyInvited?: string[];
  excludedUserIds?: string[];
}

export default function InviteUsersModal({
  isOpen,
  onClose,
  onConfirm,
  alreadyInvited = [],
  excludedUserIds = [],
}: InviteUsersModalProps) {
  const t = useTranslations("auth.inviteUsers");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(alreadyInvited));
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchUsers(search);
      const excluded = new Set(excludedUserIds.map((id) => String(id)));
      setResults(res.filter((user) => !excluded.has(user.id)));
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, isOpen, excludedUserIds]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    const confirmed = results.filter((u) => selected.has(u.id));
    if (confirmed.length === 0 || sending) return;
    setSending(true);
    try {
      await onConfirm(confirmed);
      setShowSuccessPopup(true);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.40)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: CREAM_PAGE,
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(67,40,23,0.22), 0 4px 16px rgba(0,0,0,0.12)",
          padding: "32px 28px 28px",
          width: "380px",
          maxWidth: "calc(100vw - 32px)",
          position: "relative",
          fontFamily: "var(--font-lato), 'Lato', sans-serif",
        }}
      >
        <button
          onClick={handleConfirm}
          title={t("confirmSelection")}
          disabled={sending}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            color: ESPRESSO,
            opacity: 0.7,
            transition: "opacity 0.15s",
            pointerEvents: sending ? "none" : "auto",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span style={{ fontSize: "10px", fontWeight: 500 }}>{t("send")}</span>
        </button>

        <h2
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontWeight: 700,
            fontSize: "22px",
            color: ESPRESSO,
            textAlign: "center",
            marginBottom: "24px",
            letterSpacing: "0.01em",
          }}
        >
          {t("title")}
        </h2>

        <p
          style={{
            fontSize: "13px",
            color: ESPRESSO,
            fontWeight: 500,
            marginBottom: "8px",
            opacity: 0.8,
          }}
        >
          {t("typeUsername")}
        </p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          placeholder={t("searchPlaceholder")}
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            border: `1px solid ${SISAL}`,
            borderRadius: "10px",
            color: ESPRESSO,
            fontFamily: "var(--font-lato), 'Lato', sans-serif",
            fontWeight: 400,
            outline: "none",
            padding: "10px 14px",
            fontSize: "14px",
            boxSizing: "border-box",
            marginBottom: "16px",
            transition: "box-shadow 0.15s",
          }}
          onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2.5px rgba(139,105,20,0.22)"; }}
          onBlur={(e) => { e.target.style.boxShadow = "none"; }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxHeight: "260px",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {loading ? (
            <p
              style={{
                textAlign: "center",
                color: ESPRESSO,
                opacity: 0.5,
                fontSize: "13px",
                padding: "16px 0",
              }}
            >
              {t("searching")}
            </p>
          ) : results.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: ESPRESSO,
                opacity: 0.5,
                fontSize: "13px",
                padding: "16px 0",
              }}
            >
              {t("noUsersFound")}
            </p>
          ) : (
            results.map((user) => {
              const isSelected = selected.has(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => toggle(user.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "40px",
                    padding: "8px 14px 8px 8px",
                    border: isSelected
                      ? `1.5px solid ${SISAL}`
                      : "1.5px solid transparent",
                    boxShadow: "0 1px 4px rgba(67,40,23,0.07)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <UserAvatar user={user} size={40} />
                    <span
                      style={{
                        color: ESPRESSO,
                        fontFamily: "var(--font-lato), 'Lato', sans-serif",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {user.username}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggle(user.id); }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    {isSelected ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={SISAL}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={ESPRESSO}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      <ConfirmActionModal
        isOpen={showSuccessPopup}
        title="Invitation sent"
        description="Invitation sent successfully."
        confirmText="Close"
        onConfirm={() => {
          setShowSuccessPopup(false);
          onClose();
        }}
        onCancel={() => {
          setShowSuccessPopup(false);
          onClose();
        }}
        variant="neutral"
        showCancelButton={false}
      />
    </div>
  );
}
