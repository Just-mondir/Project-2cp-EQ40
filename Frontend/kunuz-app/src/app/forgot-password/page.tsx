"use client";

import Image from "next/image";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
                  Reset password
                </h1>

                <p
                  className="text-base lg:text-[20px] leading-snug"
                  style={{ color: "#79747E", fontFamily: "var(--font-lato)" }}
                >
                  Enter your email and the new password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Email */}
                <div className="flex flex-col gap-3">
                  <label
                    htmlFor="email"
                    className="text-base lg:text-[18px] font-normal"
                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-[47px] w-full rounded-[10px] border border-[#79747E] bg-[#F2F2F2] px-4 text-base outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] transition-all"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-3">
                  <label
                    htmlFor="password"
                    className="text-base lg:text-[18px] font-normal"
                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-[47px] w-full rounded-[10px] border border-[#79747E] bg-[#F2F2F2] px-4 text-base outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] transition-all"
                  />
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-3">
                  <label
                    htmlFor="confirmPassword"
                    className="text-base lg:text-[18px] font-normal"
                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-[47px] w-full rounded-[10px] border border-[#79747E] bg-[#F2F2F2] px-4 text-base outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] transition-all"
                  />
                </div>

               
                {/* Done Button */}
<div style={{ marginTop: "40px" }}>
  <button
    type="submit"
    className="h-[47px] w-full rounded-[10px] font-black text-xl text-white transition-opacity hover:opacity-90 active:opacity-80"
    style={{ backgroundColor: "#432817", fontFamily: "var(--font-lato)" }}
  >
    Done
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