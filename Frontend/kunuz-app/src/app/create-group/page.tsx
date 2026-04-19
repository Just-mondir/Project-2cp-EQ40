"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import GuildForm from "@/components/GroupForme";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function CreateGuildPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setGroupPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCoverPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => router.back();

  const handleDone = async (formData: any) => {
    try {
      setSaving(true);
      // 🔌 BACKEND INTEGRATION POINT
      // const res = await fetch(`${API_URL}/api/guilds/`, {
      //   method: "POST",
      //   headers: { Authorization: `Bearer ${token}` },
      //   body: formData,
      // });
      console.log("Guild data:", { ...formData, groupPhoto, coverPhoto });
      router.push("/communities");
    } catch (err) {
      console.error("Error creating guild:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
      <LeftSidebar activePage="create-group" />

      <div className="flex flex-col flex-1 overflow-hidden ml-[68px]">
        <div className="px-8 pt-6 pb-2 flex-shrink-0">
          <BackButton />
        </div>

        <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6">

          {/* ── Left panel ── */}
          <div className="w-[240px] flex flex-col flex-shrink-0 overflow-hidden">
            <div className="pb-4 flex-shrink-0" style={{ marginTop: "43px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-lato), 'Lato', sans-serif",
                  fontSize: "30px",
                  fontWeight: 700,
                  color: "#432817",
                  lineHeight: 1.2,
                }}
              >
                Create group
              </h1>
              {saving && (
                <p style={{ fontSize: "12px", color: "#8B6914", marginTop: "6px" }}>
                  Creating...
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
              {/* ── Cover photo — slim banner ── */}
              <div
                onClick={() => coverInputRef.current?.click()}
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
                    alt="Cover"
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
                      Cover photo
                    </span>
                  </div>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

              {/* ── Group photo — compact square with icon + label inside ── */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "210px",
                  height: "160px",         /* ← reduced from 276 px */
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
                    alt="Group"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                  />
                ) : (
                  <>
                    {/* Download arrow — same icon as before, smaller */}
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
                      Upload group photo
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
            <GuildForm onCancel={handleCancel} onDone={handleDone} />
          </div>

        </div>
      </div>
    </div>
  );
}
