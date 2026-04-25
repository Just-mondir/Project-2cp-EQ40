"use client";

import { useState } from "react";
import PostForm from "@/components/PostForm";
import ImageUploadPanel, { type ImageItem } from "@/components/ImageUploadPanel";

const API_URL = "http://127.0.0.1:8000";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

export default function GroupAddPostModal({
  groupId,
  groupName,
  onClose,
  onSuccess,
}: {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);

  const handleDone = async (formValues: any) => {
    setSaving(true);
    try {
      const postTypeMap: Record<string, string> = {
        Question: "question",
        Visit: "visit",
        Discovery: "discovery",
        "In Danger": "alert",
        Event: "event",
      };
      const dangerLevelMap: Record<string, string> = {
        Low: "low", Medium: "medium", High: "high", Critical: "critical",
      };

      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("content", formValues.description || "");
      formData.append("location", formValues.location);
      formData.append("post_type", postTypeMap[formValues.postType] ?? formValues.postType);
      formData.append("group_id", groupId);
      formData.append("visibility", "groups");

      if (formValues.historicalPeriod) formData.append("historical_period", formValues.historicalPeriod);
      if (formValues.region) formData.append("region", formValues.region);
      if (formValues.monumentType) formData.append("monument_type", formValues.monumentType);

      if (formValues.postType === "Event") {
        if (formValues.startTime) formData.append("starts_at", new Date(formValues.startTime).toISOString());
        if (formValues.endTime) formData.append("ends_at", new Date(formValues.endTime).toISOString());
      }
      if (formValues.postType === "In Danger" && formValues.dangerLevel) {
        formData.append("urgence_level", dangerLevelMap[formValues.dangerLevel] ?? formValues.dangerLevel.toLowerCase());
      }

      images.forEach((img) => {
        if (!img.isRemote && img.file) formData.append("uploaded_images", img.file);
      });

      const res = await fetch(`${API_URL}/api/posts/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (res.ok) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#F7F5EF] rounded-2xl overflow-hidden flex"
          style={{ width: "900px", maxWidth: "95vw", height: "85vh", boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}
        >
          {/* Left — image upload */}
          <div className="w-[260px] flex-shrink-0 border-r border-[rgba(0,0,0,0.1)] flex flex-col">
            <div className="px-6 pt-6 pb-4">
              <h2 style={{ fontFamily: "var(--font-lato), 'Lato', sans-serif", fontSize: 22, fontWeight: 700, color: "#432817" }}>
                Post in
              </h2>
              <p style={{ fontSize: 14, color: "#8B7355", marginTop: 4 }}>{groupName}</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <ImageUploadPanel initialImages={[]} onImagesChange={setImages} />
            </div>
          </div>

          {/* Right — post form */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <PostForm
  onCancel={onClose}
  onDone={handleDone}
  isSubmitting={saving}
  hidePostType={false}
  hideVisibility={true}  // ← ADD THIS
/>
          </div>
        </div>
      </div>
    </>
  );
}