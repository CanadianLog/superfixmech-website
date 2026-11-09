import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { FaqList } from "@/components/sections/faq-list";
import { PageHero } from "@/components/sections/page-hero";
import { ServiceCommitment } from "@/components/sections/service-commitment";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { breadcrumbSchema, serviceSchema } from "@/lib/seo";
import { serviceAreaPages } from "@/lib/service-areas";

export type ExtraSection = {
  heading: string;
  paragraphs?: string[];
  points?: string[];
  links?: { href: string; label: string }[];
};

type FaqItem = string | { question: string; answer: string };

type ServiceDetailProps = {
  title: string;
  overview: string;
  bullets: string[];
  bulletsHeading?: string;
  faq: FaqItem[];
  faqTitle?: string;
  heroImage?: string;
  /** Page path, e.g. /repair/fridge-repair. Enables Service + Breadcrumb schema. */
  path: string;
  parent: { name: string; path: string };
  serviceType: string;
  /** Extra copy blocks shown below the overview (each gets an h2). */
  extraSections?: ExtraSection[];
  /** Heading for a block linking to every service-area page; omit to hide it. */
  areasHeading?: string;
  areasIntro?: string;
};

export function ServiceDetail({
  title,
  overview,
  bullets,
  bulletsHeading = "Common issues we can help with:",
  faq,
  faqTitle,
  heroImage = "/stock/technician.jpg",
  path,
  parent,
  serviceType,
  extraSections,
  areasHeading,
  areasIntro,
}: ServiceDetailProps) {
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([parent, { name: title, path }])}
      />
      <JsonLd
        data={serviceSchema({
          name: `${title} in Ottawa`,
          path,
          description: overview,
          serviceType,
        })}
      />
      <PageHero
        titleAsParagraph
        title={title.toUpperCase()}
        subtitle="Professional appliance support for homes, condos and rental properties."
      />
      <Section className="py-12 md:py-16" innerClassName="grid gap-8 md:grid-cols-[1.1fr_1.4fr]">
          <div className="surface relative min-h-[360px] overflow-hidden p-0 md:min-h-[440px]">
            <Image
              src={heroImage}
              alt={`${title} by SuperFix Mechanical`}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
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
      {extraSections && extraSections.length > 0 && (
        <Section className="pt-0 md:pt-0" innerClassName="grid gap-6 md:grid-cols-2">
          {extraSections.map((section) => (
            <article key={section.heading} className="surface p-6 md:p-8">
              <h2 className="text-xl font-extrabold text-[#3b2b0f] md:text-2xl">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-7 text-[#7e6b45] md:text-base">
                  {paragraph}
                </p>
              ))}
              {section.points && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-7 text-[#7e6b45] md:text-base">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              {section.links && (
                <p className="mt-4 text-sm leading-7 text-[#7e6b45]">
                  {section.links.map((link, index) => (
                    <span key={link.href}>
                      {index > 0 && " · "}
                      <Link className="font-semibold text-[#5f4714] underline" href={link.href}>
                        {link.label}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </article>
          ))}
        </Section>
      )}
      {areasHeading && (
        <Section className="pt-0 md:pt-0">
          <article className="surface p-6 text-center md:p-8">
            <h2 className="text-xl font-extrabold text-[#3b2b0f] md:text-2xl">{areasHeading}</h2>
            {areasIntro && (
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#7e6b45] md:text-base">
                {areasIntro}
              </p>
            )}
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {serviceAreaPages.map((area) => (
                <li key={area.slug}>
                  <Link
                    href={`/service-areas/${area.slug}`}
                    className="inline-block rounded-full border border-[#9b7a2d] px-4 py-1.5 text-sm font-semibold text-[#5f4714] hover:bg-[#fff1c9]"
                  >
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </Section>
      )}
      <FaqList items={faq} title={faqTitle} />
      <ServiceCommitment />
      <CtaBand />
    </main>
  );
}
