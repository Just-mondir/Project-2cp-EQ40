"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import NotificationPanel from "@/components/Notificationpanel";
import ModeratorReportModal from "@/components/ModeratorReportModal";

export default function NotificationsPage() {
  const router = useRouter();
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <NotificationPanel
        onClose={() => router.back()}
        onReportClick={(id) => setActiveReportId(id)}
      />
      {activeReportId && (
        <ModeratorReportModal
          reportId={activeReportId}
          onClose={() => setActiveReportId(null)}
        />
      )}
    </main>
  );
}
