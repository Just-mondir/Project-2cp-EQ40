"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";

import {
  clearPendingAuthContext,
  loginUser,
  saveAuthTokens,
} from "@/lib/authApi";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setIsSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await loginUser({
        email: normalizedEmail,
        password,
      });

      saveAuthTokens(response);
      clearPendingAuthContext();

      // Check if the user still needs to complete their profile
      const user = response.user as Record<string, unknown> | undefined;
      router.push("/home-page");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Login failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setError("");
      try {
        // Exchange Google access token for an id_token via userinfo
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        if (!userInfoRes.ok) throw new Error("Failed to fetch Google user info.");

        // The backend needs an id_token; use the code flow instead
        // We use the access_token path: send it to a dedicated endpoint
        // Actually, let's hit our backend with the access_token directly
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

        const res = await fetch(`${API_BASE}/auth/google/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data = await res.json();
        if (!res.ok || !data?.data) {
          throw new Error(data?.message ?? "Google authentication failed.");
        }

        saveAuthTokens(data.data);
        clearPendingAuthContext();

        const user = data.data.user as Record<string, unknown> | undefined;
        router.push("/home-page");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Google login failed.";
        setError(msg);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Google sign-in was cancelled or failed. Please try again.");
    },
  });

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
                src="/login.png"
                alt="Moroccan riad interior"
                fill
                className="object-cover object-center"
              />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-10 lg:px-16">
            <div className="w-full max-w-[455px]">
              <div className="text-center mb-8 lg:mb-10">
                <h1
                  className="font-black text-4xl lg:text-[53px] leading-tight mb-4 lg:mb-6"
                  style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                >
                  Login
                </h1>

                <p
                  className="text-base lg:text-[20px] leading-snug"
                  style={{ color: "#79747E", fontFamily: "var(--font-lato)" }}
                >
                  Welcome back! Please login to your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
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
                    required
                    className="h-[47px] w-full rounded-[10px] border border-[#79747E] bg-[#F2F2F2] px-4 text-base outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
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
                    required
                    className="h-[47px] w-full rounded-[10px] border border-[#79747E] bg-[#F2F2F2] px-4 text-base outline-none focus:ring-2 focus:ring-[#432817] focus:border-[#432817] transition-all"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ color: "#79747E", fontFamily: "var(--font-lato)" }}
                  >
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#79747E] accent-[#432817] cursor-pointer"
                    />
                    <span className="text-base lg:text-[18px]">Remember me</span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-base lg:text-[18px] font-bold hover:underline transition-all"
                    style={{ color: "#432817", fontFamily: "var(--font-lato)" }}
                  >
                    Forgot password? Reset
                  </Link>
                </div>

                {error ? (
                  <p className="text-sm" style={{ color: "#B42318" }}>
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="mt-4 h-[47px] w-full rounded-[10px] font-black text-xl text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
                  style={{ backgroundColor: "#432817", fontFamily: "var(--font-lato)" }}
                >
                  {isSubmitting ? "Logging In..." : "Login"}
                </button>

                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-[#E0E0E0]" />
                  <span
                    className="text-sm"
                    style={{ color: "#79747E", fontFamily: "var(--font-lato)" }}
                  >
                    or login using
                  </span>
                  <div className="flex-1 h-px bg-[#E0E0E0]" />
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleGoogleSuccess()}
                    disabled={isGoogleLoading || isSubmitting}
                    className="w-[56px] h-[56px] rounded-[14px] bg-[#F2F2F2] flex items-center justify-center hover:bg-[#E8E8E8] transition-colors disabled:opacity-60"
                    title="Continue with Google"
                  >
                    {isGoogleLoading ? (
                      <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#432817" strokeWidth="4"/>
                        <path className="opacity-75" fill="#432817" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <Image
                        src="/google.png"
                        alt="Google"
                        width={27}
                        height={27}
                        className="object-contain"
                      />
                    )}
                  </button>
                </div>

                <p
                  className="text-center text-base lg:text-[18px]"
                  style={{ color: "#79747E", fontFamily: "var(--font-lato)" }}
                >
                  New User?{" "}
                  <Link
                    href="/sign-up"
                    className="font-bold hover:underline transition-all"
                    style={{ color: "#432817" }}
                  >
                    Sign Up
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


