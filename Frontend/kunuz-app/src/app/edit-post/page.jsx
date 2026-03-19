"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import ImageUploadPanel from "@/components/ImageUploadPanel";
import PostForm from "@/components/PostForm";

/* ─── Shared mock post data (same as profile page) ─── */
const MOCK_POSTS = [
    { id: 1, image: "/algerian-architecture-1.jpg", type: "Discovery", username: "User4987838", date: "05/03/2025", title: "Traditional Algerian Architecture", body: "Beautiful example of traditional Algerian architectural design with intricate details and patterns.", location: "Algiers", gems: "1.2k", comments: "48", annotations: "12" },
    { id: 2, image: "/alger 1.jpg", type: "Visit", username: "User4987838", date: "04/03/2025", title: "Streets of Algiers", body: "Exploring the historic streets and buildings of Algiers, a city rich in cultural heritage.", location: "Algiers", gems: "890", comments: "32", annotations: "8" },
    { id: 3, image: "/download 1.jpg", type: "Question", username: "User4987838", date: "03/03/2025", title: "Historic Courtyard", body: "A stunning courtyard featuring traditional Moorish design elements and zellige tilework.", location: "Tlemcen", gems: "2.1k", comments: "156", annotations: "24" },
    { id: 4, image: "/algerian-architecture-1.jpg", type: "In Danger", username: "User4987838", date: "02/03/2025", title: "Heritage Site Alert", body: "Important update about the preservation status of this historic location.", location: "Constantine", gems: "567", comments: "89", annotations: "5" },
    { id: 5, image: "/alger 1.jpg", type: "Discovery", username: "User4987838", date: "01/03/2025", title: "Algiers Discovery", body: "New discoveries in the heart of old Algiers revealing centuries of history.", location: "Algiers", gems: "1.5k", comments: "67", annotations: "19" },
    { id: 6, image: "/download 1.jpg", type: "Discovery", username: "User4987838", date: "28/02/2025", title: "Moorish Palace", body: "Inside one of the most beautiful Moorish palaces still standing in Algeria.", location: "Tlemcen", gems: "3.2k", comments: "234", annotations: "45" },
    { id: 7, image: "/algerian-architecture-1.jpg", type: "Visit", username: "User4987838", date: "27/02/2025", title: "Virtual Tour", body: "Take a virtual tour through this magnificent example of Islamic architecture.", location: "Béjaïa", gems: "980", comments: "45", annotations: "11" },
    { id: 8, image: "/alger 1.jpg", type: "Discovery", username: "User4987838", date: "26/02/2025", title: "City Views", body: "Panoramic views of Algiers showing the blend of old and new architecture.", location: "Algiers", gems: "1.8k", comments: "98", annotations: "22" },
    { id: 9, image: "/download 1.jpg", type: "Visit", username: "User4987838", date: "25/02/2025", title: "Ottoman Heritage", body: "Exploring the Ottoman influence on Algerian architecture and urban planning.", location: "Annaba", gems: "1.1k", comments: "52", annotations: "15" },
    { id: 10, image: "/algerian-architecture-1.jpg", type: "Question", username: "User4987838", date: "24/02/2025", title: "Restoration Project", body: "What do you think about the ongoing restoration of this historic site?", location: "Sétif", gems: "756", comments: "124", annotations: "8" },
    { id: 11, image: "/alger 1.jpg", type: "Discovery", username: "User4987838", date: "23/02/2025", title: "Hidden Gems", body: "Discovering lesser-known architectural treasures in the Casbah.", location: "Algiers", gems: "2.3k", comments: "89", annotations: "31" },
    { id: 12, image: "/download 1.jpg", type: "In Danger", username: "User4987838", date: "22/02/2025", title: "Conservation Alert", body: "Urgent call for conservation efforts at this endangered heritage site.", location: "Tipaza", gems: "1.9k", comments: "178", annotations: "42" },
    { id: 13, image: "/algerian-architecture-1.jpg", type: "Discovery", username: "User4987838", date: "21/02/2025", title: "Andalusian Influence", body: "The beautiful Andalusian architectural elements found throughout Algeria.", location: "Tlemcen", gems: "1.4k", comments: "61", annotations: "18" },
    { id: 14, image: "/alger 1.jpg", type: "Visit", username: "User4987838", date: "20/02/2025", title: "Walking Tour", body: "Join me on a walking tour through the historic medina.", location: "Constantine", gems: "890", comments: "45", annotations: "9" },
    { id: 15, image: "/download 1.jpg", type: "Discovery", username: "User4987838", date: "19/02/2025", title: "Ceramic Art", body: "Traditional ceramic tilework adorning this magnificent building.", location: "Ghardaïa", gems: "2.7k", comments: "201", annotations: "55" },
    { id: 16, image: "/algerian-architecture-1.jpg", type: "Question", username: "User4987838", date: "18/02/2025", title: "Historical Mystery", body: "Can anyone help identify the origin of these architectural patterns?", location: "Oran", gems: "678", comments: "93", annotations: "7" },
    { id: 17, image: "/alger 1.jpg", type: "Discovery", username: "User4987838", date: "17/02/2025", title: "Sunset Views", body: "Golden hour at one of Algeria's most beautiful heritage sites.", location: "Tipaza", gems: "3.5k", comments: "267", annotations: "48" },
    { id: 18, image: "/download 1.jpg", type: "Visit", username: "User4987838", date: "16/02/2025", title: "Underground Passages", body: "Exploring the hidden underground passages beneath the old city.", location: "Algiers", gems: "1.6k", comments: "112", annotations: "26" },
];

function EditPostInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const postId = searchParams.get("id");

    /* Find the post by ID, fall back to null if not found */
    const post = postId ? MOCK_POSTS.find((p) => p.id === Number(postId)) : null;

    const initialValues = React.useMemo(() => post
        ? {
            title: post.title,
            description: post.body,
            location: post.location,
            postType: post.type,
            historicalPeriod: "",
            region: post.location || "",
            visibility: "Public",
            groups: [],
        }
        : {}, [postId]);  // eslint-disable-line react-hooks/exhaustive-deps

    const initialImages = post
        ? [{ url: post.image, name: post.title, isRemote: true }]
        : [];

    const handleCancel = () => router.back();
    const handleDone = () => router.back();

    return (
        <div
            className="flex h-screen overflow-hidden"
            style={{ backgroundColor: "#F7F5EF" }}
        >
            {/* ── Left fixed sidebar ── */}
            <LeftSidebar activePage="add-post" />

            {/* ── Content area ── */}
            <div className="flex flex-col flex-1 overflow-hidden ml-[68px]">
                {/* Back button */}
                <div className="px-8 pt-6 pb-2 flex-shrink-0">
                    <BackButton />
                </div>

                {/* Two-panel content */}
                <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6">
                    {/* Left panel */}
                    <div className="w-[300px] flex flex-col flex-shrink-0 overflow-hidden post-panel-left">
                        {/* Page title */}
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
                            {post && (
                                <p style={{
                                    fontSize: "12px",
                                    color: "#8B7355",
                                    marginTop: "4px",
                                    fontFamily: "var(--font-lato), 'Lato', sans-serif",
                                }}>
                                    Editing: <span style={{ fontStyle: "italic" }}>{post.title}</span>
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
                            <ImageUploadPanel initialImages={initialImages} />
                        </div>
                    </div>

                    {/* Right panel: Form pre-filled */}
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
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EditPostPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "#F7F5EF" }}>
                <p style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>Loading...</p>
            </div>
        }>
            <EditPostInner />
        </Suspense>
    );
}
