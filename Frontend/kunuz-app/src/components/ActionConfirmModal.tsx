"use client";

import React from "react";
import { createPortal } from "react-dom";

const FONT = "var(--font-lato), 'Lato', sans-serif";
const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const RED = "#C0392B";

export default function ActionConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Post",
    message = "Are you sure you want to delete this post? This action cannot be undone.",
    confirmText = "Delete",
    confirmColor = RED,
    icon = (
        <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke={RED}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    )
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    confirmColor?: string;
    icon?: React.ReactNode;
}) {
    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    zIndex: 10000,
                    backdropFilter: "blur(2px)",
                }}
            />

            {/* Modal Container */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 10001,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: CREAM_PAGE,
                        borderRadius: "24px",
                        padding: "40px 32px 32px",
                        width: "400px",
                        maxWidth: "calc(100vw - 40px)",
                        boxShadow: "0 24px 64px rgba(67,40,23,0.3)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        fontFamily: FONT,
                        pointerEvents: "auto",
                        animation: "popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                >
                    {/* Icon */}
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            backgroundColor: `${confirmColor}15`,
                            border: `2px solid ${confirmColor}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "20px",
                        }}
                    >
                        {icon}
                    </div>

                    <h2
                        style={{
                            fontSize: "24px",
                            fontWeight: 800,
                            color: ESPRESSO,
                            margin: "0 0 12px",
                            textAlign: "center",
                        }}
                    >
                        {title}
                    </h2>

                    <p
                        style={{
                            fontSize: "15px",
                            color: "#8B7355",
                            textAlign: "center",
                            margin: "0 0 32px",
                            lineHeight: 1.6,
                            fontWeight: 500,
                        }}
                    >
                        {message}
                    </p>

                    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                height: "52px",
                                borderRadius: "14px",
                                border: "1.5px solid #E0D5C5",
                                backgroundColor: "transparent",
                                color: "#8B7355",
                                fontWeight: 700,
                                fontSize: "15px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#FDFCF9";
                                e.currentTarget.style.borderColor = "#C4A882";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.borderColor = "#E0D5C5";
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{
                                flex: 1,
                                height: "52px",
                                borderRadius: "14px",
                                border: "none",
                                backgroundColor: confirmColor,
                                color: "white",
                                fontWeight: 700,
                                fontSize: "15px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow: `0 4px 12px ${confirmColor}33`,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.filter = "brightness(0.9)";
                                e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.filter = "none";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes popIn {
          0% { transform: scale(0.9) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
        </>,
        document.body
    );
}
