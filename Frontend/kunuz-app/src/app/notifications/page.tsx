"use client";

import { useRouter } from "next/navigation";
import NotificationPanel from "@/components/Notificationpanel";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <NotificationPanel onClose={() => router.back()} />
    </main>
  );
}
