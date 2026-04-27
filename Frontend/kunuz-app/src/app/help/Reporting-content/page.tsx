"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";


export default function ReportingContentPage() {
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
            Reporting Content!
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-7 px-16 pb-10">

          {/* How to Report Inappropriate Content */}
          <div
            style={{
              backgroundColor: "rgba(67, 40, 23, 0.10)",
              border: "2px solid #432817",
              borderRadius: "10px",
              padding: "72px 58px 86px 58px",
            }}
          >
            <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "35px", marginBottom: "16px" }}>
              How to Report Inappropriate Content?
            </p>
            <ol style={{ color: "#000000", fontFamily: "...", fontWeight: 400, fontSize: "20px", lineHeight: "30px", paddingLeft: "20px", listStyleType: "decimal" }}>
              <li>Click on the <strong>"Report"</strong> option (usually available in the post menu).</li>
              <li>Select the reason for reporting (spam, inappropriate content, false information, etc.).</li>
              <li>Provide additional details if required.</li>
              <li>Click <strong>"Submit"</strong> to send your request.</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}