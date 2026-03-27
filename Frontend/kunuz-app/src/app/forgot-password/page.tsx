"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ResetPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.errors?.email?.[0] || "Failed to send OTP.");
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-reset-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.errors?.otp_code?.[0] || "Invalid OTP.");
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otp, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.errors?.password?.[0] || "Failed to reset password.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 px-6"
      style={{ backgroundColor: "rgba(255, 248, 226, 0.85)" }}
    >
      <div className="w-full max-w-[1050px] bg-white rounded-[30px] overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row min-h-[520px]">

          {/* Left: Image Panel */}
          <div className="relative w-full md:w-[44%] min-h-[280px] md:min-h-full flex-shrink-0">
            <div className="absolute inset-4 md:inset-6 lg:inset-7 rounded-[32px] overflow-hidden">
              <Image
                src="/login.png"
                alt="Moroccan riad interior"
                fill
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* Right: Form Panel */}
          <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-10 lg:px-16">
            <div className="w-full max-w-[455px]">

              <div className="text-center mb-8 lg:mb-10">
                <h1
                  className="font-black text-4xl lg:text-[53px] leading-tight mb-4 lg:mb-6"
                  style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                >
                  {step === 1 ? "Forgot password?" : step === 2 ? "Enter Code" : "New Password"}
                </h1>

                <p
                  className="text-base lg:text-[20px] leading-snug"
                  style={{ color: "#79747E", fontFamily: "var(--font-lato)" }}
                >
                  {step === 1 
                    ? "Enter your email address to receive a verification code" 
                    : step === 2 
                    ? "We sent a 6-digit code to your email" 
                    : "Enter your new password"}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-200">
                  {error}
                </div>
              )}

              <form 
                onSubmit={step === 1 ? handleSendOtp : step === 2 ? handleVerifyOtp : handleResetPassword} 
                className="flex flex-col gap-6"
              >

                {step === 1 && (
                  <div className="flex flex-col gap-3">
                    <label htmlFor="email" className="text-base lg:text-[18px] font-normal" style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-[47px] w-full rounded-[10px] border border-[#79747E] bg-[#F2F2F2] px-4 text-base outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] transition-all"
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-3">
                    <label htmlFor="otp" className="text-base lg:text-[18px] font-normal" style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>
                      6-Digit Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      value={otp}
                      required
                      placeholder="e.g. 123456"
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className="h-[47px] w-full rounded-[10px] border border-[#79747E] bg-[#F2F2F2] px-4 text-base outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] tracking-widest text-center transition-all"
                    />
                  </div>
                )}

                {step === 3 && (
                  <>
                    <div className="flex flex-col gap-3">
                      <label htmlFor="password" className="text-base lg:text-[18px] font-normal" style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>
                        New Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        required
                        minLength={8}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-[47px] w-full rounded-[10px] border border-[#79747E] bg-[#F2F2F2] px-4 text-base outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] transition-all"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <label htmlFor="confirmPassword" className="text-base lg:text-[18px] font-normal" style={{ color: "#432817", fontFamily: "var(--font-lato)" }}>
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        required
                        minLength={8}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-[47px] w-full rounded-[10px] border border-[#79747E] bg-[#F2F2F2] px-4 text-base outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] transition-all"
                      />
                    </div>
                  </>
                )}

                <div style={{ marginTop: "40px" }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-[47px] w-full rounded-[10px] font-black text-xl text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: "#432817", fontFamily: "var(--font-lato)" }}
                  >
                    {loading ? "Please wait..." : step === 1 ? "Send Code" : step === 2 ? "Verify Code" : "Reset Password"}
                  </button>
                  
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => { setStep(1); setOtp(""); setPassword(""); setError(""); }}
                      className="mt-4 w-full text-center text-sm font-semibold hover:underline"
                      style={{ color: "#79747E" }}
                    >
                      Back to email
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}