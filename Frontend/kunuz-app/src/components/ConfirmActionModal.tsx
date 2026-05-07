"use client";

import { useEffect, useId, useMemo, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ConfirmActionVariant = "danger" | "warning" | "neutral";

type ConfirmActionModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: ConfirmActionVariant;
  isBusy?: boolean;
  cancelText?: string;
  showCancelButton?: boolean;
  icon?: ReactNode;
};

const VARIANT_STYLES: Record<ConfirmActionVariant, { color: string; ring: string }> = {
  danger: { color: "#C0392B", ring: "rgba(192,57,43,0.08)" },
  warning: { color: "#8B6914", ring: "rgba(139,105,20,0.10)" },
  neutral: { color: "#432817", ring: "rgba(67,40,23,0.10)" },
};

function VariantIcon({ variant }: { variant: ConfirmActionVariant }) {
  const color = VARIANT_STYLES[variant].color;
  if (variant === "warning") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (variant === "neutral") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmText,
  onConfirm,
  onCancel,
  variant = "danger",
  isBusy = false,
  cancelText = "Close",
  showCancelButton = true,
  icon,
}: ConfirmActionModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const styles = useMemo(() => VARIANT_STYLES[variant], [variant]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isBusy) onCancel();
        return;
      }

      if (event.key !== "Tab") return;
      const focusables = [confirmButtonRef.current, showCancelButton ? cancelButtonRef.current : null].filter(
        Boolean,
      ) as HTMLButtonElement[];
      if (focusables.length === 0) return;
      const activeIndex = focusables.findIndex((element) => element === document.activeElement);
      const currentIndex = activeIndex === -1 ? 0 : activeIndex;
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusables.length) % focusables.length
        : (currentIndex + 1) % focusables.length;
      focusables[nextIndex]?.focus();
      event.preventDefault();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isBusy, onCancel, showCancelButton]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[20000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => !isBusy && onCancel()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-[20001] w-full max-w-[500px] rounded-[28px] px-8 pb-8 pt-10 shadow-[0_24px_64px_rgba(0,0,0,0.28)]"
        style={{ backgroundColor: "#FFF8E2", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}
      >
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border"
          style={{ borderColor: styles.color, backgroundColor: styles.ring }}
        >
          {icon ?? <VariantIcon variant={variant} />}
        </div>

        <h2 id={titleId} className="mb-2 text-center text-[26px] font-black leading-tight sm:text-[38px]" style={{ color: "#432817" }}>
          {title}
        </h2>
        <p id={descriptionId} className="mb-8 text-center text-[14px] leading-relaxed sm:text-[18px]" style={{ color: "#8B7355" }}>
          {description}
        </p>

        <button
          ref={confirmButtonRef}
          onClick={onConfirm}
          disabled={isBusy}
          className="h-[50px] w-full rounded-[10px] text-[16px] font-black text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:h-[58px] sm:text-[20px]"
          style={{ backgroundColor: styles.color }}
        >
          {confirmText}
        </button>

        {showCancelButton && (
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={isBusy}
            className="mt-4 w-full text-center text-[16px] font-semibold transition-opacity hover:opacity-70 disabled:opacity-60 sm:text-[20px]"
            style={{ color: "#6B5746" }}
          >
            {cancelText}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
