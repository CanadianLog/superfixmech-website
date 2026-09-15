import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/sections/cta-band";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "About Us | SuperFix Mechanical",
  description:
    "Family-owned appliance repair company serving Ottawa. Quality work, honest pricing, and a commitment to treating every customer like family.",
};

export default function AboutPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#5f4714]">
        <div className="absolute inset-0 opacity-35">
          <Image src="/stock/banner-generic.jpg" alt="" fill className="object-cover" />
        </div>
        <Container className="relative z-10 py-14 text-center text-white md:py-16">
          <h1 className="text-4xl font-extrabold md:text-5xl">OUR JOURNEY</h1>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.1em] text-white/90">
            Built on Trust. Driven by Family. Powered by Knowledge.
          </p>
        </Container>
      </section>

      <Section className="py-14">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <article className="surface p-6 md:p-8">
            <Badge>Humble Beginnings</Badge>
            <h2 className="mt-4 text-3xl font-extrabold text-[#3b2b0f]">
              A Family Owned Business
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#7e6b45]">
              We treat you like family ensuring quality work, professional service, affordable prices &amp; honesty. We are not satisfied until you are! High ethics and morals ensure a great experience for you and your family. We look forward to working with you and hope to service your appliance needs for years to come.
            </p>
          </article>
          <div className="surface overflow-hidden p-0">
            <Image
              src="/stock/van.jpg"
              alt="Company journey placeholder"
              width={1400}
              height={933}
              className="h-full w-full object-cover"
            />
          </div>
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
