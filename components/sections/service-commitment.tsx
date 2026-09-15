import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

const items = [
  {
    title: "Certified Technicians",
    text: "Experienced professionals handling appliances with proven workflows.",
  },
  {
    title: "Satisfaction Guaranteed",
    text: "We prioritize transparency and quality service on each visit.",
  },
  {
    title: "Parts & Labour Warranty",
    text: "Coverage details are explained clearly before and after service.",
  },
  {
    title: "Professional Service",
    text: "Respectful in-home service with clear communication and scheduling.",
  },
];

export function ServiceCommitment() {
  return (
    <Section className="py-14 md:py-16">
      <h2 className="mb-8 text-center text-3xl font-extrabold text-[#3b2b0f] md:text-4xl">
        Our Service Commitment
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.title} className="text-center">
            <h3 className="text-lg font-bold text-[#5f4714]">{item.title}</h3>
            <p className="mt-3 text-sm text-[#7e6b45]">{item.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
