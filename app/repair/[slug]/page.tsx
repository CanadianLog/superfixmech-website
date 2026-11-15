import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/sections/service-detail";
import { serviceContent } from "@/lib/repair-content";
import { servicePages } from "@/lib/site-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = servicePages.find((item) => item.slug === slug);

  if (!service) {
    notFound();
  }

  const content = serviceContent[slug];

  return (
    <ServiceDetail
      title={service.name}
      overview={content.overview}
      bullets={content.bullets}
      faq={content.faq}
      faqTitle={`${service.name} FAQs`}
      heroImage={`/service-photos/${slug}.jpg`}
      path={`/repair/${slug}`}
      parent={{ name: "Repair", path: "/repair" }}
      serviceType="Appliance repair"
      extraSections={content.extraSections}
      areasHeading={`${service.name} across Ottawa`}
      areasIntro={`We offer ${service.name.toLowerCase()} in Ottawa and nearby communities. Find your neighbourhood:`}
    />
  );
}

export function generateStaticParams() {
  return servicePages.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = servicePages.find((item) => item.slug === slug);

  if (!service) {
    return {};
  }

  return {
    title: `${service.name} Ottawa | SuperFix Mechanical`,
    description: serviceContent[slug].metaDescription,
  };
}
