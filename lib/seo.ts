import { company } from "@/lib/site-data";

/** Serialise JSON-LD safely for inline <script> tags. */
export function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type Crumb = { name: string; path: string };

/** BreadcrumbList schema. Home is always prepended. */
export function breadcrumbSchema(items: Crumb[]) {
  const all: Crumb[] = [{ name: "Home", path: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${company.url}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function serviceSchema({
  name,
  path,
  description,
  serviceType,
}: {
  name: string;
  path: string;
  description: string;
  serviceType: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType,
    description,
    url: `${company.url}${path}`,
    provider: { "@id": `${company.url}/#business` },
    areaServed: { "@type": "City", name: "Ottawa" },
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
