import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand } from "@/components/sections/cta-band";
import { Section } from "@/components/ui/section";
import { articles, getArticle } from "@/lib/articles";
import { breadcrumbSchema } from "@/lib/seo";
import { company } from "@/lib/site-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    mainEntityOfPage: `${company.url}/blog/${article.slug}`,
    author: { "@type": "Organization", name: "SuperFix Mechanical", url: company.url },
    publisher: { "@id": `${company.url}/#business` },
  };

  const otherArticles = articles.filter((item) => item.slug !== article.slug);

  return (
    <main>
      <JsonLd data={articleSchema} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Blog", path: "/blog" },
          { name: article.title, path: `/blog/${article.slug}` },
        ])}
      />
      <Section className="py-12 md:py-16">
        <article className="mx-auto max-w-3xl">
          <Link href="/blog" className="text-sm font-semibold text-[#9b7a2d] hover:underline">
            ← All guides
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[#3b2b0f] md:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-sm text-[#9b7a2d]">
            By the SuperFix Mechanical team · {article.readMinutes} min read
          </p>
          <p className="mt-6 text-base leading-7 text-[#5f4714]">{article.intro}</p>

          <div className="mt-8 space-y-8">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold text-[#3b2b0f]">{section.heading}</h2>
                {section.points ? (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-7 text-[#5f4714]">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-base leading-7 text-[#5f4714]">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#ead8a4] bg-[#fff7da] p-6">
            <p className="text-lg font-bold text-[#3b2b0f]">Still not working?</p>
            <p className="mt-2 text-sm leading-6 text-[#7e6b45]">
              Our technicians serve Ottawa, Kanata, Nepean, Orleans, Barrhaven, and surrounding
              areas. Learn more about our{" "}
              <Link href={article.related.href} className="font-semibold text-[#5f4714] underline">
                {article.related.label}
              </Link>{" "}
              service, call{" "}
              <a href="tel:+16133667009" className="font-semibold text-[#5f4714] underline">
                {company.phone}
              </a>
              , or{" "}
              <Link href="/online-booking" className="font-semibold text-[#5f4714] underline">
                book online
              </Link>
              .
            </p>
          </div>

          {otherArticles.length > 0 ? (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-[#3b2b0f]">More guides</h2>
              <ul className="mt-3 space-y-2">
                {otherArticles.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/blog/${item.slug}`}
                      className="text-base font-semibold text-[#5f4714] hover:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      </Section>
      <CtaBand />
    </main>
  );
}

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    return {};
  }

  return {
    title: `${article.title} | SuperFix Mechanical`,
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: `/blog/${article.slug}`,
      publishedTime: article.date,
    },
  };
}
