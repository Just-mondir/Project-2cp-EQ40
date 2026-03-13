import Header from "@/components/Header";

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FFF8E2" }}>
      <Header />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16 md:px-10">
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "#2C1A0E", fontFamily: "var(--font-aclonica)" }}
        >
          Community Guidelines
        </h1>
        <p
          className="text-base md:text-lg leading-relaxed"
          style={{ color: "#3B2A1A", fontFamily: "var(--font-lato)" }}
        >
          Use this page to describe how members of the Kunuz community should
          participate respectfully – when sharing stories, uploading content or
          organizing events. You can migrate the detailed rules from your older
          project directly into this section.
        </p>
      </main>
    </div>
  );
}

