"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";

export default function SearchFiltersPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>

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
            Search by Filter!
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-7 px-16 pb-10">

          {/* How to Search Using Filters */}
          <div
            style={{
              backgroundColor: "rgba(67, 40, 23, 0.10)",
              border: "2px solid #432817",
              borderRadius: "10px",
              padding: "60px 64px 66px 64px",
            }}
          >
            <p style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, fontSize: "35px", marginBottom: "16px" }}>
              How to Search Using Filters?
            </p>
            <ol style={{ color: "#000000", fontFamily: "...", fontWeight: 400, fontSize: "20px", lineHeight: "30px", paddingLeft: "20px", listStyleType: "decimal" }}>
              <li>Go to the News Feed page.</li>
              <li>Use the Search Bar to type keywords related to a monument or topic.</li>
              <li>Click on the Filter option to refine your search.</li>
              <li>Select the desired Historical Period.</li>
              <li>Choose the appropriate Monument Type.</li>
              <li>Select the Region.</li>
              <li>Choose the Post Type if needed.</li>
              <li>Click <strong>"Apply Filters"</strong> to display the results.</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}