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

            {/* Decorative L Shape */}
            <div className="absolute -inset-4 pointer-events-none">
              {/* Top line */}
              <div className="absolute top-0 left-0 right-4 h-[1.5px] bg-[#432819]" />

              {/* Right line */}
              <div className="absolute top-0 right-0 bottom-4 w-[1.5px] bg-[#432819]" />

              {/* Circle */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#432819] rounded-full translate-x-1/2 translate-y-1/2" />
            </div>

            <article className="p-8 lg:p-10">
              <h2
                className={`${playfair.className} text-[22px] lg:text-[28px] font-semibold text-[#432819] mb-4`}
              >
                Our Mission:
              </h2>

              <p
                className={`${lato.className} text-[17px] lg:text-[20px] leading-[1.8] text-[#432819]`}
              >
                To build a collaborative digital space that supports the
                documentation and preservation of Algeria&apos;s architectural
                legacy.
              </p>
            </article>
          </div>

          {/* ================== Vision Card ================== */}
          <div className="relative w-full max-w-[500px] lg:max-w-[540px]">

            {/* Decorative L Shape */}
            <div className="absolute -inset-4 pointer-events-none">
              {/* Circle */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-[#432819] rounded-full -translate-x-1/2 -translate-y-1/2" />

              {/* Left line */}
              <div className="absolute top-4 left-0 bottom-0 w-[1.5px] bg-[#432819]" />

              {/* Bottom line */}
              <div className="absolute bottom-0 left-4 right-0 h-[1.5px] bg-[#432819]" />
            </div>

            <article className="p-8 lg:p-10">
              <h2
                className={`${playfair.className} text-[22px] lg:text-[28px] font-semibold text-[#432819] mb-4`}
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