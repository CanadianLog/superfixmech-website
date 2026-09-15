import Image from "next/image";
import { CtaBand } from "@/components/sections/cta-band";
import { FaqList } from "@/components/sections/faq-list";
import { PageHero } from "@/components/sections/page-hero";
import { ServiceCommitment } from "@/components/sections/service-commitment";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";

type FaqItem = string | { question: string; answer: string };

type ServiceDetailProps = {
  title: string;
  overview: string;
  bullets: string[];
  bulletsHeading?: string;
  faq: FaqItem[];
  faqTitle?: string;
  heroImage?: string;
};

export function ServiceDetail({
  title,
  overview,
  bullets,
  bulletsHeading = "Common issues we can help with:",
  faq,
  faqTitle,
  heroImage = "/stock/technician.jpg",
}: ServiceDetailProps) {
  return (
    <main>
      <PageHero
        title={title.toUpperCase()}
        subtitle="Professional appliance support for homes and small businesses."
      />
      <Section className="py-12 md:py-16" innerClassName="grid gap-8 md:grid-cols-[1.1fr_1.4fr]">
          <div className="surface overflow-hidden p-0">
            <Image
              src={heroImage}
              alt="Technician placeholder"
              width={1400}
              height={933}
              className="h-full w-full object-cover"
            />
          </div>
          <article className="surface p-6 md:p-8">
            <Badge>Home Appliance Specialists</Badge>
            <h1 className="mt-4 text-3xl font-extrabold text-[#3b2b0f] md:text-4xl">
              {title} Services - Fast, Affordable & Guaranteed
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#7e6b45] md:text-base">{overview}</p>
            <h2 className="mt-5 text-lg font-bold text-[#5f4714]">{bulletsHeading}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#7e6b45]">
              {bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
      </Section>
      <FaqList items={faq} title={faqTitle} />
      <ServiceCommitment />
      <CtaBand />
    </main>
  );
}
