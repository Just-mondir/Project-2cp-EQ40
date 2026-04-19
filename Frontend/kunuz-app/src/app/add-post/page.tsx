"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import ImageUploadPanel, { type ImageItem } from "@/components/ImageUploadPanel";
import PostForm from "@/components/PostForm";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken") || "";
  }
  return "";
};

type PostFormValues = {
  title: string;
  description: string;
  location: string;
  postType: string;
  dangerLevel?: string | null;
  historicalPeriod: string;
  region: string;
  monumentType?: string | null;
  visibility: string;
  groups: string[];
  startTime?: string | null;
  endTime?: string | null;
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
      formData.append("content", formValues.description || "");
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
        if (formValues.startTime) {
          formData.append("starts_at", new Date(formValues.startTime).toISOString());
        } else {
          formData.append("starts_at", new Date().toISOString());
        }
        if (formValues.endTime) {
          formData.append("ends_at", new Date(formValues.endTime).toISOString());
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
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(JSON.stringify(data));
        return;
      }

      const meRes = await fetch(`${API_URL}/api/users/me/`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const me = await meRes.json();
      router.push(`/user/${me.data?.username ?? me.username}`);
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
      style={{ backgroundColor: "var(--background)" }}
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
