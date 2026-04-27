"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";

export default function CreatingPostsPage() {
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
            Creating a Publication!
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-7 px-16 pb-10">

          {/* How to Create a Publication */}
          <div
            style={{
              backgroundColor: "rgba(67, 40, 23, 0.10)",
              border: "2px solid #432817",
              borderRadius: "10px",
              padding: "47px 79px 13px 79px",
            }}
          >
            <p
              style={{
                color: "#432817",
                fontFamily: "var(--font-lato), 'Lato', sans-serif",
                fontWeight: 400,
                fontSize: "35px",
                marginBottom: "16px",
              }}
            >
              How to Create a Publication?
            </p>

            <ol style={{ color: "#000000", fontFamily: "...", fontWeight: 400, fontSize: "20px", lineHeight: "30px", paddingLeft: "20px", listStyleType: "decimal" }}>
              <li>After logging in, go to your Home Page.</li>
              <li>Click on the <strong>"Create Publication"</strong> button.</li>
              <li>Enter a clear Title for your post.</li>
              <li>Write a detailed Description explaining the monument or topic.</li>
              <li>Upload relevant images to illustrate your publication.</li>
              <li>Add a short picture description if required.</li>
              <li>
                Choose the appropriate labels:
                <ul
                  style={{
                    paddingLeft: "24px",
                    marginTop: "4px",
                    listStyleType: "disc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <li>Post Type</li>
                  <li>Historical Period</li>
                  <li>Monument Type</li>
                  <li>Region</li>
                </ul>
              </li>
              <li>Add the location of the monument.</li>
              <li>Select the visibility settings (public or private).</li>
              <li>Click <strong>"Done"</strong> to share your post.</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}