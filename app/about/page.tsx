import type { Metadata } from "next";
import Image from "next/image";
import { JsonLd } from "@/components/seo/json-ld";
import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { breadcrumbSchema } from "@/lib/seo";
import { serviceAreaPages } from "@/lib/service-areas";
import { servicePages } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "About SuperFix Mechanical | Ottawa Appliance Repair",
  description:
    "Family-owned Ottawa appliance repair company with 5 years of hands-on experience and a certified technician. Honest pricing, clear quotes, and a 30-day repair warranty.",
};

export default function AboutPage() {
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "About", path: "/about" }])} />
      <section className="relative overflow-hidden bg-[#5f4714]">
        <div className="absolute inset-0 opacity-35">
          <Image src="/stock/banner-generic.jpg" alt="" fill className="object-cover" />
        </div>
        <Container className="relative z-10 py-14 text-center text-white md:py-16">
          <h1 className="text-3xl font-extrabold md:text-5xl">
            About SuperFix Mechanical
            <span className="mt-1 block text-lg font-bold uppercase tracking-[0.08em] text-white/90 md:text-2xl">
              Ottawa Appliance Repair &middot; Our Journey
            </span>
          </h1>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.1em] text-white/90">
            Built on Trust. Driven by Family. Powered by Knowledge.
          </p>
        </Container>
      </section>

      <Section className="py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <article className="surface p-6 md:p-8">
            <Badge>5 Years of Appliance Repair</Badge>
            <h2 className="mt-4 text-3xl font-extrabold text-[#3b2b0f]">
              A Family Owned Ottawa Appliance Repair Company
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#7e6b45]">
              SuperFix Mechanical is a family owned appliance repair company based at 200 Bay
              Street in Ottawa. Our owner and lead technician has been repairing home appliances
              for 5 years and is a certified appliance technician. Every repair is handled
              by a technician who has diagnosed and fixed these same problems in Ottawa homes
              many times before.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#7e6b45]">
              We treat you like family ensuring quality work, professional service, affordable
              prices &amp; honesty. We are not satisfied until you are! High ethics and morals
              ensure a great experience for you and your family. We look forward to working with
              you and hope to service your appliance needs for years to come.
            </p>
          </article>
          <div className="surface overflow-hidden p-0">
            <Image
              src="/stock/van.jpg"
              alt="SuperFix Mechanical service van, Ottawa appliance repair"
              width={1400}
              height={933}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </Section>

      <Section className="bg-[#fffdf5] py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-extrabold text-[#3b2b0f]">
            Certified, Experienced, and Straightforward About It
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#7e6b45] md:text-base">
            Appliance repair isn&apos;t a licensed trade in Ontario, which means anyone can
            advertise as a repair technician. That&apos;s why we put our certification, our five
            years of hands-on experience, and our guarantees in writing. Here&apos;s what you can
            expect when you book with us:
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              [
                "Certified technician",
                "Your appliance is diagnosed and repaired by a certified appliance technician with five years of daily repair experience.",
              ],
              [
                "Clear quote before repair",
                "We explain what failed, what the repair involves, and what it costs before any work begins.",
              ],
              [
                "Warranty on every repair",
                "Parts and labour are covered by a 30-day warranty. See our warranty policy for details.",
              ],
              [
                "Repair-or-replace honesty",
                "If an appliance isn't worth fixing, we'll tell you so rather than sell you a repair that won't last.",
              ],
              [
                "Same-day appointments",
                "Same-day diagnostics are available across Ottawa, subject to availability.",
              ],
              [
                "Insured and professional",
                "We're insured, and we treat your home with the same care we'd want in our own.",
              ],
            ].map(([title, text]) => (
              <li
                key={title}
                className="rounded-xl border border-[#ead8a4] bg-[#fffdf6] p-4"
              >
                <h3 className="text-base font-bold text-[#5f4714]">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#7e6b45]">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-extrabold text-[#3b2b0f]">What We Repair and Install</h2>
          <p className="mt-4 text-sm leading-7 text-[#7e6b45] md:text-base">
            We repair the appliances Ottawa homeowners rely on every day:{" "}
            {servicePages.map((service, index) => (
              <span key={service.slug}>
                <Link
                  href={`/repair/${service.slug}`}
                  className="font-semibold text-[#5f4714] underline"
                >
                  {service.name.replace(" Repair", "").toLowerCase()}
                </Link>
                {index < servicePages.length - 2 ? ", " : index === servicePages.length - 2 ? ", and " : ""}
              </span>
            ))}
            . We also handle{" "}
            <Link href="/installation" className="font-semibold text-[#5f4714] underline">
              appliance installation
            </Link>{" "}
            for washers, dryers, dishwashers, range hoods, and over-the-range microwaves. We
            work on the brands found in Ottawa homes, including Whirlpool, Samsung, LG, GE,
            Frigidaire, Bosch, KitchenAid, Maytag, Kenmore, and many more.
          </p>
          <h2 className="mt-10 text-3xl font-extrabold text-[#3b2b0f]">Serving All of Ottawa</h2>
          <p className="mt-4 text-sm leading-7 text-[#7e6b45] md:text-base">
            From downtown and Centretown to the suburbs, we travel to you. We have dedicated pages
            for{" "}
            {serviceAreaPages.map((area, index) => (
              <span key={area.slug}>
                <Link
                  href={`/service-areas/${area.slug}`}
                  className="font-semibold text-[#5f4714] underline"
                >
                  {area.name}
                </Link>
                {index < serviceAreaPages.length - 2 ? ", " : index === serviceAreaPages.length - 2 ? ", and " : ""}
              </span>
            ))}
            , and we regularly serve every other Ottawa neighbourhood as well. Not sure what&apos;s
            wrong with your appliance? Start with our{" "}
            <Link href="/blog" className="font-semibold text-[#5f4714] underline">
              troubleshooting guides
            </Link>
            , or{" "}
            <Link href="/online-booking" className="font-semibold text-[#5f4714] underline">
              book a visit online
            </Link>
            .
          </p>
        </div>
      </Section>

      <Section className="bg-[#f4c542] py-0 text-[#2f2512]">
        <div className="grid gap-px bg-[#fff2c9] md:grid-cols-4">
          {[
            ["Our Mission", "Deliver dependable service every day."],
            ["Our Promise", "Respect your home and your schedule."],
            ["Our Essence", "Clarity, quality, consistency."],
            ["Our Culture", "Family-focused and service-first."],
          ].map(([title, text]) => (
            <div key={title} className="bg-[#f4c542] px-6 py-8 text-center">
              <h3 className="text-2xl font-extrabold">{title}</h3>
              <p className="mt-2 text-sm text-[#5f4714]">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <CtaBand />
    </main>
  );
}
