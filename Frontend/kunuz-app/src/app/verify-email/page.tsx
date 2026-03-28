"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  clearPendingAuthContext,
  readPendingAuthContext,
  saveAuthTokens,
  verifySignupOtp,
} from "@/lib/authApi";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const pending = readPendingAuthContext();
    if (!pending || pending.flow !== "signup") {
      setError("No pending verification was found. Please sign up again.");
      return;
    }

    setEmail(pending.email);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6).split("");
    const newCode = [...code];
    pasted.forEach((char, i) => {
      if (/^\d$/.test(char)) newCode[i] = char;
    });
    setCode(newCode);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otpCode = code.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    const pending = readPendingAuthContext();
    if (!pending || pending.flow !== "signup") {
      setError("No pending verification was found. Please sign up again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await verifySignupOtp({ userId: pending.userId, otpCode });

      saveAuthTokens(data);
      clearPendingAuthContext();
      router.push("/home-page");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "OTP verification failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 px-6"
      style={{ backgroundColor: "rgba(255, 248, 226, 0.85)" }}
    >
      <div className="w-full max-w-[1050px] bg-white rounded-[30px] overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row min-h-[520px]">
          <div className="relative w-full md:w-[44%] min-h-[280px] md:min-h-full flex-shrink-0">
            <div className="absolute inset-4 md:inset-6 lg:inset-7 rounded-[32px] overflow-hidden">
              <Image
                src="/signup.png"
                alt="Moroccan architectural interior"
                fill
                className="object-cover object-center"
              />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-10 lg:px-16">
            <div className="w-full max-w-[455px]">
              <div className="text-center mb-10 lg:mb-14">
                <h1
                  className="font-black text-4xl lg:text-[53px] leading-tight mb-4 lg:mb-6"
                  style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                >
                  Sign Up
                </h1>
                <p
                  className="text-base lg:text-[20px] leading-snug"
                  style={{ color: "#79747E", fontFamily: "var(--font-lato)" }}
                >
                  A 6-digit code has been sent to {email || "your email"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-10">
                <div className="flex flex-col gap-10">
                  <label
                    className="text-base lg:text-[18px] font-normal text-center"
                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                  >
                    Verification code
                  </label>

                  <div className="flex justify-center gap-3 md:gap-6">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="text-center font-semibold outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] transition-all"
                        style={{
                          width: "55px",
                          height: "55px",
                          borderRadius: "10px",
                          border: "0.74px solid #79747E",
                          backgroundColor: "#F2F2F2",
                          fontSize: "20px",
                          color: "#432817",
                        }}
                      />
                    ))}
                  </div>

                  {error ? (
                    <p className="text-center text-sm" style={{ color: "#B42318" }}>
                      {error}
                    </p>
                  ) : null}

                  <p
                    className="text-center text-sm lg:text-[17.85px]"
                    style={{ color: "#79747E", fontFamily: "var(--font-lato)" }}
                  >
                    Didn&apos;t receive the code? Check your email inbox or try logging in
                    again.
                  </p>
                </div>

                <div style={{ marginTop: "30px" }}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-[47px] w-full rounded-[10px] font-black text-xl text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
                    style={{ backgroundColor: "#432817", fontFamily: "var(--font-lato)" }}
                  >
                    {isSubmitting ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
