import Image from "next/image";

export default function MonumentsInDangerPage() {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden">
      {/* Left half: blurred Timgad image */}
      <div className="relative w-full md:w-1/2 h-[320px] md:h-auto md:min-h-screen overflow-hidden">
        <Image
          src="/timgad%201.jpg"
          alt="Timgad Roman arch and columns"
          fill
          priority
          className="object-cover object-center"
          style={{ filter: "blur(4px)", transform: "scale(1.05)" }}
        />
      </div>

      {/* Right half: solid #FFF8E2 */}
      <div
        className="w-full md:w-1/2 flex items-center justify-center px-10 lg:px-20 py-16"
        style={{ backgroundColor: "#FFF8E2" }}
      >
        {/* Contenu placeholder – à compléter selon besoin */}
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold text-[#2C1A0E] mb-6">
            Monuments In Danger
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-[#2C1A0E] opacity-80">
            This dedicated page highlights endangered heritage sites. You can
            customize this text and add more content here.
          </p>
        </div>
      </div>
    </div>
  );
}

