import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Appliance Repair Tips & Guides | SuperFix Mechanical",
  description:
    "Practical appliance troubleshooting guides from Ottawa repair technicians: fridges, dryers, dishwashers, and when to repair or replace.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <main>
      <PageHero
        title="Appliance Tips & Guides"
        subtitle="Troubleshooting advice from our Ottawa technicians, so you know what to check before you book."
      />
      <Section>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group rounded-2xl border border-[#ead8a4] bg-[#fffdf6] p-6 transition hover:border-[#d9b557] hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9b7a2d]">
                {article.readMinutes} min read
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#3b2b0f] group-hover:text-[#5f4714]">
                {article.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#7e6b45]">{article.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#5f4714]">
                Read the guide →
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <CtaBand />
    </main>
  );
}
