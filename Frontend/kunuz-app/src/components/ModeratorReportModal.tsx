"use client";

import { useEffect, useState } from "react";
import { X, Trash2, ShieldAlert, UserCog, ExternalLink, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Helper that mirrors what NotificationPanel does when navigating to content
function navigateToContent(
    report: { target_type: string; target_id: string; target_details: { group_id?: string; post_id?: string; post_type?: string; author_username?: string } },
    router: ReturnType<typeof useRouter>,
    onClose: () => void
) {
    const { target_type, target_id, target_details } = report;
    const groupId = target_details.group_id;
    const currentPath = window.location.pathname;

    const handleRedirect = (path: string, event: string) => {
        onClose();
        // If already on destination path, dispatch immediately
        if (currentPath === path || (path === "/home-page" && (currentPath === "/" || currentPath === "/home-page"))) {
            window.dispatchEvent(new Event(event));
        } else {
            router.push(path);
            // Smaller timeout (100ms) is enough for Next.js to register listeners on new page
            setTimeout(() => window.dispatchEvent(new Event(event)), 100);
        }
    };

    if (target_type === "post") {
        sessionStorage.setItem("open_post_id", target_id);
        sessionStorage.setItem("open_post_tab", "comments");
        if (groupId) {
            handleRedirect(`/group/${groupId}`, "highlight-post");
        } else {
            handleRedirect("/home-page", "highlight-post");
        }
    } else if (target_type === "comment") {
        const postId = target_details.post_id || target_id;
        sessionStorage.setItem("open_post_id", postId);
        sessionStorage.setItem("open_post_tab", "comments");
        if (groupId) {
            handleRedirect(`/group/${groupId}`, "highlight-post");
        } else {
            handleRedirect("/home-page", "highlight-post");
        }
    } else if (target_type === "group_chat_message" && groupId) {
        onClose();
        router.push(`/group/${groupId}?tab=chat`);
    } else if (target_type === "user") {
        onClose();
        router.push(`/user/${target_details.author_username}`);
    } else if (target_type === "group") {
        onClose();
        router.push(`/group/${target_id}`);
    }
}

type ReportDetails = {
    id: string;
    reporter_details: {
        display_name: string;
        username: string;
        profile_picture: string;
    };
    target_details: {
        id: string;
        author_name: string;
        author_username: string;
        author_avatar: string;
        content: string;
        type: string;
        post_type?: string;
        post_id?: string;
        target_user_id?: string;
        group_id?: string;
    };
    target_type: string;
    target_id: string;
    reason: string;
    description: string;
    status: string;
    created_at: string;
};

interface ReportModalProps {
    reportId: string;
    onClose: () => void;
}

const FONT = "var(--font-lato), 'Lato', sans-serif";
const ESPRESSO = "#432817";
const CREAM_PAGE = "#F7F5EF";
const MINT = "#1B8561";
const RED = "#C0392B";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export default function ModeratorReportModal({ reportId, onClose }: ReportModalProps) {
    const [report, setReport] = useState<ReportDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await fetch(`${API_URL}/api/reports/${reportId}/`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });
                const data = await res.json();
                setReport(data.data);
            } catch (err) {
                console.error("Failed to fetch report:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchReport();
    }, [reportId]);

    const handleAction = async (action: "delete" | "ignore") => {
        if (!report) return;
        setBusy(true);
        try {
            if (action === "delete") {
                const path = report.target_type === "post" ? `/api/posts/${report.target_id}/` :
                    report.target_type === "comment" ? `/api/posts/comments/${report.target_id}/` : null;

                if (path) {
                    await fetch(`${API_URL}${path}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        },
                    });
                }
            }

            await fetch(`${API_URL}/api/reports/${reportId}/resolve/`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "reviewed",
                    moderator_note: action === "delete" ? "Content deleted by moderator." : "Report ignored."
                }),
            });

            onClose();
        } catch (err) {
            console.error(`Failed to ${action} report:`, err);
        } finally {
            setBusy(false);
        }
    };

    const handleManageUser = () => {
        if (!report?.target_details.target_user_id) return;
        onClose();
        router.push(`/moderator-page?search=${report.target_details.author_username || report.target_details.target_user_id}`);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div
                className="relative w-full max-w-[480px] min-h-[300px] overflow-hidden rounded-[24px] bg-[#F7F5EF] p-8 text-[#432817] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
                style={{
                    boxShadow: "0 24px 64px rgba(67,40,23,0.3)",
                    fontFamily: FONT
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 z-50 rounded-full p-2 text-[#432817]/40 transition hover:bg-[#432817]/5 hover:text-[#432817]"
                >
                    <X className="h-5 w-5" />
                </button>

                {loading ? (
                    <div className="flex flex-1 flex-col items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#432817]/10 border-t-[#432817]" />
                        <p className="mt-4 text-[14px] font-bold opacity-40 uppercase tracking-widest">Chargement...</p>
                    </div>
                ) : !report ? (
                    <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
                        <ShieldAlert className="h-12 w-12 text-[#C0392B] opacity-20 mb-4" />
                        <p className="text-[16px] font-bold tracking-tight">Signalement introuvable</p>
                        <p className="mt-1 text-[13px] text-[#8B7355]">Les détails ne sont plus accessibles ou ont été supprimés.</p>
                        <button
                            onClick={onClose}
                            className="mt-8 px-6 py-2 rounded-full border border-[#D6CFC3] text-[13px] font-bold hover:bg-black/5"
                        >
                            Fermer
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex flex-col items-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#432817]/10 bg-[#432817]/5">
                                <ShieldAlert className="h-7 w-7 text-[#432817]" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-[22px] font-bold text-[#432817]">Examen du Signalement</h2>
                            <p className="text-[12px] text-[#8B7355] font-medium tracking-wide">ID: #RPT-{report.id.slice(-6).toUpperCase()}</p>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                            <div className="rounded-2xl border border-[#D6CFC3] bg-white/40 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Link
                                        href={`/user/${report.reporter_details.username}`}
                                        onClick={onClose}
                                        className="flex items-center gap-3 transition hover:opacity-75"
                                    >
                                        <div className="h-10 w-10 overflow-hidden rounded-full border border-[#432817]/10">
                                            <img src={report.reporter_details.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${report.reporter_details.username}`} className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[#432817] leading-tight">{report.reporter_details.display_name}</p>
                                            <p className="text-[11px] text-[#8B7355]">@ {report.reporter_details.username}</p>
                                        </div>
                                    </Link>
                                    <div className="rounded-full bg-[#C0392B]/10 px-3 py-1 border border-[#C0392B]/15">
                                        <p className="text-[10px] font-bold text-[#C0392B] uppercase tracking-widest">{report.reason}</p>
                                    </div>
                                </div>

                                {report.description && (
                                    <div className="mt-2 rounded-xl bg-white/60 p-3 border border-dashed border-[#D6CFC3]">
                                        <div className="flex gap-2 items-start">
                                            <Info className="h-4 w-4 text-[#8B7355] mt-0.5 flex-shrink-0" />
                                            <p className="text-[13px] text-[#432817]/80 leading-relaxed italic">
                                                "{report.description}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B7355] pl-1">CONTENU SIGNALÉ</p>
                                <div className="rounded-2xl border-2 border-[#D6CFC3]/50 bg-white p-5 space-y-4 shadow-sm relative overflow-hidden group">
                                    <button
                                        onClick={() => navigateToContent(report, router, onClose)}
                                        className="absolute inset-0 z-10 opacity-0 bg-[#432817]/5 transition group-hover:opacity-100 flex items-center justify-center focus:opacity-100 w-full"
                                        title="Voir le contenu"
                                    >
                                        <div className="bg-white/90 px-4 py-2 rounded-full shadow-md flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                            <ExternalLink className="h-4 w-4 text-[#432817]" />
                                            <span className="text-[12px] font-bold">Voir le contenu</span>
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-3 relative z-20">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onClose(); router.push(`/user/${report.target_details.author_username}`); }}
                                            className="h-9 w-9 overflow-hidden rounded-full border border-[#432817]/10 hover:opacity-75 transition flex-shrink-0"
                                        >
                                            <img src={report.target_details.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${report.target_details.author_username}`} className="h-full w-full object-cover" />
                                        </button>
                                        <div className="flex flex-col">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onClose(); router.push(`/user/${report.target_details.author_username}`); }}
                                                className="text-[13px] font-bold text-[#432817] hover:underline text-left"
                                            >
                                                {report.target_details.author_name}
                                            </button>
                                            <span className="text-[11px] text-[#8B7355]">@{report.target_details.author_username}</span>
                                        </div>
                                        <div className="ml-auto text-[10px] font-bold text-[#8B7355]/40 border border-[#8B7355]/20 px-2 py-0.5 rounded capitalize">
                                            {report.target_type}
                                        </div>
                                    </div>

                                    <div className="border-t border-[#F5F1E8] pt-3 relative z-20">
                                        <p className="text-[14px] leading-relaxed text-[#432817] line-clamp-6">
                                            {report.target_details.content}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={handleManageUser}
                                    disabled={busy}
                                    style={{ backgroundColor: ESPRESSO }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[15px] font-bold text-white transition hover:opacity-90 shadow-lg shadow-[#432817]/15"
                                >
                                    <UserCog className="h-4 w-4" />
                                    Gérer l'utilisateur
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleAction("delete")}
                                        disabled={busy}
                                        style={{ color: RED, borderColor: `${RED}33`, backgroundColor: `${RED}0D` }}
                                        className="flex items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-[14px] font-bold transition hover:opacity-80"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Supprimer
                                    </button>
                                    <button
                                        onClick={() => handleAction("ignore")}
                                        disabled={busy}
                                        style={{ color: `${ESPRESSO}99`, borderColor: "#D8C8B1", backgroundColor: "#EDE8D8" }}
                                        className="flex items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-[14px] font-bold transition hover:bg-[#E3D9C4] hover:text-[#432817]"
                                    >
                                        Ignorer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                .line-clamp-6 {
                    display: -webkit-box;
                    -webkit-line-clamp: 6;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #D6CFC3;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
