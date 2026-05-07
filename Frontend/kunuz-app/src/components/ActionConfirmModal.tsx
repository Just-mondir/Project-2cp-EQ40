"use client";

import React from "react";
import ConfirmActionModal from "@/components/ConfirmActionModal";

const RED = "#C0392B";
type ActionConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  confirmColor?: string;
  icon?: React.ReactNode;
};

export default function ActionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Post",
  message = "Are you sure you want to delete this post? This action cannot be undone.",
  confirmText = "Delete",
  confirmColor = RED,
  icon,
}: ActionConfirmModalProps) {
  const normalized = confirmColor.toLowerCase();
  const variant =
    normalized === RED.toLowerCase() || normalized === "#ef4444"
      ? "danger"
      : normalized === "#8b6914"
        ? "warning"
        : "neutral";

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      title={title}
      description={message}
      confirmText={confirmText}
      onConfirm={onConfirm}
      onCancel={onClose}
      cancelText="Cancel"
      variant={variant}
      icon={icon}
    />
  );
}
