"use client";
/*Verify-email*/
import Image from "next/image";
import { useState, useRef } from "react";
import Link from "next/link";

export default function VerificationPage() {

  // ← CHANGED: wrapped code array inside formData object
  const [formData, setFormData] = useState({
    code: ["", "", "", "", "", ""],
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...formData.code];        // ← CHANGED
    newCode[index] = value.slice(-1);
    setFormData(prev => ({ ...prev, code: newCode }));  // ← CHANGED
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !formData.code[index] && index > 0) {  // ← CHANGED
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6).split("");
    const newCode = [...formData.code];        // ← CHANGED
    pasted.forEach((char, i) => {
      if (/^\d$/.test(char)) newCode[i] = char;
    });
    setFormData(prev => ({ ...prev, code: newCode }));  // ← CHANGED
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                src="/signup.png"
                alt="Moroccan architectural interior"
                fill
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* Right: Form Panel */}
          <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-10 lg:px-16">
            <div className="w-full max-w-[455px]">

              {/* Header */}
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
                  A 6-digit code has been sent to email
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-10">

                {/* Verification Code Section */}
                <div className="flex flex-col gap-10">

                  <label
                    className="text-base lg:text-[18px] font-normal text-center"
                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                  >
                    Verification code
                  </label>

                  {/* 6 Boxes */}
                  <div className="flex justify-center gap-6">
                    {formData.code.map((digit, index) => (   // ← CHANGED
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
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

                  {/* Resend */}
                  <p
                    className="text-center text-sm lg:text-[17.85px]"
                    style={{ color: "#79747E", fontFamily: "var(--font-lato)" }}
                  >
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      className="font-bold hover:underline transition-all"
                      style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                    >
                      Resend Code
                    </button>
                  </p>

                </div>

                {/* Next Button */}
                <div style={{ marginTop: "60px" }}>
                  <Link href="/Set-Profile">
                    <button
                      type="submit"
                      className="h-[47px] w-full rounded-[10px] font-black text-xl text-white transition-opacity hover:opacity-90 active:opacity-80"
                      style={{ backgroundColor: "#432817", fontFamily: "var(--font-lato)" }}
                    >
                      Next
                    </button>
                  </Link>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}