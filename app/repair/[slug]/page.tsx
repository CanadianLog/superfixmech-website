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
      heroImage={`/service-photos/${slug}.jpg`}
      path={`/repair/${slug}`}
      parent={{ name: "Repair", path: "/repair" }}
      serviceType="Appliance repair"
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
    description: `Professional ${service.name.toLowerCase()} in Ottawa. Same-day diagnostics, certified technicians, and a 30-day warranty on parts and labour. Call 613-366-7009.`,
  };
}
