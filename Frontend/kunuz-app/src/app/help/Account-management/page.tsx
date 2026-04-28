"use client";

import LeftSidebar from "@/components/LeftSidebar";
import BackButton from "@/components/BackButton";

export default function AccountManagementPage() {
  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: "#FFF8E2" }}>

      <LeftSidebar activePage="help" />

      <div className="flex flex-col flex-1 overflow-y-auto md:ml-[68px]">
        {/* Back Button */}
        <div className="px-4 md:px-8 pt-6">
             <BackButton bgColor="#FFF8E2" />
        </div>
        {/* Header */}
        <div className="text-center py-6 md:py-10 px-4">
          <p className="text-2xl md:text-[45px] font-normal leading-tight" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
            Welcome to the help page!
          </p>
          <p className="text-xl md:text-[40px] font-normal mt-2" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
            Account Management
          </p>
        </div>

        {/* Content — ALL cards inside here */}
        <div className="flex flex-col gap-7 px-4 md:px-16 pb-10">

          {/* How to Sign Up */}
          <div style={{ backgroundColor: "rgba(67, 40, 23, 0.10)", border: "2px solid #432817", borderRadius: "10px", padding: "18px 25px 57px 25px" }}>
            <p className="text-xl md:text-[35px] font-normal mb-3" style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
              how to Sign Up
            </p>
            <ol className="text-sm md:text-[20px] leading-relaxed md:leading-[30px]" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, paddingLeft: "20px", listStyleType: "decimal" }}>
              <li>Click <strong>"Sign Up"</strong></li>
              <li>Fill your email, Password and confirm it.</li>
              <li>Click <strong>"Next"</strong></li>
              <li>If you already have an Account, Click on <strong>"Login"</strong></li>
            </ol>
          </div>

          {/* How to Login */}
          <div style={{ backgroundColor: "rgba(67, 40, 23, 0.10)", border: "2px solid #432817", borderRadius: "10px", padding: "19px 24px 70px 24px" }}>
            <p className="text-xl md:text-[35px] font-normal mb-3" style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
              how to Login
            </p>
            <ol className="text-sm md:text-[20px] leading-relaxed md:leading-[30px]" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, paddingLeft: "20px", listStyleType: "decimal" }}>
              <li>If you already have an account, click on <strong>"Login"</strong>.</li>
              <li>Enter your Username.</li>
              <li>Enter your Password.</li>
              <li>Check <strong>"Remember Me"</strong> to stay logged in on your device.</li>
              <li>Click <strong>"Login"</strong> to access your account.</li>
            </ol>
            <div style={{ marginTop: "12px" }}>
              <p className="text-base md:text-[20px] font-bold" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", lineHeight: "30px" }}>
                Forgot Your Password?
              </p>
              <p className="text-sm md:text-[20px] leading-relaxed md:leading-[30px]" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400 }}>
                • Click on <strong>"Forgot Password?"</strong>.<br />
                • Select <strong>"Reset"</strong>.<br />
                • Follow the instructions sent to your email to create a new password.
              </p>
            </div>
            <p className="text-sm md:text-[20px] leading-relaxed md:leading-[30px] mt-3" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400 }}>
              • You can log in instantly using <strong>Google</strong>, or if you are a new user, click <strong>"Sign Up"</strong> to create an account.
            </p>
          </div>

          {/* How to Edit Your Profile */}
          <div style={{ backgroundColor: "rgba(67, 40, 23, 0.10)", border: "2px solid #432817", borderRadius: "10px", padding: "19px 24px 57px 24px" }}>
            <p className="text-xl md:text-[35px] font-normal mb-3" style={{ color: "#432817", fontFamily: "var(--font-lato), 'Lato', sans-serif" }}>
              How to Edit Your Profile?
            </p>
            <ol className="text-sm md:text-[20px] leading-relaxed md:leading-[30px]" style={{ color: "#000000", fontFamily: "var(--font-lato), 'Lato', sans-serif", fontWeight: 400, paddingLeft: "20px", listStyleType: "decimal" }}>
              <li>Go to your Profile page.</li>
              <li>Click on <strong>"Edit Profile"</strong>.</li>
              <li>Update your personal information.</li>
              <li>Change your profile picture if needed.</li>
              <li>Click <strong>"Done"</strong>.</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}