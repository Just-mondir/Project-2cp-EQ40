"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";

const FONT = "var(--font-lato), 'Lato', sans-serif";
const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const MINT = "#1B8561";

type ReportType = "post" | "comment" | "annotation" | "user";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, description: string) => Promise<void>;
    targetType: ReportType;
}

export default function ReportModal({
    isOpen,
    onClose,
    onSubmit,
    targetType,
}: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    const reasons = [
        "Inappropriate content",
        "False information",
        "Offensive language",
        "Spam",
        "Monument information incorrect",
        "Other",
    ];

    const handleSubmit = async () => {
        if (!selectedReason) return;
        setIsSubmitting(true);
        try {
            await onSubmit(selectedReason, description);
            setIsSubmitted(true);
        } catch (error) {
            console.error("Report failed:", error);
            const msg = error instanceof Error ? error.message : "Failed to submit report. Please try again.";
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinish = () => {
        setIsSubmitted(false);
        setSelectedReason("");
        setDescription("");
        onClose();
    };

    const targetLabel = targetType.charAt(0).toUpperCase() + targetType.slice(1);

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                onClick={handleFinish}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    zIndex: 10000,
                    backdropFilter: "blur(4px)",
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
                        backgroundColor: isSubmitted ? "#FFFFFF" : CREAM_PAGE,
                        borderRadius: "28px",
                        padding: isSubmitted ? "40px 32px" : "32px",
                        width: "380px",
                        maxWidth: "calc(100vw - 40px)",
                        boxShadow: "0 24px 64px rgba(67,40,23,0.15)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isSubmitted ? "center" : "flex-start",
                        fontFamily: FONT,
                        pointerEvents: "auto",
                        animation: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        transition: "background-color 0.3s ease",
                    }}
                >
                    {!isSubmitted ? (
                        <>
                            <h2
                                style={{
                                    fontSize: "32px",
                                    fontWeight: 900,
                                    color: "#000000",
                                    margin: "0 0 8px",
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                Report this {targetType}
                            </h2>
                            <p
                                style={{
                                    fontSize: "16px",
                                    color: "#8B7355",
                                    margin: "0 0 24px",
                                    fontWeight: 500,
                                    opacity: 0.8,
                                }}
                            >
                                Help us understand the issue.
                            </p>

                            <div style={{ width: "100%", marginBottom: "20px" }}>
                                <h3
                                    style={{
                                        fontSize: "15px",
                                        fontWeight: 700,
                                        color: "#000000",
                                        marginBottom: "16px",
                                    }}
                                >
                                    Type of problem
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {reasons.map((reason) => (
                                        <label
                                            key={reason}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                color: "#000000",
                                                fontWeight: 500,
                                            }}
                                        >
                                            <div style={{ position: "relative", width: "18px", height: "18px" }}>
                                                <input
                                                    type="radio"
                                                    name="report-reason"
                                                    value={reason}
                                                    checked={selectedReason === reason}
                                                    onChange={(e) => setSelectedReason(e.target.value)}
                                                    style={{
                                                        appearance: "none",
                                                        width: "18px",
                                                        height: "18px",
                                                        border: "1.5px solid #D1CAB7",
                                                        borderRadius: "50%",
                                                        cursor: "pointer",
                                                        margin: 0,
                                                        backgroundColor: selectedReason === reason ? "#000000" : "transparent",
                                                        borderColor: selectedReason === reason ? "#000000" : "#D1CAB7",
                                                        transition: "all 0.2s",
                                                    }}
                                                />
                                                {selectedReason === reason && (
                                                    <div
                                                        style={{
                                                            position: "absolute",
                                                            inset: 0,
                                                            margin: "auto",
                                                            width: "6px",
                                                            height: "6px",
                                                            borderRadius: "50%",
                                                            backgroundColor: "white",
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            {reason}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                placeholder="Additional details (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "48px",
                                    padding: "12px 16px",
                                    borderRadius: "12px",
                                    border: "1.5px solid #D1CAB7",
                                    backgroundColor: "transparent",
                                    fontSize: "14px",
                                    color: ESPRESSO,
                                    fontFamily: FONT,
                                    resize: "none",
                                    outline: "none",
                                    marginBottom: "24px",
                                }}
                            />

                            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selectedReason || isSubmitting}
                                    style={{
                                        flex: 1,
                                        height: "48px",
                                        borderRadius: "10px",
                                        backgroundColor: "#000000",
                                        color: "white",
                                        fontWeight: 800,
                                        fontSize: "16px",
                                        cursor: selectedReason ? "pointer" : "not-allowed",
                                        opacity: selectedReason && !isSubmitting ? 1 : 0.6,
                                        border: "none",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </button>
                                <button
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        height: "48px",
                                        borderRadius: "10px",
                                        backgroundColor: "white",
                                        color: "#000000",
                                        fontWeight: 800,
                                        fontSize: "16px",
                                        cursor: "pointer",
                                        border: "none",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                style={{
                                    width: "100px",
                                    height: "100px",
                                    borderRadius: "50%",
                                    backgroundColor: "#4DB28E",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "32px",
                                }}
                            >
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <path d="M9 15.5l2 2 4-4" />
                                </svg>
                            </div>

                            <h2
                                style={{
                                    fontSize: "28px",
                                    fontWeight: 900,
                                    color: "#000000",
                                    margin: "0 0 16px",
                                    textAlign: "center",
                                }}
                            >
                                Report submitted
                            </h2>

                            <p
                                style={{
                                    fontSize: "18px",
                                    color: "#000000",
                                    textAlign: "center",
                                    margin: "0 0 32px",
                                    lineHeight: 1.4,
                                    fontWeight: 500,
                                }}
                            >
                                Thank you!<br />
                                Our moderation team will<br />
                                review this report
                            </p>

                            <button
                                onClick={handleFinish}
                                style={{
                                    width: "100%",
                                    maxWidth: "160px",
                                    height: "52px",
                                    borderRadius: "14px",
                                    backgroundColor: "#1B8561",
                                    color: "white",
                                    fontWeight: 800,
                                    fontSize: "17px",
                                    cursor: "pointer",
                                    border: "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                Done
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes popIn {
          0% { transform: scale(0.9) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
        </>,
        document.body
    );
}
