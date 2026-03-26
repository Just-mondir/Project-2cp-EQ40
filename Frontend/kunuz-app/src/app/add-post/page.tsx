"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import ImageUploadPanel, { type ImageItem } from "@/components/ImageUploadPanel";
import PostForm from "@/components/PostForm";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const AUTH_TOKEN = process.env.NEXT_PUBLIC_TOKEN || "";

type PostFormValues = {
  title: string;
  description: string;
  location: string;
  postType: string;
  dangerLevel?: string | null;
  historicalPeriod: string;
  region: string;
  monumentType: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  visibility: string;
  groups: string[];
};

export default function AddPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);

  const handleCancel = () => router.back();

  const handleDone = async (formValues: PostFormValues) => {
    try {
      setSaving(true);

      const postTypeMap: Record<string, string> = {
        Question: "question",
        Visit: "visit",
        Discovery: "discovery",
        "In Danger": "alert",
        Event: "event",
      };

      const dangerLevelMap: Record<string, string> = {
        Low: "low",
        Medium: "medium",
        High: "high",
        Critical: "critical",
      };

      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("content", formValues.description);
      formData.append("location", formValues.location);
      formData.append(
        "post_type",
        postTypeMap[formValues.postType] ?? formValues.postType
      );

      if (formValues.historicalPeriod) {
        formData.append("historical_period", formValues.historicalPeriod);
      }

      if (formValues.region) {
        formData.append("region", formValues.region);
      }

      if (formValues.monumentType) {
        formData.append("monument_type", formValues.monumentType);
      }

      formData.append("visibility", formValues.visibility.toLowerCase());

      if (formValues.postType === "Event") {
        const toIso = (date?: string, time?: string) => {
          if (!date || !time) return null;
          return new Date(`${date}T${time}`).toISOString();
        };

        const startsAt = toIso(formValues.startDate, formValues.startTime);
        const endsAt = toIso(formValues.endDate, formValues.endTime);

        if (startsAt) {
          formData.append("starts_at", startsAt);
        }

        if (endsAt) {
          formData.append("ends_at", endsAt);
        }
      }

      if (formValues.postType === "In Danger" && formValues.dangerLevel) {
        formData.append(
          "urgence_level",
          dangerLevelMap[formValues.dangerLevel] ??
            formValues.dangerLevel.toLowerCase()
        );
      }

      images.forEach((img) => {
        if (!img.isRemote && img.file) {
          formData.append("uploaded_images", img.file);
        }
      });

      const res = await fetch(`${API_URL}/api/posts/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: formData,
      });

      const data = await res.json();
      console.log("POST status:", res.status);
      console.log("POST response:", data);

      if (!res.ok) {
        alert(JSON.stringify(data));
        return;
      }

      router.push("/profile");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#F7F5EF" }}
    >
      <LeftSidebar activePage="add-post" />

      <div className="flex flex-col flex-1 overflow-hidden ml-[68px]">
        <div className="px-8 pt-6 pb-2 flex-shrink-0">
          <BackButton />
        </div>

        <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6">
          <div className="w-[300px] flex flex-col flex-shrink-0 overflow-hidden post-panel-left">
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
                Add post
              </h1>

              {saving && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#8B6914",
                    marginTop: "6px",
                    fontFamily: "var(--font-lato), 'Lato', sans-serif",
                  }}
                >
                  Publishing...
                </p>
              )}
            </div>

            <div
              className="flex-1 overflow-hidden"
              style={{
                backgroundColor: "#F7F5EF",
                borderRadius: 0,
                marginTop: "43px",
              }}
            >
              <ImageUploadPanel
                initialImages={[]}
                onImagesChange={setImages}
              />
            </div>
          </div>

          <div
            className="flex-1 overflow-hidden flex flex-col post-panel-right post-form-panel"
            style={{
              backgroundColor: "#F7F5EF",
              borderRadius: 0,
              border: "1px solid rgba(0, 0, 0, 0.1)",
            }}
          >
            <PostForm
              onCancel={handleCancel}
              onDone={handleDone}
              isSubmitting={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}