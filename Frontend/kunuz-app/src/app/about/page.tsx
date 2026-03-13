import Header from "@/components/Header";

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FFF8E2" }}>
      <Header />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16 md:px-10">
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "#2C1A0E", fontFamily: "var(--font-aclonica)" }}
        >
          About Kunuz
        </h1>
        <p
          className="text-base md:text-lg leading-relaxed"
          style={{ color: "#3B2A1A", fontFamily: "var(--font-lato)" }}
        >
          Kunuz is a space dedicated to Algeria&apos;s cultural heritage – from
          monuments and crafts to stories, guilds and community events. This page
          can be expanded with your full &quot;About&quot; content from the previous
          project.
        </p>
      </main>
    </div>
  );
}

