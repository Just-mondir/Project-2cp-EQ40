import { Lato, Playfair_Display } from "next/font/google";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
});

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="white"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="white"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 20h20v2H2v-2zm2-2h2V10H4v8zm4 0h2V10H8v8zm4 0h2V10h-2v8zm4 0h2V10h-2v8zM12 2L2 7v1h20V7L12 2z" />
    </svg>
  );
}

type Step = {
  stepLabel: string;
  description: string;
  icon: "user" | "camera" | "building";
};

const steps: Step[] = [
  {
    stepLabel: "Step 1 : create Account",
    description:
      "Sign up to save monuments, post heritage content, and join a global network in just a few clicks.",
    icon: "user",
  },
  {
    stepLabel: "Step 2 : Share & explore",
    description:
      "Browse monuments and discoveries. Upload photos, add information, or comment on heritage sites.",
    icon: "camera",
  },
  {
    stepLabel: "Step 3 : Contribute &  Preserve",
    description:
      "Report endangered sites, add verified details, support restoration and raise preservation awareness.",
    icon: "building",
  },
];

function StepCard({ step }: { step: Step }) {
  const IconComponent =
    step.icon === "user" ? UserIcon : step.icon === "camera" ? CameraIcon : BuildingIcon;

  return (
    <div
      className="border border-[#2C1A0E]/100 p-8 lg:p-10 flex flex-col items-center text-center gap-6 lg:gap-8 transition-transform duration-300 ease-out hover:scale-105"
      style={{ borderWidth: "1.5px", fontFamily: 'var(--font-lato), system-ui, sans-serif', backgroundColor: '#F7F5EF', borderRadius: '20px', boxShadow: '0 6px 24px 0 rgba(44,26,14,0.13)' }}
    >
      <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-[#2C1A0E] flex items-center justify-center shadow-md">
        <IconComponent className="w-8 h-8 lg:w-10 lg:h-10" />
      </div>

      <div>
        <h3 className="font-bold text-base lg:text-lg text-[#2C1A0E] mb-2" style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}>
          {step.stepLabel}
        </h3>
        <p className="font-normal text-sm lg:text-base text-[#2C1A0E] leading-relaxed" style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}>
          {step.description}
        </p>
      </div>
    </div>
  );
}

export default function HowDoesItWork() {
  return (
    <section
      id="help"
      className="w-full py-24 md:py-28 lg:py-32 px-8 lg:px-24 xl:px-32 scroll-mt-24"
      style={{ backgroundColor: "#FFF8E2", minHeight: "80vh" }}
    >
      <h2
        className="font-bold text-[32px] md:text-[36px] lg:text-[44px] text-[#2C1A0E] text-center mb-16 lg:mb-20"
        style={{ fontFamily: 'var(--font-lato), system-ui, sans-serif' }}
      >
        How Does It Work
      </h2>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
        {steps.map((step) => (
          <StepCard key={step.stepLabel} step={step} />
        ))}
      </div>
    </section>
  );
}

