"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import ImageUploadPanel, { type ImageItem } from "@/components/ImageUploadPanel";
import PostForm from "@/components/PostForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const AUTH_TOKEN = process.env.NEXT_PUBLIC_TOKEN || "";

type PostImage = {
  id: string;
  image: string;
  uploaded_at?: string;
};

type ApiPost = {
  id: string;
  title: string;
  content: string;
  post_type: string;
  location: string;
  region?: string;
  historical_period?: string;
  monument_type?: string;
  images: PostImage[];
  event_details?: {
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
  alert_details?: {
    urgence_level?: string | null;
    current_status?: string | null;
  } | null;
};

type PostFormValues = {
  title: string;
  description: string;
  location: string;
  postType: string;
  dangerLevel?: string | null;
  currentStatus?: string | null;
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

function EditPostInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("id");

  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/api/posts/${postId}/`, {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch post");
        }

        const data = await res.json();
        const realPost = data.data ?? data;
        setPost(realPost);
      } catch (err) {
        console.error("Error fetching post:", err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const initialValues: PostFormValues = useMemo(
  () =>
    post
      ? {
          title: post.title ?? "",
          description: post.content ?? "",
          location: post.location ?? "",
          postType:
            post.post_type === "event"
              ? "Event"
              : post.post_type === "alert"
              ? "In Danger"
              : post.post_type ?? "",
          historicalPeriod: post.historical_period ?? "",
          region: post.region ?? "",
          monumentType: post.monument_type ?? "",
          visibility: "Public",
          groups: [],
          dangerLevel: post.alert_details?.urgence_level
            ? post.alert_details.urgence_level.charAt(0).toUpperCase() +
              post.alert_details.urgence_level.slice(1)
            : null,
          currentStatus: post.alert_details?.current_status
            ? post.alert_details.current_status
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : null,
          startDate: post.event_details?.starts_at?.slice(0, 10) ?? "",
          startTime: post.event_details?.starts_at?.slice(11, 16) ?? "",
          endDate: post.event_details?.ends_at?.slice(0, 10) ?? "",
          endTime: post.event_details?.ends_at?.slice(11, 16) ?? "",
        }
      : {
          title: "",
          description: "",
          location: "",
          postType: "",
          historicalPeriod: "",
          region: "",
          monumentType: "",
          visibility: "Public",
          groups: [],
          dangerLevel: null,
          currentStatus: null,
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: "",
        },
  [post]
  );

  const initialImages: ImageItem[] = post
    ? (post.images ?? []).map((img) => ({
      id: img.id,
      url: img.image.startsWith("/media/")
        ? `${API_URL}${img.image}`
        : img.image,
      name: post.title,
      isRemote: true,
    }))
    : [];

  useEffect(() => {
    setImages(initialImages);
  }, [post]);

  const handleCancel = () => router.back();

  const handleDone = async (formValues: PostFormValues) => {
    if (!postId) return;

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
      const currentStatusMap: Record<string, string> = {
        Destroyed: "destroyed",
        "Under intervention": "under_intervention",
        Restored: "restored",
        Alert: "alert",
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

      const toIso = (date?: string, time?: string) => {
        if (!date || !time) return null;
        return new Date(`${date}T${time}`).toISOString();
      };

      if (formValues.postType === "Event") {
        const startsAt = toIso(formValues.startDate, formValues.startTime);
        const endsAt = toIso(formValues.endDate, formValues.endTime);
        if (startsAt) formData.append("starts_at", startsAt);
        if (endsAt) formData.append("ends_at", endsAt);
      }

      if (formValues.postType === "In Danger") {
        if (formValues.dangerLevel) {
          formData.append(
            "urgence_level",
            dangerLevelMap[formValues.dangerLevel] ??
              formValues.dangerLevel.toLowerCase()
          );
        }
        if (formValues.currentStatus) {
          formData.append(
            "current_status",
            currentStatusMap[formValues.currentStatus] ??
              formValues.currentStatus.toLowerCase().replace(/\s+/g, "_")
          );
        }
      }


      images.forEach((img) => {
        if (!img.isRemote && img.file) {
          formData.append("uploaded_images", img.file);
        }
      });

      const res = await fetch(`${API_URL}/api/posts/${postId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: formData,
      });

      const data = await res.json();
      console.log("PATCH status:", res.status);
      console.log("PATCH response:", data);

      if (!res.ok) {
        alert(JSON.stringify(data));
        return;
      }

      router.push("/profile");
    } catch (err) {
      console.error("Error updating post:", err);
      alert("Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: "#F7F5EF" }}
      >
        <p style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: "#F7F5EF" }}
      >
        <p style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>
          Post not found
        </p>
      </div>
    );
  }

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
                Edit post
              </h1>

              <p
                style={{
                  fontSize: "12px",
                  color: "#8B7355",
                  marginTop: "4px",
                  fontFamily: "var(--font-lato), 'Lato', sans-serif",
                }}
              >
                Editing: <span style={{ fontStyle: "italic" }}>{post.title}</span>
              </p>

              {saving && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#8B6914",
                    marginTop: "6px",
                    fontFamily: "var(--font-lato), 'Lato', sans-serif",
                  }}
                >
                  Saving changes...
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
                initialImages={initialImages}
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
              initialValues={initialValues}
              isSubmitting={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditPostPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex h-screen items-center justify-center"
          style={{ backgroundColor: "#F7F5EF" }}
        >
          <p style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>
            Loading...
          </p>
        </div>
      }
    >
      <EditPostInner />
    </Suspense>
  );
}