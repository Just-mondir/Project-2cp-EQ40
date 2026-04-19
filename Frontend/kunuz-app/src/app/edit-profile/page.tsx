"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";
import ProfileForm from "@/components/ProfileForm";

export default function EditProfilePage() {
  const router = useRouter();

  // ← CHANGED: using object instead of separate state
  const [profileData, setProfileData] = useState({
    profileImage: null as string | null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ← CHANGED: updates the object
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfileData(prev => ({
        ...prev,
        profileImage: reader.result as string,
      }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--background)" }}>

      {/* Sidebar */}
      <LeftSidebar activePage="edit-profile" />

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden ml-[68px]">

        {/* Back button */}
        <div className="px-8 pt-6 pb-2 flex-shrink-0">
          <BackButton />
        </div>

        {/* Two-panel content */}
        <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6">

          {/* Left panel: Title + Photo Upload */}
          <div className="w-[300px] flex flex-col flex-shrink-0 overflow-hidden">

            {/* Title */}
            <div className="pb-4 flex-shrink-0" style={{ marginTop: "43px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-lato), 'Lato', sans-serif",
                  fontSize: "30px",
                  fontWeight: 700,
                  color: "#432817",
                  lineHeight: 1.2,
                }}
              >
                Edit profile
              </h1>
            </div>

            {/* Photo Upload */}
            <div
              className="flex flex-col items-center gap-3 cursor-pointer"
              style={{ marginTop: "43px" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="flex items-center justify-center relative"
                style={{
                  width: "276px",
                  height: "276px",
                  borderRadius: "10px",
                  border: "1px dashed #D6CFC3",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {/* ← CHANGED: using profileData.profileImage */}
                {profileData.profileImage ? (
                  <img
                    src={profileData.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 relative">
                    <svg width="93" height="93" viewBox="0 0 80 80" fill="none">
                      <path
                        d="M35.828 79.8921C18.871 78.036 4.88979 65.7502 0.991813 49.2802C0.181794 45.8577 -0.00990431 44.0346 0.0003866 39.8516C0.00839352 36.5976 0.0730723 35.5606 0.380317 33.7605C1.53154 27.0156 3.99956 21.2332 7.99458 15.9205C19.5391 0.568295 40.4757 -4.38339 57.7147 4.16121C69.9728 10.237 78.0025 21.5783 79.7937 35.3459C79.9072 36.2178 80 38.3205 80 40.0185C80 46.7505 78.5836 52.5899 75.5271 58.4586C69.5664 69.9037 58.7477 77.6552 45.936 79.6603C43.9327 79.9738 37.849 80.1133 35.828 79.8921ZM12.9374 57.934C19.3207 52.1713 26.6965 48.7899 35.3268 47.6696C37.37 47.4044 42.6397 47.4044 44.6829 47.6696C53.3064 48.789 60.7576 52.2027 67.0708 57.9265C67.9438 58.7179 68.7094 59.368 68.7721 59.371C68.8349 59.3741 69.2701 58.7415 69.7394 57.9655C72.9235 52.7003 74.7502 46.2157 74.7548 40.1613C74.7651 26.82 67.2333 14.7164 55.2921 8.88507C47.0294 4.8501 37.8818 4.21588 29.1524 7.07274C16.1028 11.3435 6.96528 22.7126 5.42302 36.5975C4.76903 42.4852 5.95058 49.2695 8.59952 54.8365C9.47195 56.67 11.0486 59.38 11.2376 59.371C11.3003 59.3678 12.0652 58.7213 12.9374 57.934ZM37.3316 42.446C33.7586 41.7846 31.1606 40.3997 28.5603 37.7702C22.4774 31.6192 22.4676 21.8037 28.5379 15.5168C31.7008 12.241 36.3787 10.4224 40.9124 10.706C46.721 11.0694 51.7377 14.3834 54.3394 19.5758C56.9133 24.7127 56.473 30.9361 53.192 35.796C52.8944 36.2368 51.9628 37.2733 51.1219 38.0994C48.9795 40.2038 46.5112 41.584 43.6589 42.2724C42.1343 42.6403 38.8659 42.73 37.3316 42.446Z"
                        fill="#79747e"
                        fillOpacity="0.6"
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(121, 116, 126, 0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid white",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
              <p style={{ color: "#79747E", fontFamily: "Lato, sans-serif", fontSize: "17px" }}>
                Upload profile photo
              </p>
            </div>
          </div>

          {/* Right panel: ProfileForm */}
          <div
            className="flex-1 overflow-hidden flex flex-col post-panel-right post-form-panel"
            style={{
              backgroundColor: "#F7F5EF",
              borderRadius: 0,
              border: "1px solid rgba(0, 0, 0, 0.1)",
            }}
          >
            <ProfileForm
              onCancel={() => router.back()}
              onDone={() => router.back()}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
