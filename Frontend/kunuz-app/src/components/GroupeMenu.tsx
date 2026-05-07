"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LeaveGroupModal from "@/components/LeaveGroupeModal";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import { useTranslations } from "next-intl";

const API_URL = "http://127.0.0.1:8000";



function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}


// ── Main component ──
export default function GroupOptionsMenu({
  groupId,
  groupName,
  isAdmin,
  isMember,
  isModerator,
}: {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  isMember: boolean;
  isModerator?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("auth.pages.home");
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const handleLeaveGroup = async () => {
    setLeaving(true);
    const token = getToken();
    try {
      await fetch(`${API_URL}/api/groups/${groupId}/leave/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/communities");
    } catch (e) {
      console.error("❌ Error leaving group:", e);
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  };


  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    const token = getToken();
    console.log("🔴 Deleting group:", groupId);
    console.log("🔑 Token:", token ? "exists" : "MISSING");
    try {
      const res = await fetch(`${API_URL}/api/groups/${groupId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📡 Response status:", res.status);
      const data = await res.json().catch(() => null);
      console.log("📡 Response data:", data);
      if (res.ok || res.status === 204) {
        router.push("/communities");
      }
    } catch (e) {
      console.error("❌ Error:", e);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ── Menu items based on role ──
  const adminItems = [
    {
      label: t("community.editGroup"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      onClick: () => { setOpen(false); router.push(`/group/${groupId}/edit`); },
      danger: false,
    },
    {
      label: t("community.deleteGroup"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" /><path d="M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      ),
      onClick: () => { setOpen(false); setShowDeleteConfirm(true); },
      danger: true,
    },
    {
      label: t("community.tabs.about"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      onClick: () => { setOpen(false); router.push(`/group/${groupId}/about`); },
      danger: false,
    },
    {
      label: t("community.membersTitle"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      onClick: () => { setOpen(false); router.push(`/group/${groupId}/members`); },
      danger: false,
    },
  ];

  const memberItems = [
    {
      label: t("community.tabs.about"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      onClick: () => { setOpen(false); router.push(`/group/${groupId}/about`); },
      danger: false,
    },
    {
      label: t("community.membersTitle"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      onClick: () => { setOpen(false); router.push(`/group/${groupId}/members`); },
      danger: false,
    },
    {
      label: t("community.reportGroup"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      onClick: () => { setOpen(false); },
      danger: false,
    },
    {
      label: t("community.leaveGroup"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
      onClick: () => {
        setOpen(false);
        setShowLeaveModal(true);
      },
      danger: true,
    },
  ];

  const visitorItems = [
    {
      label: t("community.membersTitle"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      onClick: () => { setOpen(false); router.push(`/group/${groupId}/members`); },
      danger: false,
    },
    {
      label: t("community.reportGroup"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      onClick: () => { setOpen(false); },
      danger: false,
    },
  ];

  const items = (isAdmin || isModerator) ? adminItems : isMember ? memberItems : visitorItems;

  return (
    <>
      <div ref={menuRef} style={{ position: "relative" }}>
        {/* 3-dots trigger button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--foreground)", backgroundColor: "transparent" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--panel-hover)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {open && (
          <div className="absolute right-0 top-full mt-1 py-2 rounded-lg shadow-lg z-50" style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-soft)" }}>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[var(--panel-hover)]"
                style={{ color: item.danger ? "#C0392B" : "var(--foreground)", fontFamily: "'Lato', sans-serif" }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {showLeaveModal && (
        <LeaveGroupModal
          groupName={groupName}
          onConfirm={handleLeaveGroup}
          onClose={() => !leaving && setShowLeaveModal(false)}
          leaving={leaving}
        />
      )}
      {/* Delete confirmation modal */}
      <ConfirmActionModal
        isOpen={showDeleteConfirm}
        title={t("community.deleteGroupTitle")}
        description={t("community.deleteGroupMessage", { groupName })}
        confirmText={deleting ? t("community.deletingGroup") : t("community.deleteGroupConfirm")}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
        variant="danger"
        isBusy={deleting}
        cancelText={t("community.close")}
      />

    </>
  );
}
