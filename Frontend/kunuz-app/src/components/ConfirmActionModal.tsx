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

/** Approved interactive colors only: brown #432817, green, red (+ white confirm text where needed). */
const PALETTE = {
  espresso: "#432817",
  offwhite: "#F7F5EF",
  red: "#C0392B",
  /** Same green as JoinRequestSentModal (JoinRequestModel.tsx) */
  green: "#168F66",
};

const VARIANT_STYLES: Record<
  ConfirmActionVariant,
  {
    confirmBg: string;
    confirmText: string;
    iconStroke: string;
    circleBorder: string;
    circleBg: string;
  }
> = {
  danger: {
    confirmBg: PALETTE.red,
    confirmText: "#FFFFFF",
    iconStroke: PALETTE.red,
    circleBorder: PALETTE.red,
    circleBg: "rgba(192,57,43,0.07)",
  },
  warning: {
    confirmBg: PALETTE.green,
    confirmText: "#FFFFFF",
    iconStroke: PALETTE.green,
    circleBorder: PALETTE.green,
    circleBg: "rgba(22,143,102,0.07)",
  },
  neutral: {
    confirmBg: PALETTE.espresso,
    confirmText: "#FFFFFF",
    iconStroke: PALETTE.espresso,
    circleBorder: PALETTE.espresso,
    circleBg: "rgba(67,40,23,0.06)",
  },
};

function VariantIcon({ variant }: { variant: ConfirmActionVariant }) {
  const color = VARIANT_STYLES[variant].iconStroke;
  if (variant === "warning") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (variant === "neutral") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    if (showCancelButton) cancelButtonRef.current?.focus();
    else confirmButtonRef.current?.focus();

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
        className="relative z-[20001] w-full max-w-[400px] rounded-[22px] px-6 pb-5 pt-7 shadow-[0_24px_64px_rgba(0,0,0,0.28)] sm:px-7 sm:pb-6 sm:pt-8"
        style={{ backgroundColor: PALETTE.offwhite, fontFamily: "var(--font-lato), 'Lato', sans-serif" }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] sm:h-[52px] sm:w-[52px]"
          style={{ borderColor: styles.circleBorder, backgroundColor: styles.circleBg }}
        >
          {icon ?? <VariantIcon variant={variant} />}
        </div>

        <h2
          id={titleId}
          className="mb-1.5 text-center text-[20px] font-black leading-snug sm:text-[26px]"
          style={{ color: PALETTE.espresso }}
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mb-5 text-center text-[13px] leading-snug sm:mb-6 sm:text-[15px]"
          style={{ color: PALETTE.espresso, opacity: 0.76 }}
        >
          {description}
        </p>

        <button
          ref={confirmButtonRef}
          onClick={onConfirm}
          disabled={isBusy}
          className="h-[44px] w-full rounded-[10px] text-[14px] font-black transition-opacity hover:opacity-90 disabled:opacity-60 sm:h-[48px] sm:text-[15px]"
          style={{ backgroundColor: styles.confirmBg, color: styles.confirmText }}
        >
          {confirmText}
        </button>

        {showCancelButton && (
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={isBusy}
            className="mt-3 w-full text-center text-[13px] font-semibold transition-opacity hover:opacity-70 disabled:opacity-60 sm:mt-[14px] sm:text-[14px]"
            style={{ color: PALETTE.espresso, opacity: 0.82 }}
          >
            {cancelText}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
