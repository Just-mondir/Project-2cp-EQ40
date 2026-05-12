import { Lato, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400"],
});

export default function AboutMissionVision() {
  return (
<section className={`${playfair.className} px-4 sm:px-6 md:px-10 lg:px-20 xl:px-32 py-12 sm:py-16 md:py-24 lg:py-28 xl:py-32 min-h-auto flex items-center justify-center bg-[#FFF8E2]`}>      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12 lg:gap-20">
          {/* ================== Mission Card ================== */}
          <div className="relative w-full max-w-[450px] md:max-w-[500px] lg:max-w-[540px]">
            <div className="absolute -inset-4 pointer-events-none">
              <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-4 w-2 sm:w-3 h-2 sm:h-3 bg-[#432819] rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
            <article className="p-4 sm:p-6 md:p-8 lg:p-10"   style={{ borderRight: '2px solid var(--brown)',borderTop: '2px solid var(--brown)'}}>
              <h2
                className="font-bold text-[clamp(24px,5vw,36px)] text-[#432819] mb-3 sm:mb-4"
                style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif'}}
              >
                Our Mission:
              </h2>
              <p
                className="text-[clamp(15px,3vw,20px)] leading-[1.6] sm:leading-[1.8] text-[#432819]"
                style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
              >
                To build a collaborative digital space that supports the
                documentation and preservation of Algeria&apos;s architectural
                legacy.
              </p>
            </article>
          </div>
          {/* ================== Vision Card ================== */}
          <div className="relative w-full max-w-[450px] md:max-w-[500px] lg:max-w-[540px]">
            <div className="absolute -inset-4 pointer-events-none">
              <div className="absolute top-2 sm:top-3 left-2 sm:left-4 w-2 sm:w-3 h-2 sm:h-3 bg-[#432819] rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
            <article className="p-4 sm:p-6 md:p-8 lg:p-10" style={{ borderLeft: '2px solid var(--brown)',borderBottom: '2px solid var(--brown)'}}>
              <h2
                className="font-bold text-[clamp(24px,5vw,36px)] text-[#432819] mb-3 sm:mb-4"
                style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
              >
                Our Vision:
              </h2>
              <p
                className={`${lato.className} text-[clamp(15px,3vw,20px)] leading-[1.6] sm:leading-[1.8] text-[#432819]`}
              >
                To become a leading platform that unites communities in
                protecting and celebrating Algeria&apos;s architectural
                identity.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
