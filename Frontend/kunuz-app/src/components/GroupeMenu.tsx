"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

// ── Backdrop ──
function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 100 }}
    />
  );
}

// ── Confirm delete modal ──
function DeleteConfirmModal({
  groupName,
  onConfirm,
  onCancel,
  deleting,
}: {
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <>
      <Backdrop onClick={onCancel} />
      <div style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#FFF8E2",
            borderRadius: "20px",
            padding: "36px 32px 28px",
            width: "400px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Icon */}
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            border: "1.5px solid #C0392B",
            backgroundColor: "rgba(192,57,43,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "16px",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </div>

          <p style={{ margin: "0 0 6px", color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "22px", textAlign: "center" }}>
            Delete Group
          </p>
          <p style={{ margin: "0 0 24px", color: "#8B7355", fontFamily: "'Lato', sans-serif", fontWeight: 400, fontSize: "14px", textAlign: "center", lineHeight: 1.5 }}>
            Are you sure you want to delete <strong>{groupName}</strong>? This action cannot be undone.
          </p>

          {/* Delete button */}
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              width: "100%", height: "50px", borderRadius: "10px", border: "none",
              backgroundColor: "#C0392B", color: "#FFFFFF",
              fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "16px",
              cursor: deleting ? "not-allowed" : "pointer",
              opacity: deleting ? 0.6 : 1,
              transition: "background 0.18s", marginTop: "6px",
            }}
            onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.backgroundColor = "#a93226"; }}
            onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.backgroundColor = "#C0392B"; }}
          >
            {deleting ? "Deleting..." : "Yes, delete group"}
          </button>

          {/* Cancel */}
          <button
            onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#432817", fontFamily: "'Lato', sans-serif", fontWeight: 600, fontSize: "15px", marginTop: "12px", opacity: 0.75 }}
          >
            Cancel
          </button>
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Main component ──
export default function GroupOptionsMenu({
  groupId,
  groupName,
  isAdmin,
  isMember,
}: {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  isMember: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      label: "Edit group",
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
      label: "Delete group",
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
      label: "About",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      onClick: () => { setOpen(false); router.push(`/group/${groupId}?tab=about`); },
      danger: false,
    },
    {
      label: "Members",
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
      label: "About",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      onClick: () => { setOpen(false); router.push(`/group/${groupId}?tab=about`); },
      danger: false,
    },
    {
      label: "Members",
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
      label: "Report group",
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
      label: "Leave group",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
      onClick: async () => {
        setOpen(false);
        const token = getToken();
        await fetch(`${API_URL}/api/groups/${groupId}/leave/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        router.push("/communities");
      },
      danger: true,
    },
  ];

  const visitorItems = [
  {
    label: "Members",
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
    label: "Report group",
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

const items = isAdmin ? adminItems : isMember ? memberItems : visitorItems;

  return (
    <>
      <div ref={menuRef} style={{ position: "relative" }}>
        {/* 3-dots trigger button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 rounded-lg hover:bg-[var(--panel-hover)] transition-colors"
          style={{ color: "#432817" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        
          {/* Dropdown menu */}
{open && (
  <div className="absolute right-0 top-full mt-1 py-2 rounded-lg shadow-lg z-50" style={{ backgroundColor: "#FFF8E2" }}>
    {items.map((item, i) => (
      <button
        key={i}
        onClick={item.onClick}
        className="block w-full text-left px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors hover:bg-[#F0EAD8]"
        style={{ color: "#432817", fontFamily: "'Lato', sans-serif" }}
      >
        {item.label}
      </button>
    ))}
  </div>
)}
</div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          groupName={groupName}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          deleting={deleting}
        />
      )}

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.88) translateY(-4px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
