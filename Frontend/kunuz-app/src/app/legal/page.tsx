import Header from "@/components/Header";

export default function LegalPage() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FFF8E2" }}>
      <Header />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16 md:px-10">
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "#2C1A0E", fontFamily: "var(--font-aclonica)" }}
        >
          Legal &amp; Policies
        </h1>
        <p
          className="text-base md:text-lg leading-relaxed"
          style={{ color: "#3B2A1A", fontFamily: "var(--font-lato)" }}
        >
          This page is the right place for your terms of use, privacy policy and
          any legal notices related to Kunuz. You can paste or refine the legal
          text from your existing project here.
        </p>
      </main>
    </div>
  );
}

