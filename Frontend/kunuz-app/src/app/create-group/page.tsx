"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import GroupForm from "@/components/GroupForm";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";

const API_URL = "http://127.0.0.1:8000";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

export default function CreateGroupPage() {
  const t = useTranslations("auth.pages.createGroup");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Keep the actual File objects for multipart upload
  const [groupPhotoFile, setGroupPhotoFile] = useState<File | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setGroupPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setCoverPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => router.back();

  const handleDone = async (formData: Record<string, unknown>) => {
  setError(null);
  setSaving(true);

  try {
    const token = getToken();

    // Step 1: Create group WITHOUT images
    const body = new FormData();
    body.append("name",              String(formData.groupName        ?? "").trim());
    body.append("description",       String(formData.description      ?? ""));
    body.append("category",          String(formData.category         ?? ""));
    body.append("region",            String(formData.region           ?? ""));
    body.append("historical_period", String(formData.historicalPeriod ?? ""));
    body.append("rules",             String(formData.rules            ?? ""));
    body.append("visibility",        String(formData.visibility       ?? "Public").toLowerCase());

    const res = await fetch(`${API_URL}/api/groups/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(JSON.stringify(data));
      return;
    }

    const groupId = data?.data?.id ?? data?.id;

    // Step 2: PATCH images separately if user selected them
    if (groupId && (groupPhotoFile || coverPhotoFile)) {
      const imageBody = new FormData();
      if (groupPhotoFile) imageBody.append("profile_picture", groupPhotoFile);
      if (coverPhotoFile) imageBody.append("banner_image",    coverPhotoFile);

      await fetch(`${API_URL}/api/groups/${groupId}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: imageBody,
      });
    }
    
    // Send invitations
const invitedUsers = formData.invitedUsers as { id: string }[] | undefined;
if (groupId && invitedUsers && invitedUsers.length > 0) {
  await Promise.allSettled(
    invitedUsers.map((u) =>
      fetch(`${API_URL}/api/groups/${groupId}/invite/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: u.id }),
      })
    )
  );
}
    // Navigate to the new group page
    if (groupId) {
      router.push(`/group/${groupId}`);
    } else {
      router.push("/communities");
    }
  } catch (err) {
    console.error("Error creating group:", err);
    setError("Network error. Please check your connection and try again.");
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="legacy-theme-page-shell flex h-screen overflow-hidden">
      <LeftSidebar activePage="create-group" />

      <div className="flex flex-col flex-1 overflow-hidden ml-[68px]">
        <div className="px-8 pt-6 pb-2 flex-shrink-0">
          <BackButton />
        </div>

        <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6">

          {/* ── Left panel ── */}
          <div className="w-[240px] flex flex-col flex-shrink-0 overflow-hidden post-panel-left">
            <div className="pb-4 flex-shrink-0" style={{ marginTop: "43px" }}>
              <h1
                className="post-page-title"
                style={{
                  fontFamily: "var(--font-lato), 'Lato', sans-serif",
                  fontSize: "30px",
                  fontWeight: 700,
                  color: "#432817",
                  lineHeight: 1.2,
                }}
              >
                {t("title")}
              </h1>
              {saving && (
                <p style={{ fontSize: "12px", color: "#8B6914", marginTop: "6px" }}>
                  {t("creating")}
                </p>
              )}
              {/* Inline error shown under the title — no layout change */}
              {error && (
                <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "6px", lineHeight: 1.4 }}>
                  {error}
                </p>
              )}
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {/* Cover photo slot */}
              <div
                onClick={() => coverInputRef.current?.click()}
                className="post-upload-slot"
                style={{
                  width: "210px",
                  height: "80px",
                  borderRadius: "10px",
                  border: "1px dashed #D6CFC3",
                  backgroundColor: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {coverPhoto ? (
                  <img
                    src={coverPhoto}
                    alt={t("coverAlt")}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                    <svg
                      width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke="#79747E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ color: "#79747E", fontSize: "11px", fontFamily: "Lato, sans-serif" }}>
                      {t("coverPhoto")}
                    </span>
                  </div>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

              {/* Group photo slot */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="post-upload-slot"
                style={{
                  width: "210px",
                  height: "160px",
                  borderRadius: "10px",
                  border: "1px dashed #D6CFC3",
                  backgroundColor: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  overflow: "hidden",
                  cursor: "pointer",
                  marginTop: "4px",
                  flexShrink: 0,
                }}
              >
                {groupPhoto ? (
                  <img
                    src={groupPhoto}
                    alt={t("groupAlt")}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                  />
                ) : (
                  <>
                    <svg
                      width="40" height="40" viewBox="0 0 24 24" fill="none"
                      stroke="#ADADAD" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <line x1="12" y1="3" x2="12" y2="15" />
                      <polyline points="7 10 12 15 17 10" />
                      <path d="M5 19 Q5 21 7 21 L17 21 Q19 21 19 19" />
                    </svg>
                    <span
                      style={{
                        color: "#79747E",
                        fontFamily: "var(--font-lato), 'Lato', sans-serif",
                        fontSize: "12px",
                        fontWeight: 400,
                        textAlign: "center",
                        lineHeight: 1.4,
                      }}
                    >
                      {t("uploadGroupPhoto")}
                    </span>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          </div>

          {/* ── Right panel ── */}
          <div
            className="flex-1 overflow-hidden flex flex-col post-panel-right post-form-panel"
            style={{
              backgroundColor: "#F7F5EF",
              borderRadius: 0,
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <GroupForm onCancel={handleCancel} onDone={handleDone} />
          </div>

        </div>
      </div>
    </div>
  );
}
