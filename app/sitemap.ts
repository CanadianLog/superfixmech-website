import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { company, installationPages, legalPages, servicePages } from "@/lib/site-data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/about",
    "/contact",
    "/online-booking",
    "/our-work",
    "/maintenance",
    "/repair",
    "/installation",
    "/blog",
  ];

  return [
    ...staticPaths.map((path) => ({
      url: `${company.url}${path}`,
      priority: path === "" ? 1 : 0.8,
    })),
    ...servicePages.map((service) => ({
      url: `${company.url}/repair/${service.slug}`,
      priority: 0.9,
    })),
    ...installationPages.map((installation) => ({
      url: `${company.url}/installation/${installation.slug}`,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: `${company.url}/blog/${article.slug}`,
      lastModified: article.date,
      priority: 0.7,
    })),
    ...legalPages.map((page) => ({
      url: `${company.url}${page.href}`,
      priority: 0.3,
    })),
  ];
}
