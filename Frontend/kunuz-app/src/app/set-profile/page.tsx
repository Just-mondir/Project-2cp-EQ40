"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AddDocuments from "@/components/AddDocuments";

const expertiseOptions = ["Amateur", "Student", "Researcher", "Historian", "Tour Guide", "Architect"];
const MAX_USERNAME_ATTEMPTS = 5;

const slugifyForUsername = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const randomSuffix = () => Math.random().toString(36).substring(2, 6);

const pickFirstErrorMessage = (errors: unknown): string | null => {
  if (!errors) return null;
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) {
    for (const entry of errors) {
      if (typeof entry === "string") {
        return entry;
      }
      const nested = pickFirstErrorMessage(entry);
      if (nested) {
        return nested;
      }
    }
    return null;
  }
  if (typeof errors === "object") {
    for (const value of Object.values(errors as Record<string, unknown>)) {
      const nested = pickFirstErrorMessage(value);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
};

const extractBackendErrorMessage = (body: any, fallback: string): string => {
  if (body?.errors?.detail && typeof body.errors.detail === "string") {
    return body.errors.detail;
  }
  const nested = pickFirstErrorMessage(body?.errors);
  if (nested) {
    return nested;
  }
  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message;
  }
  return fallback;
};

const isUsernameConflictResponse = (body: any): boolean => {
  const usernameError = pickFirstErrorMessage(body?.errors?.username);
  if (!usernameError) {
    return false;
  }
  const normalized = usernameError.toLowerCase();
  return normalized.includes("username") || normalized.includes("exists");
};

const persistAuthUser = (payload: any) => {
  if (!payload) {
    return;
  }
  try {
    localStorage.setItem("authUser", JSON.stringify(payload));
  } catch {
    // Ignore write failures (e.g., storage disabled).
  }
};

export default function SetProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [biography, setBiography] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("Researcher");
  const [speciality, setSpeciality] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const expertiseMap: Record<string, string> = {
        "Amateur": "amateur",
        "Student": "student",
        "Researcher": "researcher",
        "Historian": "historian",
        "Tour Guide": "guide",
        "Architect": "architect",
      };

      const displayName = `${firstName} ${lastName}`.trim();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

      const basePayload: Record<string, string> = {
        expertise: expertiseMap[selectedExpertise] || selectedExpertise.toLowerCase(),
      };

      if (displayName) {
        basePayload.display_name = displayName;
      }
      if (biography) {
        basePayload.bio = biography;
      }
      if (speciality) {
        basePayload.speciality = speciality;
      }

      const callProfileUpdate = async (usernameOverride?: string) => {
        const payload: Record<string, string> = { ...basePayload };
        if (usernameOverride) {
          payload.username = usernameOverride;
        }
        const response = await fetch(`${API_BASE_URL}/users/me/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        let body: any = {};
        try {
          body = await response.json();
        } catch {
          body = {};
        }
        return { ok: response.ok, body };
      };

      let profileBody: any | null = null;

      if (displayName) {
        const baseSlug = slugifyForUsername(displayName) || `member-${randomSuffix()}`;
        let attempt = 0;
        let currentSlug = baseSlug;
        while (attempt < MAX_USERNAME_ATTEMPTS) {
          const result = await callProfileUpdate(currentSlug);
          if (result.ok) {
            profileBody = result.body;
            break;
          }
          if (isUsernameConflictResponse(result.body)) {
            currentSlug = `${baseSlug}-${randomSuffix()}`;
            attempt += 1;
            continue;
          }
          throw new Error(
            extractBackendErrorMessage(result.body, "Failed to update profile form"),
          );
        }
        if (!profileBody) {
          throw new Error(
            "We couldn't find a unique username. Please tweak your name and try again.",
          );
        }
      } else {
        const result = await callProfileUpdate();
        if (!result.ok) {
          throw new Error(
            extractBackendErrorMessage(result.body, "Failed to update profile form"),
          );
        }
        profileBody = result.body;
      }

      persistAuthUser(profileBody?.data);

      if (profileFile) {
        const formData = new FormData();
        formData.append("profile_picture", profileFile);

        const picResponse = await fetch(`${API_BASE_URL}/users/me/profile-picture/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });

        let picData: any = {};
        try {
          picData = await picResponse.json();
        } catch {
          picData = {};
        }

        if (!picResponse.ok) {
          throw new Error(
            extractBackendErrorMessage(picData, "Failed to upload profile picture"),
          );
        }

        const updatedFromPicture = picData?.data?.user ?? picData?.data;
        persistAuthUser(updatedFromPicture);
      }

      router.push("/home-page");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const [showModal, setShowModal] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 px-6"
      style={{ backgroundColor: "#FFF8E2" }}
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
          <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-10 lg:px-14">
            <div className="w-full max-w-[420px] flex flex-col" style={{ gap: "20px" }}>

              {/* Header */}
              <div className="text-center">
                <h1
                  className="leading-tight mb-2"
                  style={{
                    color: "#432817",
                    fontFamily: "var(--font-lato)",
                    fontWeight: 900,
                    fontSize: "40px",
                  }}
                >
                  Set Profile Information
                </h1>
                <p
                  style={{
                    color: "#79747E",
                    fontFamily: "var(--font-lato)",
                    fontWeight: 400,
                    fontSize: "16px",
                  }}
                >
                  These information will be visible on your profile
                </p>
              </div>

              {/* Profile Picture */}
<div className="flex justify-center">
  <div
    className="relative cursor-pointer"
    style={{ width: "64px", height: "64px" }}
    onClick={() => fileInputRef.current?.click()}
  >
    {profileImage ? (
      <img
        src={profileImage}
        alt="Profile"
        className="w-full h-full rounded-full object-cover"
      />
    ) : (
      <svg
        width="64"
        height="64"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M35.828 79.8921C18.871 78.036 4.88979 65.7502 0.991813 49.2802C0.181794 45.8577 -0.00990431 44.0346 0.0003866 39.8516C0.00839352 36.5976 0.0730723 35.5606 0.380317 33.7605C1.53154 27.0156 3.99956 21.2332 7.99458 15.9205C19.5391 0.568295 40.4757 -4.38339 57.7147 4.16121C69.9728 10.237 78.0025 21.5783 79.7937 35.3459C79.9072 36.2178 80 38.3205 80 40.0185C80 46.7505 78.5836 52.5899 75.5271 58.4586C69.5664 69.9037 58.7477 77.6552 45.936 79.6603C43.9327 79.9738 37.849 80.1133 35.828 79.8921ZM12.9374 57.934C19.3207 52.1713 26.6965 48.7899 35.3268 47.6696C37.37 47.4044 42.6397 47.4044 44.6829 47.6696C53.3064 48.789 60.7576 52.2027 67.0708 57.9265C67.9438 58.7179 68.7094 59.368 68.7721 59.371C68.8349 59.3741 69.2701 58.7415 69.7394 57.9655C72.9235 52.7003 74.7502 46.2157 74.7548 40.1613C74.7651 26.82 67.2333 14.7164 55.2921 8.88507C47.0294 4.8501 37.8818 4.21588 29.1524 7.07274C16.1028 11.3435 6.96528 22.7126 5.42302 36.5975C4.76903 42.4852 5.95058 49.2695 8.59952 54.8365C9.47195 56.67 11.0486 59.38 11.2376 59.371C11.3003 59.3678 12.0652 58.7213 12.9374 57.934ZM37.3316 42.446C33.7586 41.7846 31.1606 40.3997 28.5603 37.7702C22.4774 31.6192 22.4676 21.8037 28.5379 15.5168C31.7008 12.241 36.3787 10.4224 40.9124 10.706C46.721 11.0694 51.7377 14.3834 54.3394 19.5758C56.9133 24.7127 56.473 30.9361 53.192 35.796C52.8944 36.2368 51.9628 37.2733 51.1219 38.0994C48.9795 40.2038 46.5112 41.584 43.6589 42.2724C42.1343 42.6403 38.8659 42.73 37.3316 42.446Z"
          fill="#79747E"
        />
      </svg>
    )}

    {/* Plus badge top-right */}
    <div
      style={{
        position: "absolute",
        top: "-4px",
        right: "-4px",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundColor: "#79747E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid white",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.909 15.0908H6.36353V12.909H12.909V6.36353H15.0908V12.909H21.6363V15.0908H15.0908V21.6363H12.909V15.0908Z" fill="white"/>
      </svg>
    </div>

    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleImageChange}
    />
  </div>
</div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "13px" }}>

                {/* First Name */}
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <label
                    htmlFor="firstName"
                    style={{
                      color: "#432817",
                      fontFamily: "var(--font-lato)",
                      fontWeight: 400,
                      fontSize: "17.85px",
                    }}
                  >
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full outline-none focus:ring-2 focus:ring-[#432817] transition-all"
                    style={{
                      height: "47px",
                      borderRadius: "10px",
                      border: "0.74px solid #79747E",
                      backgroundColor: "#F2F2F2",
                      padding: "0 12px",
                      fontSize: "16px",
                    }}
                  />
                </div>

                {/* Last Name */}
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <label
                    htmlFor="lastName"
                    style={{
                      color: "#432817",
                      fontFamily: "var(--font-lato)",
                      fontWeight: 400,
                      fontSize: "17.85px",
                    }}
                  >
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full outline-none focus:ring-2 focus:ring-[#432817] transition-all"
                    style={{
                      height: "47px",
                      borderRadius: "10px",
                      border: "0.74px solid #79747E",
                      backgroundColor: "#F2F2F2",
                      padding: "0 12px",
                      fontSize: "16px",
                    }}
                  />
                </div>

                {/* Biography */}
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <label
                    htmlFor="biography"
                    style={{
                      color: "#432817",
                      fontFamily: "var(--font-lato)",
                      fontWeight: 400,
                      fontSize: "17.85px",
                    }}
                  >
                    Biography
                  </label>
                  <textarea
                    id="biography"
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    className="w-full outline-none focus:ring-2 focus:ring-[#432817] transition-all"
                    style={{
                      height: "61px",
                      borderRadius: "10px",
                      border: "0.74px solid #79747E",
                      backgroundColor: "#F2F2F2",
                      padding: "8px 12px",
                      fontSize: "16px",
                      resize: "none",
                    }}
                  />
                </div>

                {/* Expertise */}
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <label
                    style={{
                      color: "#432817",
                      fontFamily: "var(--font-lato)",
                      fontWeight: 400,
                      fontSize: "17.85px",
                    }}
                  >
                    Expertise
                  </label>
                  <div className="flex flex-wrap" style={{ gap: "20px" }}>
                    {expertiseOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedExpertise(option)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "13.48px",
                          fontSize: "15px",
                          fontFamily: "var(--font-lato)",
                          fontWeight: 400,
                          border: selectedExpertise === option
                            ? "none"
                            : "0.84px solid #79747E",
                          backgroundColor: selectedExpertise === option
                            ? "#432817"
                            : "transparent",
                          color: selectedExpertise === option
                            ? "#FFFFFF"
                            : "#79747E",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speciality */}
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <label
                    htmlFor="speciality"
                    style={{
                      color: "#432817",
                      fontFamily: "var(--font-lato)",
                      fontWeight: 400,
                      fontSize: "17.85px",
                    }}
                  >
                    Speciality
                  </label>
                  <input
                    id="speciality"
                    type="text"
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    className="w-full outline-none focus:ring-2 focus:ring-[#432817] transition-all"
                    style={{
                      height: "47px",
                      borderRadius: "10px",
                      border: "0.74px solid #79747E",
                      backgroundColor: "#F2F2F2",
                      padding: "0 12px",
                      fontSize: "16px",
                    }}
                  />
                </div>

                {/* Request Badge */}
                <div className="flex justify-center" style={{ marginTop: "7px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "5px",
                      borderRadius: "10px",
                      border: "1px solid #79747E",
                      backgroundColor: "#F1F1F1",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        color: "#432817",
                        fontFamily: "var(--font-lato)",
                        fontWeight: 400,
                        fontSize: "17px",
                        padding: "4px 8px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Request Badge
                    </span>
                    <span
                      style={{
                        width: "25px",
                        height: "25px",
                        borderRadius: "7px",
                        backgroundColor: "#432817",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 28 28"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.909 15.0908H6.36353V12.909H12.909V6.36353H15.0908V12.909H21.6363V15.0908H15.0908V21.6363H12.909V15.0908Z"
                          fill="white"
                        />
                      </svg>
                    </span>
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-red-500 text-sm text-center font-medium mt-2" style={{ fontFamily: "var(--font-lato)" }}>
                    {error}
                  </div>
                )}

                {/* Done Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
                  style={{
                    height: "47px",
                    borderRadius: "10px",
                    backgroundColor: "#432817",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-lato)",
                    fontWeight: 900,
                    fontSize: "23.8px",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    marginTop: "4px",
                  }}
                >
                  {loading ? "Saving..." : "Done"}
                </button>

              </form>
            </div>
          </div>

        </div>
      </div>
      {showModal && <AddDocuments onClose={() => setShowModal(false)} />}
    </div>
  );
}