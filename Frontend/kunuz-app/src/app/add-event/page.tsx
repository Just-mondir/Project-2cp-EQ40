"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import ImageUploadPanel, { type ImageItem } from "@/components/ImageUploadPanel";
import PostForm from "@/components/PostForm";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

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
    selectedMonument?: string | null;
    previousStatus?: string | null;
    currentStatus?: string | null;
};

export default function AddEventPage() {
    const t = useTranslations("auth.pages.addEvent");
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [images, setImages] = useState<ImageItem[]>([]);

    const handleCancel = () => router.back();

    const handleDone = async (formValues: PostFormValues) => {
        try {
            setSaving(true);

            // Validation
            if (!formValues.title || formValues.title.trim() === "") {
                alert(t("errors.missingTitle"));
                return;
            }

            if (!formValues.startTime) {
                alert(t("errors.missingStartTime"));
                return;
            }

            // 1. Create the Post with images using FormData
            const postFormData = new FormData();
            postFormData.append("title", formValues.title);
            postFormData.append("content", formValues.description || "");
            postFormData.append("location", formValues.location || "");
            postFormData.append("post_type", "event");
            postFormData.append("visibility", formValues.visibility.toLowerCase());

            if (formValues.historicalPeriod) postFormData.append("historical_period", formValues.historicalPeriod);
            if (formValues.region) postFormData.append("region", formValues.region);
            if (formValues.monumentType) postFormData.append("monument_type", formValues.monumentType);

            postFormData.append("starts_at", new Date(formValues.startTime).toISOString());
            if (formValues.endTime) {
                postFormData.append("ends_at", new Date(formValues.endTime).toISOString());
            }

            images.forEach((img) => {
                if (!img.isRemote && img.file) {
                    postFormData.append("uploaded_images", img.file);
                }
            });

            const postRes = await fetch(`${API_URL}/api/posts/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: postFormData,
            });

            if (!postRes.ok) {
                const errorData = await postRes.json();
                console.error("Post creation error:", errorData);
                alert(t("errors.createPost", { message: errorData?.message || t("errors.unknown") }));
                return;
            }

            const postResult = await postRes.json();
            const newPostId = postResult.data?.id;

            // 2. Create the Mobilization Event linked to the newly created Post
            const mobilizationData = {
                post: newPostId,
                description: formValues.description || "",
                previous_status: formValues.previousStatus || "alert",
                current_status: formValues.currentStatus || "under_intervention"
            };

            const mobilizationRes = await fetch(`${API_URL}/api/posts/mobilization-event/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify(mobilizationData),
            });

            if (!mobilizationRes.ok) {
                console.warn("Mobilization event creation failed, but post was created");
            } else {
                console.log("Mobilization event created successfully!");
            }

            // Show success message and redirect
            alert(t("success"));

            router.push("/events");
        } catch (err) {
            console.error("Error creating mobilization event:", err);
            alert(t("errors.createFailed"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="legacy-theme-page-shell flex h-[100dvh] overflow-hidden">
            <LeftSidebar activePage="monuments" variant="add-post" />

            <div className="flex flex-col flex-1 overflow-hidden ml-0 md:ml-[68px]">
                <div className="px-8 pt-6 pb-2 flex-shrink-0">
                    <BackButton />
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden px-4 md:px-8 pb-8 gap-6">
                    <div className="w-full lg:w-[300px] flex flex-col flex-shrink-0 overflow-hidden post-panel-left">
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
                                <p
                                    style={{
                                        fontSize: "12px",
                                        color: "#8B6914",
                                        marginTop: "6px",
                                        fontFamily: "var(--font-lato), 'Lato', sans-serif",
                                    }}
                                >
                                    {t("publishing")}
                                </p>
                            )}
                        </div>

                        <div
                            className="h-[300px] lg:flex-1 overflow-hidden"
                            style={{
                                backgroundColor: "#F7F5EF",
                                borderRadius: 0,
                                marginTop: "10px",
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
                            initialValues={{ postType: "Event" }}
                            hidePostType={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
