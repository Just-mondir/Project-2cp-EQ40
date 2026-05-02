"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";

export default function MonumentsInDangerPage() {
  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>

      <LeftSidebar activePage="help" />

      <div className="flex flex-col flex-1 overflow-y-auto ml-0 md:ml-[68px]">
        {/* Back Button */}
        <div className="px-4 md:px-8 pt-6">
          <BackButton />
        </div>
        {/* Header */}
        <div className="text-center py-6 md:py-10">
          <p style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "28px" }}>
            Welcome to the help page !
          </p>
          <p style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "24px" }}>
            Monuments in Danger!
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-7 px-4 md:px-16 pb-10">

          {/* How to Report a Monument in Danger */}
          <div
            style={{
              backgroundColor: "rgba(67, 40, 23, 0.10)",
              border: "2px solid #432817",
              borderRadius: "10px",
              padding: "24px 24px 24px 24px",
            }}
          >
            <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "20px", marginBottom: "16px" }}>
              How to Report a Monument in Danger?
            </p>
            <ol style={{ color: "#000000", fontFamily: "var(--font-lato), sans-serif", fontWeight: 400, fontSize: "15px", lineHeight: "24px", paddingLeft: "20px", listStyleType: "decimal" }}>
              <li>Go to the <strong>"Monuments in Danger"</strong> section from the menu.</li>
              <li>Click on <strong>"Report a Monument"</strong>.</li>
              <li>Enter the name of the monument.</li>
              <li>Add the location (city or exact address).</li>
              <li>Select the urgency level (low, medium, high).</li>
              <li>Upload clear photos showing the damage.</li>
              <li>Provide a short description explaining the situation.</li>
              <li>Click <strong>"Submit Report"</strong> to send your request.</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}