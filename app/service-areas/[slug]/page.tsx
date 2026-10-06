import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand } from "@/components/sections/cta-band";
import { FaqList } from "@/components/sections/faq-list";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { breadcrumbSchema } from "@/lib/seo";
import { getServiceArea, serviceAreaPages } from "@/lib/service-areas";
import { company, installationPages, servicePages } from "@/lib/site-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServiceAreaPage({ params }: Props) {
  const { slug } = await params;
  const area = getServiceArea(slug);

  if (!area) {
    notFound();
  }

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Appliance repair",
    name: `Appliance Repair in ${area.name}`,
    url: `${company.url}/service-areas/${area.slug}`,
    provider: { "@id": `${company.url}/#business` },
    areaServed: { "@type": "Place", name: area.locality },
  };

  return (
    <main>
      <JsonLd data={serviceSchema} />
      <JsonLd
        data={breadcrumbSchema([
          { name: `Appliance Repair ${area.name}`, path: `/service-areas/${area.slug}` },
        ])}
      />
      <PageHero
        title={`Appliance Repair in ${area.name}`}
        subtitle={`Local appliance repair and installation for ${area.name} homes. Call ${company.phone} or book online.`}
        showCta
      />

      <Section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-base leading-7 text-[#5f4714]">{area.intro}</p>

          <h2 className="mt-10 text-2xl font-bold text-[#3b2b0f]">
            Appliance repair services in {area.name}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {servicePages.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/repair/${service.slug}`}
                  className="block rounded-xl border border-[#ead8a4] bg-[#fffdf6] px-4 py-3 text-sm font-semibold text-[#5f4714] transition hover:border-[#d9b557] hover:bg-[#fff7da]"
                >
                  {service.name} in {area.name}
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-2xl font-bold text-[#3b2b0f]">
            Appliance installation in {area.name}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {installationPages.map((installation) => (
              <li key={installation.slug}>
                <Link
                  href={`/installation/${installation.slug}`}
                  className="block rounded-xl border border-[#ead8a4] bg-[#fffdf6] px-4 py-3 text-sm font-semibold text-[#5f4714] transition hover:border-[#d9b557] hover:bg-[#fff7da]"
                >
                  {installation.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 space-y-6">
            {area.localNotes.map((note) => (
              <section key={note.heading}>
                <h2 className="text-xl font-bold text-[#3b2b0f]">{note.heading}</h2>
                <p className="mt-2 text-base leading-7 text-[#5f4714]">{note.text}</p>
              </section>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-bold text-[#3b2b0f]">
            {area.name} neighbourhoods we serve
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {area.neighbourhoods.map((neighbourhood) => (
              <li
                key={neighbourhood}
                className="rounded-full border border-[#eedca7] bg-[#fff9e8] px-3 py-1.5 text-sm text-[#7e6b45]"
              >
                {neighbourhood}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-[#7e6b45]">
            Not sure what&apos;s wrong? Our{" "}
            <Link href="/blog" className="font-semibold text-[#5f4714] underline">
              troubleshooting guides
            </Link>{" "}
            cover the most common problems and what you can safely check yourself.
          </p>
        </div>
      </Section>

      <FaqList items={area.faq} title={`Appliance Repair in ${area.name}: FAQ`} />
      <CtaBand title={`Need an Appliance Repaired in ${area.name}?`} />
    </main>
  );
}

export function generateStaticParams() {
  return serviceAreaPages.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceArea(slug);

  if (!area) {
    return {};
  }

  return {
    title: `Appliance Repair ${area.name} | SuperFix Mechanical`,
    description: area.metaDescription,
    alternates: { canonical: `/service-areas/${area.slug}` },
  };
}
