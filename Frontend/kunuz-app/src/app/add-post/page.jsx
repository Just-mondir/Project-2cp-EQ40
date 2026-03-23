"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import ImageUploadPanel from "@/components/ImageUploadPanel";
import PostForm from "@/components/PostForm";
import { useRouter } from "next/navigation";

export default function AddPostPage() {
    const router = useRouter();
    const handleCancel = () => router.back();
    const handleDone = () => router.back(); // TODO: wire to API

    return (
        <div
            className="flex h-screen overflow-hidden"
            style={{ backgroundColor: "#F7F5EF" }}
        >
            {/* ── Left fixed sidebar ───────────────────────── */}
            <LeftSidebar activePage="add-post" />

            {/* ── Content area ────────────────────────────── */}
            <div className="flex flex-col flex-1 overflow-hidden ml-[68px]">
                {/* Back button */}
                <div className="px-8 pt-6 pb-2 flex-shrink-0">
                    <BackButton />
                </div>

                {/* Two-panel content */}
                <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6">
                    {/* Left panel: Title & Image upload panel */}
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
                                Add post
                            </h1>
                        </div>
                        <div
                            className="flex-1 overflow-hidden"
                            style={{
                                backgroundColor: "#F7F5EF",
                                borderRadius: 0,
                                marginTop: "43px",
                            }}
                        >
                            <ImageUploadPanel />
                        </div>
                    </div>
                    {/* Right panel: Form */}
                    <div
                        className="flex-1 overflow-hidden flex flex-col post-panel-right post-form-panel"
                        style={{
                            backgroundColor: "#F7F5EF",
                            borderRadius: 0,
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <PostForm onCancel={handleCancel} onDone={handleDone} />
                    </div>
                </div>
            </div>
        </div>
    );
}
