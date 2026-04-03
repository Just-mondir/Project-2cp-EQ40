"use client";

import { useRouter } from "next/navigation";
import NotificationPanel from "@/components/Notificationpanel";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF8E2] via-[#F8EDD8] to-[#F3E4CB]">
      <NotificationPanel onClose={() => router.back()} />
    </main>
  );
}
