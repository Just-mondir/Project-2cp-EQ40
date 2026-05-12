"use client";

import React, { useState, useRef } from "react";
import GroupForm from "./GroupForm";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
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

    const handleDone = async (formData: any) => {
        try {
            setSaving(true);

            const token = localStorage.getItem("auth_token");
            const postData = new FormData();

            // Basic fields
            postData.append("name", formData.groupName);
            postData.append("description", formData.description);
            postData.append("historical_period", formData.historicalPeriod);
            postData.append("region", formData.region);
            postData.append("category", formData.category);
            postData.append("visibility", formData.visibility.toLowerCase());
            postData.append("rules", formData.rules);

            // JSON fields
            postData.append("tags", JSON.stringify(formData.tags));
            postData.append("invited_users", JSON.stringify(formData.invitedUsers.map((u: any) => u.id)));

            // Images
            if (fileInputRef.current?.files?.[0]) {
                postData.append("profile_picture", fileInputRef.current.files[0]);
            }
            if (coverInputRef.current?.files?.[0]) {
                postData.append("banner_image", coverInputRef.current.files[0]);
            }

            const res = await fetch(`${API_URL}/api/groups/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: postData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create group");
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error creating group:", err);
            alert(err instanceof Error ? err.message : "Error creating group");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-[1000px] max-h-[90vh] bg-[#F7F5EF] rounded-2xl overflow-hidden flex shadow-2xl" onClick={(e) => e.stopPropagation()}>

                {/* ── Left panel (Media) ── */}
                <div className="w-[280px] hidden md:flex flex-col flex-shrink-0 bg-white border-r border-black/10 p-8 overflow-y-auto hide-scrollbar">
                    <h1 className="text-[30px] font-bold text-[#432817] leading-tight mb-8">
                        Create group
                    </h1>

                    <div className="flex flex-col items-center gap-6">
                        {/* ── Cover photo ── */}
                        <div
                            onClick={() => coverInputRef.current?.click()}
                            className="w-full aspect-[21/8] rounded-xl border-2 border-dashed border-[#D6CFC3] bg-[#F7F5EF] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#432817] transition-colors"
                        >
                            {coverPhoto ? (
                                <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#79747E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                    </svg>
                                    <span className="text-[11px] text-[#79747E]">Cover photo</span>
                                </div>
                            )}
                        </div>
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

                        {/* ── Group photo ── */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-square rounded-xl border-2 border-dashed border-[#D6CFC3] bg-[#F7F5EF] flex flex-col items-center justify-center gap-3 overflow-hidden cursor-pointer hover:border-[#432817] transition-colors"
                        >
                            {groupPhoto ? (
                                <img src={groupPhoto} alt="Group" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="3" x2="12" y2="15" /><polyline points="7 10 12 15 17 10" /><path d="M5 19 Q5 21 7 21 L17 21 Q19 21 19 19" />
                                    </svg>
                                    <span className="text-xs text-[#79747E] text-center px-4 font-bold">Upload group photo</span>
                                </>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>

                    {saving && (
                        <div className="mt-8 flex items-center justify-center gap-3 text-[#8B6914] font-bold text-sm">
                            <div className="w-4 h-4 border-2 border-t-transparent border-[#8B6914] rounded-full animate-spin" />
                            Creating group...
                        </div>
                    )}
                </div>

                {/* ── Right panel (Form) ── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <GroupForm onCancel={onClose} onDone={handleDone} />
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors z-[120]"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#432817" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
