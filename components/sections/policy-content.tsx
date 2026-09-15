import { Section } from "@/components/ui/section";

type PolicySection = {
  heading: string;
  points: string[];
};

type PolicyContentProps = {
  title: string;
  intro: string;
  sections: PolicySection[];
};

export function PolicyContent({ title, intro, sections }: PolicyContentProps) {
  return (
    <Section className="py-16 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-4xl font-extrabold text-[#3b2b0f] md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[#7e6b45]">{intro}</p>
        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-[#5f4714]">{section.heading}</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-[#7e6b45]">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Section>
  );
}
