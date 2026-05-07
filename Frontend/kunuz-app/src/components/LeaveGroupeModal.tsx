"use client";

import { useTranslations } from "next-intl";
import ConfirmActionModal from "@/components/ConfirmActionModal";

interface LeaveGroupModalProps {
  groupName: string;
  onConfirm: () => void;
  onClose: () => void;
  leaving?: boolean;
}

export default function LeaveGroupModal({ groupName, onConfirm, onClose, leaving = false }: LeaveGroupModalProps) {
  const t = useTranslations("auth.pages.home");
  return (
    <ConfirmActionModal
      isOpen
      title="Leave group?"
      description={`Are you sure you want to leave ${groupName}?`}
      confirmText={leaving ? "Leaving..." : t("community.leaveGroup")}
      onConfirm={onConfirm}
      onCancel={onClose}
      cancelText={t("community.close")}
      variant="danger"
      isBusy={leaving}
      icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      }
    />
  );
}
