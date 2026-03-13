import Footer from "../components/Footer";

export default function About() {
  return (
    <main className="min-h-screen">
      <div style={{ padding: "3rem 8rem" }}>
        <h1 className="text-6xl font-bold mb-10 text-center" style={{ fontFamily: "Aclonica, sans-serif" }}>
          About Kunuz
        </h1>

        {/* Section 1: Logo + First paragraph */}
        <div className="flex items-center gap-10 mb-20">
          <div className="flex-1">
            <img src="/logo-mixed.svg" alt="Kunuz logo" className="w-70 h-70 object-contain" />
          </div>
          <div className="flex-1">
            <p className="text-xl leading-relaxed" style={{ color: "#3b2314" }}>
              The platform is a collaborative digital space dedicated to documenting and sharing Algeria's
              architectural and cultural heritage. It brings together monuments, stories, photos, and research
              in one accessible place, from iconic sites to ancient cities. Users can explore verified
              information, discover endangered monuments, and contribute their own knowledge, creating a
              living archive that grows with every contribution.
            </p>
          </div>
        </div>

        {/* Section 2: Text left + Image right */}
        <div className="flex items-center gap-16 mb-20">
          <div className="flex-1">
            <p className="text-xl leading-relaxed" style={{ color: "#3b2314" }}>
              At its heart, the platform is built around community participation. Students, historians,
              artists, photographers, and local residents can collaborate by sharing discoveries, correcting
              information, annotating monuments, and organizing events. This shared effort strengthens
              awareness and responsibility toward heritage, turning preservation from an abstract idea into
              a collective action where everyone has a role to play.
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <img src="/monitoring 1.png" alt="Community" className="w-70 h-70 object-contain" />
          </div>
        </div>

        {/* Section 3: Image left + Text right */}
        <div className="flex items-center gap-16">
          <div className="flex-1">
            <img src="/monitoring (1) 1.png" alt="Vision" className="w-70 h-70 object-contain" />
          </div>
          <div className="flex-1">
            <p className="text-xl leading-relaxed" style={{ color: "#3b2314" }}>
              The long-term vision of the platform is to become a trusted reference for Algerian heritage
              while inspiring a culture of protection and pride. By combining technology, research, and
              community engagement, it aims to support education, tourism awareness, and conservation
              initiatives. In the future, the platform can grow into partnerships with institutions and
              cultural organizations, helping safeguard heritage for the next generations instead of
              letting it fade quietly while everyone scrolls past it on their phones.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}