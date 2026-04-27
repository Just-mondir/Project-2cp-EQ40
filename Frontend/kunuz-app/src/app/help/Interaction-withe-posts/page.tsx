"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";


export default function InteractionWithPostsPage() {
  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>

      <LeftSidebar activePage="help" />

      <div className="flex flex-col flex-1 overflow-y-auto ml-[68px]">
        {/* Back Button */}
                <div className="px-8 pt-6">
                     <BackButton bgColor="#FFF8E2" />
                </div>
        {/* Header */}
        <div className="text-center py-10">
          <p style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "45px" }}>
            Welcome to the help page !
          </p>
          <p style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "40px" }}>
            Interaction with Posts!
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-7 px-16 pb-10">

          {/* How to Interact with a Post */}
          <div
            style={{
              backgroundColor: "rgba(67, 40, 23, 0.10)",
              border: "2px solid #432817",
              borderRadius: "10px",
              padding: "52px 53px 99px 53px",
            }}
          >
            <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "35px", marginBottom: "16px" }}>
              How to Interact with a Post?
            </p>
            <ol style={{ color: "#000000", fontFamily: "...", fontWeight: 400, fontSize: "20px", lineHeight: "30px", paddingLeft: "20px", listStyleType: "decimal" }}>
              <li>Browse the News Feed to view publications shared by other users.</li>
              <li>Click the <strong>"Gem"</strong> button to show your appreciation.</li>
              <li>Click <strong>"Comment"</strong> to write and share your opinion.</li>
              <li>Click <strong>"Share"</strong> to repost the publication on your profile.</li>
            </ol>
          </div>

          {/* How to Report a Post */}
          <div
            style={{
              backgroundColor: "rgba(67, 40, 23, 0.10)",
              border: "2px solid #432817",
              borderRadius: "10px",
              padding: "38px 53px 32px 53px",
            }}
          >
            <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "35px", marginBottom: "16px" }}>
              How to Report a Post?
            </p>
            <ol style={{ color: "#000000", fontFamily: "...", fontWeight: 400, fontSize: "20px", lineHeight: "30px", paddingLeft: "20px", listStyleType: "decimal" }}>
              <li>Click on the <strong>"Report"</strong> option if you find inappropriate content.</li>
              <li>Select the reason for reporting.</li>
              <li>Submit your report for review by the administration team.</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}