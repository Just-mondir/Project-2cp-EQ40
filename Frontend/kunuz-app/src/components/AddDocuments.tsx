"use client";

import { useRef, useState } from "react";

interface AddDocumentsModalProps {
  onClose: () => void;
}

export default function AddDocumentsModal({ onClose }: AddDocumentsModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="relative bg-white rounded-[20px] shadow-lg"
        style={{ width: "600px", padding: "40px 50px 40px 50px" }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hover:opacity-70 transition-opacity"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="#9E9E9E" strokeWidth="2" />
            <path d="M10 10L22 22M22 10L10 22" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Title */}
        <h2
          className="text-center font-black mb-8"
          style={{
            color: "#432817",
            fontFamily: "var(--font-lato)",
            fontSize: "36px",
          }}
        >
          Add Documents
        </h2>

        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="cursor-pointer flex flex-col items-center justify-center transition-all"
          style={{
            border: `2px dashed ${dragOver ? "#432817" : "#9E9E9E"}`,
            borderRadius: "14px",
            backgroundColor: dragOver ? "#f5efe6" : "#F2F2F2",
            height: "260px",
            marginBottom: "32px",
          }}
        >
          {files.length === 0 ? (
            <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M35 10V45M35 45L22 32M35 45L48 32" stroke="#9E9E9E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 52C12 52 12 58 20 58H50C58 58 58 52 58 52" stroke="#9E9E9E" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4">
              {files.map((file, i) => (
                <p key={i} className="text-sm" style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>
                  ✓ {file.name}
                </p>
              ))}
              <p className="text-xs mt-2" style={{ color: "#79747E" }}>Click to add more</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Done Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="font-black text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              backgroundColor: "#432817",
              borderRadius: "10px",
              fontFamily: "var(--font-lato)",
              fontSize: "23.8px",
              height: "47px",
              width: "200px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}