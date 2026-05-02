"use client";

import { X, AlertCircle, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

/**
 * type: 'info' | 'warning' | 'success' | 'error'
 */
export default function NotificationModal({
    isOpen,
    onClose,
    type = "info",
    title,
    message,
    primaryAction,
    secondaryAction,
}: {
    isOpen: boolean;
    onClose: () => void;
    type?: "info" | "warning" | "success" | "error";
    title?: string;
    message?: string;
    primaryAction?: { label: string; onClick: () => void };
    secondaryAction?: { label: string; onClick: () => void };
}) {
    if (!isOpen) return null;

    const STATUS_CONFIG = {
        info: {
            color: "#000000",
            icon: <HelpCircle size={48} strokeWidth={1.5} />,
            iconColor: "#000000",
        },
        warning: {
            color: "#F2994A",
            icon: <AlertTriangle size={48} strokeWidth={1.5} />,
            iconColor: "#F2994A",
        },
        success: {
            color: "#27AE60",
            icon: <CheckCircle size={48} strokeWidth={1.5} />,
            iconColor: "#27AE60",
        },
        error: {
            color: "#EB5757",
            icon: <AlertCircle size={48} strokeWidth={1.5} />,
            iconColor: "#EB5757",
        },
    };

    const config = STATUS_CONFIG[type] || STATUS_CONFIG.info;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            {/* Modal Container */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden relative animate-in fade-in zoom-in duration-200">

                {/* Status bar top */}
                <div style={{ height: "6px", backgroundColor: config.color }} />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X size={20} className="text-gray-400" />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    {/* Icon Section */}
                    <div
                        className="mb-6 flex items-center justify-center p-2 rounded-full border-2"
                        style={{ borderColor: config.iconColor + "40", color: config.iconColor }}
                    >
                        {config.icon}
                    </div>

                    {/* Text Section */}
                    <h2 className="text-[20px] font-bold text-[#432817] mb-2 leading-tight">
                        {title}
                    </h2>
                    <p className="text-[14px] text-[#8B7355] mb-8 leading-relaxed max-w-[300px]">
                        {message}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 w-full max-w-[200px]">
                        {primaryAction && (
                            <button
                                onClick={primaryAction.onClick}
                                className="w-full py-3 bg-black text-white text-[15px] font-bold rounded-lg hover:bg-black/90 transition-all active:scale-[0.98]"
                            >
                                {primaryAction.label}
                            </button>
                        )}

                        {secondaryAction && (
                            <button
                                onClick={secondaryAction.onClick}
                                className="w-full py-2 bg-transparent text-[#432817] text-[15px] font-semibold hover:opacity-70 transition-all"
                            >
                                {secondaryAction.label}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
