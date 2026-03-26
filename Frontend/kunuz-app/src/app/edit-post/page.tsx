"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import ImageUploadPanel, { type ImageItem } from "@/components/ImageUploadPanel";
import PostForm from "@/components/PostForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken") || process.env.NEXT_PUBLIC_TOKEN || "";
  }
  return process.env.NEXT_PUBLIC_TOKEN || "";
};

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
  monumentType?: string | null;
  visibility: string;
  groups: string[];
  startTime?: string | null;
  endTime?: string | null;
};

const toLocalDatetimeInput = (isoString?: string | null) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

        const token = getAuthToken();
        if (!token) {
          throw new Error("No token available");
        }

        const res = await fetch(`${API_URL}/api/posts/${postId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
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

  const initialValues: PostFormValues = useMemo(() => {
    if (!post) {
      return {
        title: "",
        description: "",
        location: "",
        postType: "",
        historicalPeriod: "",
        region: "",
        visibility: "Public",
        groups: [],
        dangerLevel: null,
        currentStatus: null,
        monumentType: null,
        startTime: "",
        endTime: "",
      };
    }

    // @ts-ignore
    const eventDetails = post.event_details || {};
    // @ts-ignore
    const alertDetails = post.alert_details || {};

    return {
      title: post.title ?? "",
      description: post.content ?? "",
      location: post.location ?? "",
      postType: post.post_type ?? "",
      historicalPeriod: post.historical_period ?? "",
      region: post.region ?? "",
      visibility: "Public",
      groups: [],
      dangerLevel: alertDetails.urgence_level ?? null,
      currentStatus: alertDetails.current_status ?? null,
      monumentType: post.monument_type ?? null,
      startTime: toLocalDatetimeInput(eventDetails.starts_at),
      endTime: toLocalDatetimeInput(eventDetails.ends_at),
    };
  }, [post]);

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

      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("content", formValues.description || " ");
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
        const dangerLevelMap: Record<string, string> = {
          Low: "low",
          Medium: "medium",
          High: "high",
          Critical: "critical",
        };
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

      const token = getAuthToken();
      if (!token) {
        alert("Please log in to edit the post.");
        setSaving(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/posts/${postId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
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
              isEditMode={true}
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