"use client";

import { useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type ReportPopupTargetType = "user" | "comment" | "post";

type ReportPopupProps = {
  isOpen: boolean;
  reportType: ReportPopupTargetType;
  targetId: string;
  onClose: () => void;
  onSuccess?: () => void;
};

const REPORT_REASONS = [
  "Inappropriate content",
  "False information",
  "Offensive language",
  "Spam",
  "Monument information incorrect",
  "Other",
];

const REPORT_LABELS: Record<ReportPopupTargetType, string> = {
  user: "user",
  comment: "comment",
  post: "post",
};

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function StatusDialog({
  color,
  title,
  message,
  primaryLabel,
  primaryAction,
  secondaryLabel,
  secondaryAction,
  isLoading = false,
}: {
  color: string;
  title: string;
  message: string;
  primaryLabel: string;
  primaryAction: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="w-full max-w-[380px] overflow-hidden rounded-[22px] bg-white shadow-[0_16px_42px_rgba(0,0,0,0.22)]">
      <div style={{ height: 8, backgroundColor: color }} />
      <div className="px-7 pb-8 pt-7 text-center">
        <div
          className="mx-auto mb-6 flex h-[84px] w-[84px] items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 12.5L10.8 15.3L16.5 9.5"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="mb-4 text-[18px] font-bold leading-tight text-black">{title}</h2>
        <p className="mx-auto mb-8 max-w-[260px] text-[14px] leading-[1.45] text-black">{message}</p>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={primaryAction}
            disabled={isLoading}
            className="min-w-[132px] rounded-[10px] px-6 py-2.5 text-[15px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: color }}
          >
            {isLoading ? "Sending..." : primaryLabel}
          </button>
          {secondaryLabel && secondaryAction ? (
            <button
              type="button"
              onClick={secondaryAction}
              disabled={isLoading}
              className="text-[15px] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              style={{ color }}
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ReportPopup({
  isOpen,
  reportType,
  targetId,
  onClose,
  onSuccess,
}: ReportPopupProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportLabel = REPORT_LABELS[reportType];
  const finalReason = useMemo(() => {
    const trimmedDetails = details.trim();
    return trimmedDetails ? `${selectedReason}. ${trimmedDetails}` : selectedReason;
  }, [details, selectedReason]);

  if (!isOpen) return null;

  const closePopup = () => {
    if (isSubmitting) return;
    onClose();
  };

  const openConfirmation = () => {
    if (!selectedReason) {
      setError("Please choose the type of problem first.");
      return;
    }

    if (finalReason.trim().length < 10) {
      setError("Please add a bit more detail before sending.");
      return;
    }

    setError("");
    setStep("confirm");
  };

  const submitReport = async () => {
    const token = getAuthToken();

    if (!token) {
      setError("Please log in before sending a report.");
      setStep("form");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/reports/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_type: reportType,
          target_id: targetId,
          reason: finalReason.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            (response.status === 409
              ? "You already sent a pending report for this item."
              : "Failed to submit report."),
        );
      }

      setStep("success");
      onSuccess?.();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to submit report.",
      );
      setStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/35 px-4 py-6" onClick={closePopup}>
      <div onClick={(event) => event.stopPropagation()}>
        {step === "form" ? (
          <div className="w-full max-w-[560px] rounded-[24px] bg-white px-8 pb-8 pt-10 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:px-12">
            <h1 className="mb-5 text-[30px] font-bold leading-tight text-black sm:text-[38px]">
              {`Report this ${reportLabel}`}
            </h1>
            <p className="mb-6 text-[16px] leading-6 text-[#7D7885]">
              Help us understand the issue.
            </p>

            <div className="mb-4 text-[18px] font-bold text-black">Type of problem</div>

            <div className="space-y-4">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedReason(reason);
                    setError("");
                  }}
                  className="flex w-full items-center gap-4 rounded-[14px] px-1 py-1 text-left transition-colors hover:bg-[#F8F3E6]"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full border"
                    style={{ borderColor: "#C98F2B" }}
                  >
                    {selectedReason === reason ? (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: "#C98F2B" }}
                      />
                    ) : null}
                  </span>
                  <span className="text-[16px] text-black sm:text-[18px]">{reason}</span>
                </button>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(event) => {
                setDetails(event.target.value);
                setError("");
              }}
              placeholder="Additional details (optional)"
              className="mt-8 min-h-[64px] w-full rounded-[14px] border border-[#8D8896] px-4 py-4 text-[16px] text-black outline-none placeholder:text-[#8D8896]"
            />

            {error ? (
              <p className="mt-3 text-sm font-medium text-[#C0392B]">{error}</p>
            ) : null}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={openConfirmation}
                className="min-w-[150px] rounded-[12px] bg-black px-8 py-3 text-[18px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Send
              </button>
              <button
                type="button"
                onClick={closePopup}
                className="px-2 py-2 text-[18px] font-medium text-black transition-opacity hover:opacity-70"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {step === "confirm" ? (
          <StatusDialog
            color="#432817"
            title={`Send this ${reportLabel} report?`}
            message="Your report will be sent to the moderation team for review."
            primaryLabel="Send"
            primaryAction={submitReport}
            secondaryLabel="Cancel"
            secondaryAction={() => setStep("form")}
            isLoading={isSubmitting}
          />
        ) : null}

        {step === "success" ? (
          <StatusDialog
            color="#168F66"
            title="Report submitted"
            message="Thank you! Our moderation team will review this report."
            primaryLabel="Close"
            primaryAction={onClose}
          />
        ) : null}
      </div>
    </div>
  );
}
