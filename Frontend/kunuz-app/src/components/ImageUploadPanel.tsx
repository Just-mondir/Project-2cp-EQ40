"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

const MAX_IMAGES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB limit for Cloudinary

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken") || process.env.NEXT_PUBLIC_TOKEN || "";
  }
  return process.env.NEXT_PUBLIC_TOKEN || "";
};

export type ImageItem = {
  id?: string;
  url: string;
  name: string;
  isRemote: boolean;
  file?: File;
};

type ImageUploadPanelProps = {
  initialImages?: ImageItem[];
  onImagesChange?: (images: ImageItem[]) => void;
};

export default function ImageUploadPanel({
  initialImages = [],
  onImagesChange,
}: ImageUploadPanelProps) {
  const t = useTranslations("auth.imageUpload");
  const [images, setImages] = useState<ImageItem[]>(initialImages);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!hasSynced.current && initialImages.length > 0) {
      setImages(initialImages);
      hasSynced.current = true;
    }
  }, [initialImages]);

  const updateImages = (next: ImageItem[]) => {
    setImages(next);
    onImagesChange?.(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_BYTES) {
        alert(t("fileTooLarge", { name: file.name }));
        return false;
      }
      return true;
    });

    const toAdd: ImageItem[] = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      isRemote: false,
    }));

    const next = [...images, ...toAdd].slice(0, MAX_IMAGES);
    updateImages(next);

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async (index: number) => {
    const img = images[index];

    if (img.isRemote && img.id) {
      const token = getAuthToken();
      if (!token) {
        alert(t("deleteRequiresLogin"));
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/posts/images/${img.id}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          console.error("Failed to delete image from server");
          return;
        }
      } catch (err) {
        console.error("Error deleting image:", err);
        return;
      }
    }

    const next = [...images];
    if (!next[index].isRemote && next[index].url) {
      URL.revokeObjectURL(next[index].url);
    }
    next.splice(index, 1);
    updateImages(next);
  };

  return (
    <div
      className="image-upload-surface flex flex-col h-full overflow-y-auto hide-scrollbar"
      style={{
        backgroundColor: "#F7F5EF",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "10.75px",
        boxShadow: "0 1px 4px rgba(67,40,23,0.06)",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div
        className="flex flex-row md:grid md:grid-cols-2 gap-2 md:gap-3 p-2 md:p-3 pb-2 overflow-x-auto md:overflow-visible snap-x md:auto-rows-[130px] w-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {[...Array(5)].map((_, idx) => {
          if (idx < images.length) {
            const img = images[idx];
            return (
              <div
                key={idx}
                className="image-upload-card relative rounded-[10px] md:rounded-xl overflow-hidden shadow-sm post-image-card flex-shrink-0 snap-center w-[54px] h-[54px] md:w-full md:h-full"
                style={{ backgroundColor: "var(--panel-elevated)" }}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDelete(idx)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-black/40"
                  style={{ backgroundColor: "rgba(67,40,23,0.80)" }}
                  title={t("removePhoto")}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F7F5EF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                className="image-upload-slot rounded-[10px] md:rounded-xl flex flex-col items-center justify-center post-upload-slot cursor-pointer flex-shrink-0 snap-center w-[54px] h-[54px] md:w-full md:h-full"
                style={{
                  border: "1px dashed rgba(0, 0, 0, 0.2)",
                  backgroundColor: "transparent",
                  color: "rgba(67, 40, 23, 0.45)",
                  height: "100%",
                }}
                title={t("addPhoto")}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </button>
            );
          } else {
            return (
              <div
                key={`empty-${idx}`}
                className="image-upload-empty rounded-[10px] md:rounded-xl flex-shrink-0 snap-center w-[54px] h-[54px] md:w-full md:h-full hidden md:block"
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
