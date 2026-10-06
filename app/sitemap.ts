import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { serviceAreaPages } from "@/lib/service-areas";
import { company, installationPages, servicePages, siteLastUpdated } from "@/lib/site-data";

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
      lastModified: siteLastUpdated,
      priority: path === "" ? 1 : 0.8,
    })),
    ...servicePages.map((service) => ({
      url: `${company.url}/repair/${service.slug}`,
      lastModified: siteLastUpdated,
      priority: 0.9,
    })),
    ...installationPages.map((installation) => ({
      url: `${company.url}/installation/${installation.slug}`,
      lastModified: siteLastUpdated,
      priority: 0.8,
    })),
    ...serviceAreaPages.map((area) => ({
      url: `${company.url}/service-areas/${area.slug}`,
      lastModified: siteLastUpdated,
      priority: 0.9,
    })),
    ...articles.map((article) => ({
      url: `${company.url}/blog/${article.slug}`,
      lastModified: article.date,
      priority: 0.7,
    })),
  ];
}
