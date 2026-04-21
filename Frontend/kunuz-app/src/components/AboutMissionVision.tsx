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
<section className={`${playfair.className} px-6 sm:px-10 lg:px-20 xl:px-32 py-24 md:py-28 lg:py-32 min-h-[80vh] flex items-center justify-center bg-[#FFF8E2]`}>      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
          {/* ================== Mission Card ================== */}
          <div className="relative w-full max-w-[500px] lg:max-w-[540px]">
            <div className="absolute -inset-4 pointer-events-none">
              <div className="absolute bottom-3 right-4 w-3 h-3 bg-[#432819] rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
            <article className="p-8 lg:p-10"   style={{ borderRight: '2px solid var(--brown)',borderTop: '2px solid var(--brown)'}}>
              <h2
                className="font-bold text-[32px] lg:text-[36px] text-[#432819] mb-4"
                style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif'}}
              >
                Our Mission:
              </h2>
              <p
                className="text-[17px] lg:text-[20px] leading-[1.8] text-[#432819]"
                style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
              >
                To build a collaborative digital space that supports the
                documentation and preservation of Algeria&apos;s architectural
                legacy.
              </p>
            </article>
          </div>
          {/* ================== Vision Card ================== */}
          <div className="relative w-full max-w-[500px] lg:max-w-[540px]">
            <div className="absolute -inset-4 pointer-events-none">
              <div className="absolute top-3 left-4 w-3 h-3 bg-[#432819] rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
            <article className="p-8 lg:p-10" style={{ borderLeft: '2px solid var(--brown)',borderBottom: '2px solid var(--brown)'}}>
              <h2
                className="font-bold text-[32px] lg:text-[36px] text-[#432819] mb-4"
                style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
              >
                Our Vision:
              </h2>
              <p
                className={`${lato.className} text-[17px] lg:text-[20px] leading-[1.8] text-[#432819]`}
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
