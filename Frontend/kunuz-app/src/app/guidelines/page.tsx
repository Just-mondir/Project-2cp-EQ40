const rules = [
  {
    id: "Rule 01",
    title: "Accuracy First",
    subtitle: "Share correct and verifiable information",
    desc: "Heritage documentation must be reliable. When possible, include sources or mention if information is uncertain so others can verify or improve it.",
  },
  {
    id: "Rule 02",
    title: "Respect Culture and History",
    subtitle: "Use respectful language and tone",
    desc: "Monuments represent real histories and communities. Content must avoid insults, political provocation, or insensitive comments.",
  },
  {
    id: "Rule 03",
    title: "Quality Content Only",
    subtitle: "Upload clear, relevant photos and useful descriptions",
    desc: "High-quality content makes the platform valuable for students, researchers, and visitors. Avoid spam, duplicates, or unrelated images.",
  },
  {
    id: "Rule 04",
    title: "Credit Sources",
    subtitle: "Mention authors, photographers, or references",
    desc: "Giving credit respects intellectual work and helps users verify information. Do not upload copyrighted material without permission.",
  },
  {
    id: "Rule 05",
    title: "Collaborate Positively",
    subtitle: "Correct mistakes politely and help others improve content",
    desc: "The platform grows through teamwork. Constructive feedback keeps discussions productive and respectful.",
  },
  {
    id: "Rule 06",
    title: "Protect Sensitive Sites",
    subtitle: "Do not share harmful or dangerous information about fragile monuments",
    desc: "Some locations need protection. Sharing sensitive details can cause damage or vandalism.",
  },
  {
    id: "Rule 07",
    title: "Follow Platform Policies",
    subtitle: "Respect platform rules and moderator decisions",
    desc: "Repeated violations may lead to content removal to keep the platform safe and reliable for everyone.",
  },
];

export default function Guidelines() {
  return (
    <main className="min-h-screen">
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-6xl font-bold mb-10 text-center" >Guidelines</h1>

        <p className="mb-10 leading-relaxed text-lg" >
          Our platform is a shared space dedicated to preserving and promoting Algerian heritage.
          Every contribution helps build a reliable and respectful archive for sites such as
          Casbah of Algiers and Timgad. To keep this space useful,
          trustworthy, and welcoming, all members are expected to follow the guidelines below.
        </p>

        <div className="space-y-6">
          {rules.map((rule) => (
            <div key={rule.id} className="">

              <h2 className="text-xl font-black" style={{ color: "#BB9557" }}>
                • {rule.id} :{" "} {rule.title}
              </h2>
              <h2 className="text-lg font-bold ">
                <span className="font-bold ">{rule.subtitle}</span>
              </h2>
              <p className="mt-2 leading-relaxed" style={{ color: "#432817" }}>{rule.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center" style={{ color: "#6E1D1A" }}>
          To maintain a respectful and reliable platform, all contributions are reviewed according
          to these guidelines. Content that is inaccurate, offensive, unrelated to heritage, or
          violates platform policies will be removed, and repeated violations may lead to account
          restrictions. Our goal is to protect both the community and the cultural value of
          monuments by ensuring that inappropriate content is blocked and the platform remains a
          safe and trustworthy space for everyone.
        </p>
      </section>
    </main>
  );
}