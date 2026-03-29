import Image from "next/image";
import { Lato, Playfair_Display } from "next/font/google";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
});

export default function ExploreHeritage() {
  return (
    <section
      id="explore"
      className="w-full py-20 px-8 lg:px-24 xl:px-32 scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2" }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center justify-center gap-12 lg:gap-20">
        {/* Right column – text content */}
        <div className="flex-1 flex flex-col justify-center items-start text-left">
          <h2
            className="font-bold text-[32px] md:text-[36px] lg:text-[44px] leading-tight text-[#2C1A0E] mb-8"
            style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
          >
            Discover Our Heritage &amp; <br />
            Community
          </h2>
          <p
            className="text-lg md:text-xl lg:text-2xl leading-[1.85] text-[#2C1A0E]"
            style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif', maxWidth: '100%' }}
          >
            Discover reflections, personal experiences, historical insights, and
            cultural discoveries shared by heritage enthusiasts from across the
            community. Through every post, members document forgotten landmarks,
            highlight monuments at risk, and celebrate the traditions that shape
            our identity. Explore recent contributions and become part of a
            growing movement dedicated to preserving and passing on our cultural
            legacy to future generations.
          </p>
        </div>

        {/* Left column – image mosaic */}
        <div className="flex flex-row gap-3 shrink-0 w-full max-w-[340px] md:w-[400px] lg:w-[460px] justify-center mx-auto md:mx-0">
          {/* Left sub-column */}
          <div className="flex flex-col gap-3 w-1/2">
            <div className="w-full h-[200px] md:h-[230px] lg:h-[260px] rounded-2xl overflow-hidden relative group cursor-pointer transition-transform duration-300 ease-out hover:scale-105">
              <Image
                src="/Picture 1(1).jpg"
                alt="Tall minaret tower against a blue sky"
                width={220}
                height={260}
                className="w-full h-full object-contain rounded-2xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-2 text-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Add the title here
              </div>
            </div>
            <div className="w-full h-[185px] md:h-[210px] lg:h-[240px] rounded-2xl overflow-hidden relative group cursor-pointer transition-transform duration-300 ease-out hover:scale-105">
              <Image
                src="/download 2.jpg"
                alt="Moorish-style building facade with decorated arches"
                width={220}
                height={240}
                className="w-full h-full object-contain rounded-2xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-2 text-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Add the title here
              </div>
            </div>
            <div className="w-full h-[160px] md:h-[185px] lg:h-[210px] rounded-2xl overflow-hidden relative group cursor-pointer transition-transform duration-300 ease-out hover:scale-105">
              <Image
                src="/Picture 5.jpg"
                alt="Stone bridge over a deep gorge at sunset"
                width={220}
                height={210}
                className="w-full h-full object-contain rounded-2xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-2 text-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Add the title here
              </div>
            </div>
          </div>

          {/* Right sub-column */}
          <div className="flex flex-col gap-3 w-1/2">
            <div className="w-full h-[155px] md:h-[180px] lg:h-[200px] rounded-2xl overflow-hidden relative group cursor-pointer transition-transform duration-300 ease-out hover:scale-105">
              <Image
                src="/Picture 2.jpg"
                alt="Roman ruins with tall ancient columns against a bright sky"
                width={220}
                height={200}
                className="w-full h-full object-cover rounded-2xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-2 text-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Add the title here
              </div>
            </div>
            <div className="w-full h-[210px] md:h-[240px] lg:h-[270px] rounded-2xl overflow-hidden relative group cursor-pointer transition-transform duration-300 ease-out hover:scale-105">
              <Image
                src="/about-3.jpg"
                alt="Moorish courtyard interior with arched galleries and central fountain"
                width={220}
                height={270}
                className="w-full h-full object-cover rounded-2xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-2 text-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Add the title here
              </div>
            </div>
            <div className="w-full h-[195px] md:h-[220px] lg:h-[250px] rounded-2xl overflow-hidden relative group cursor-pointer transition-transform duration-300 ease-out hover:scale-105">
              <Image
                src="/Picture 6.jpg"
                alt="Long ornate Islamic corridor with repeated white arches"
                width={220}
                height={250}
                className="w-full h-full object-cover rounded-2xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-2 text-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Add the title here
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

