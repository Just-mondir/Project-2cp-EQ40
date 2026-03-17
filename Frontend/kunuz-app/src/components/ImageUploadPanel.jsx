"use client";

import { useState, useRef } from "react";

const MAX_IMAGES = 5;

const DEFAULT_IMAGE = [{ url: "/download 1.jpg", name: "Heritage photo", isRemote: true }];

export default function ImageUploadPanel({ initialImages } = {}) {
    const [images, setImages] = useState(
        initialImages && initialImages.length > 0 ? initialImages : DEFAULT_IMAGE
    );


    const inputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        const toAdd = files.map((file) => ({
            url: URL.createObjectURL(file),
            name: file.name,
            isRemote: false,
        }));
        setImages((prev) => {
            const next = [...prev, ...toAdd];
            return next.slice(0, MAX_IMAGES);
        });
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleDelete = (index) => {
        setImages((prev) => {
            const next = [...prev];
            if (!next[index].isRemote) URL.revokeObjectURL(next[index].url);
            next.splice(index, 1);
            return next;
        });
    };

    return (
        <div
            className="flex flex-col h-full overflow-y-auto hide-scrollbar"
            style={{ backgroundColor: "#F7F5EF", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
            {/* Grid of images + upload slot (always 6 cells total) */}
            <div
                className="grid grid-cols-2 gap-3 p-3 pb-2"
                style={{ gridTemplateRows: "repeat(3, 130px)" }}
            >
                {[...Array(6)].map((_, idx) => {
                    if (idx < images.length) {
                        const img = images[idx];
                        return (
                            <div
                                key={idx}
                                className="relative rounded-xl overflow-hidden shadow-sm post-image-card"
                                style={{
                                    backgroundColor: "#FFFFFF",
                                }}
                            >
                                <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                                {/* Delete button — always visible */}
                                <button
                                    onClick={() => handleDelete(idx)}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-black/40"
                                    style={{ backgroundColor: "rgba(67,40,23,0.80)" }}
                                    title="Remove photo"
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                        stroke="#F7F5EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                        <path d="M9 6V4h6v2" />
                                    </svg>
                                </button>
                            </div>
                        );
                    } else if (idx === images.length) {
                        return (
                            <button
                                key="upload"
                                onClick={() => inputRef.current?.click()}
                                className="rounded-xl flex flex-col items-center justify-center post-upload-slot cursor-pointer"
                                style={{
                                    border: "1px dashed rgba(0, 0, 0, 0.2)",
                                    backgroundColor: "transparent",
                                    height: "100%",
                                }}
                                title="Add photo"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    stroke="rgba(0, 0, 0, 0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <polyline points="19 12 12 19 5 12" />
                                </svg>
                            </button>
                        );
                    } else {
                        // Empty cell to complete the 2x3 grid
                        return (
                            <div
                                key={`empty-${idx}`}
                                className="rounded-xl"
                                style={{
                                    border: "1px dashed rgba(0, 0, 0, 0.15)",
                                    backgroundColor: "transparent",
                                    height: "100%",
                                }}
                            />
                        );
                    }
                })}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
