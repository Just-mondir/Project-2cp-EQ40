"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import GroupdForm from "@/components/GroupForm";
import { useRouter, useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateGuildPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = typeof params?.groupId === "string" ? params.groupId : "";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // ← ADDED: loading state so form only mounts after data is fetched
  const [loading, setLoading] = useState(true);

  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [groupPhotoFile, setGroupPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [initialValues, setInitialValues] = useState({});

  useEffect(() => {
    if (!groupId) return;
    const fetchGroup = async () => {
      try {
        const res = await fetch(`${API_URL}/api/groups/${groupId}/`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data ?? json;

        // ← Pre-fill form with existing group values
        setInitialValues({
          groupName:        data.name ?? "",
          description:      data.description ?? "",
          historicalPeriod: data.historical_period ?? "",
          region:           data.region ?? "",
          category:         data.category ?? "",
          rules:            data.rules ?? "",
        });

        if (data.profile_picture) setGroupPhoto(data.profile_picture);
        if (data.banner_image)    setCoverPhoto(data.banner_image);
      } catch (err) {
        console.error("Error fetching group:", err);
      } finally {
        // ← ADDED: only show form after data is ready
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

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

  const handleDone = async (formData: any) => {
    setError("");
    try {
      setSaving(true);
      const token = getAuthToken();

      let profilePictureBase64 = "";
      let bannerImageBase64 = "";
      if (groupPhotoFile) profilePictureBase64 = await fileToBase64(groupPhotoFile);
      if (coverPhotoFile)  bannerImageBase64    = await fileToBase64(coverPhotoFile);

      // ← FIXED: only include fields that have values (partial update)
      const payload: Record<string, string> = {};

      if (formData.groupName)   payload.name        = formData.groupName;
      if (formData.category)    payload.category     = formData.category;
      if (formData.description) payload.description  = formData.description;
      if (formData.rules)       payload.rules        = formData.rules;

      if (formData.historicalPeriod) payload.historical_period = formData.historicalPeriod;
      if (formData.region)           payload.region             = formData.region;

      if (profilePictureBase64) payload.profile_picture = profilePictureBase64;
      if (bannerImageBase64)    payload.banner_image     = bannerImageBase64;

      // ← BACKEND: PATCH /api/groups/{groupId}/ — partial update
      const res = await fetch(`${API_URL}/api/groups/${groupId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.errors?.name?.[0] ||
          data?.errors?.category?.[0] ||
          data?.errors?.description?.[0] ||
          data?.message ||
          "Failed to update group.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }
      // Send invitations
const invitedUsers = formData.invitedUsers as { id: string }[] | undefined;
if (invitedUsers && invitedUsers.length > 0) {
  await Promise.allSettled(
    invitedUsers.map((u) =>
      fetch(`${API_URL}/api/groups/${groupId}/invite/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: u.id }),
      })
    )
  );
}
     router.push(groupId ? `/group/${groupId}` : "/communities");
    } catch (err) {
      console.error("Error updating guild:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F7F5EF" }}>
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
                Edit group
              </h1>
              {saving && (
                <p style={{ fontSize: "12px", color: "#8B6914", marginTop: "6px" }}>
                  Saving...
                </p>
              )}
              {error && (
                <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "6px", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
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
              {/* ── Cover photo ── */}
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

              {/* ── Group photo ── */}
              <div
                onClick={() => fileInputRef.current?.click()}
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
                    alt="Group"
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
            {/* ← FIXED: wait for data before rendering form so fields are pre-filled */}
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                <p style={{ color: "#8B7355", fontFamily: "var(--font-lato)", fontSize: "14px" }}>Loading...</p>
              </div>
            ) : (
              <GroupdForm
                onCancel={handleCancel}
                onDone={handleDone}
                initialValues={initialValues}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
