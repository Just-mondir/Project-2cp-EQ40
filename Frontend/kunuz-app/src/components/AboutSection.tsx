import Image from "next/image";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="pt-24 pb-20 px-6 sm:px-10 lg:px-20 xl:px-32 scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2" }}
    >
      {/* Titre centré en haut */}
      <h2
        className="text-center font-bold mb-14"
        style={{
          fontFamily: "var(--font-lato), system-ui, sans-serif",
          color: "#432819",
          fontSize: "clamp(36px, 4vw, 52px)",
        }}
      >
        About Us
      </h2>

      {/* Deux colonnes */}
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-12 lg:gap-20 items-center justify-center">
        {/* Colonne gauche : texte */}
        <div className="flex-1 max-w-[720px] lg:self-center">
          <p
            className="leading-snug"
            style={{
              color: "#432819",
              fontFamily: "var(--font-lato), system-ui, sans-serif",
              fontSize: "clamp(20px, 2vw, 28px)",
              fontWeight: 400,
              marginBottom: "55px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-aclonica), system-ui, sans-serif",
                fontWeight: 700,
              }}
            >
              Kunuz
            </span>{" "}
            is a heritage web platform offering a collaborative digital space
            for sharing and documenting Algeria&apos;s architectural legacy.
          </p>

          <p
            className="leading-snug"
            style={{
              color: "#432819",
              fontFamily: "var(--font-lato), system-ui, sans-serif",
              fontSize: "clamp(20px, 2vw, 28px)",
              fontWeight: 400,
              marginBottom: "60px",
            }}
          >
            Users can create profiles, publish content, and engage within a
            vibrant community.
          </p>

          <p
            className="leading-snug"
            style={{
              color: "#432819",
              fontFamily: "var(--font-lato), system-ui, sans-serif",
              fontSize: "clamp(20px, 2vw, 28px)",
              fontWeight: 400,
            }}
          >
            Together, we contribute to preserving and strengthening our
            cultural identity.
          </p>
        </div>

        {/* Colonne droite : images */}
        <div className="flex flex-col gap-6 sm:gap-8 items-center md:items-end w-full max-w-[350px] sm:max-w-[420px] lg:max-w-[460px]">
          {/* Ligne du haut - 40% left (narrow), 60% right (wide) */}
          <div className="flex gap-6 lg:gap-8 items-start w-full justify-center">
            <div
              className="overflow-hidden rounded-[12px] bg-[#e0d4bf]"
              style={{ width: "40%", minWidth: 0, height: "clamp(230px, 42vw, 330px)" }}
            >
              <Image
                src="/about-3.jpg"
                alt="Kunuz heritage placeholder 3"
                width={250}
                height={330}
                className="h-full w-full object-cover rounded-[12px]"
              />
            </div>
            <div
              className="overflow-hidden rounded-[12px] bg-[#e0d4bf]"
              style={{ width: "60%", minWidth: 0, height: "clamp(220px, 40vw, 320px)" }}
            >
              <Image
                src="/about-1.jpg"
                alt="Kunuz heritage placeholder 1"
                width={240}
                height={320}
                className="h-full w-full object-cover rounded-[12px]"
              />
            </div>
          </div>

          {/* Ligne du bas - 60% left (wide), 40% right (narrow) */}
          <div className="flex gap-6 lg:gap-8 items-end w-full justify-center">
            <div
              className="overflow-hidden rounded-[12px] bg-[#e0d4bf]"
              style={{ width: "60%", minWidth: 0, height: "clamp(220px, 40vw, 320px)" }}
            >
              <Image
                src="/about-5.jpg"
                alt="Kunuz heritage placeholder 5"
                width={240}
                height={320}
                className="h-full w-full object-cover rounded-[12px]"
              />
            </div>
            <div
              className="overflow-hidden rounded-[12px] bg-[#e0d4bf]"
              style={{ width: "40%", minWidth: 0, height: "clamp(230px, 42vw, 330px)" }}
            >
              <Image
                src="/about-2.jpg"
                alt="Kunuz heritage placeholder 2"
                width={250}
                height={330}
                className="h-full w-full object-cover rounded-[12px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
