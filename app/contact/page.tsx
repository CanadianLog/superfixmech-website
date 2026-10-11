import type { Metadata } from "next";
import Link from "next/link";
import { HcpLeadForm } from "@/components/sections/hcp-lead-form";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { company } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact Us | SuperFix Mechanical",
  description:
    "Get in touch with SuperFix Mechanical for appliance repair in Ottawa. Call 613-366-7009 or send us a message and we'll get back to you.",
};

const { address } = company;

const contactItems = [
  {
    label: "Phone",
    value: company.phone,
    href: "tel:+16133667009",
    icon: "M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z",
  },
  {
    label: "Email",
    value: company.email,
    href: `mailto:${company.email}`,
    icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  },
  {
    label: "Address",
    value: `${address.streetAddress}, ${address.locality}, ${address.region}`,
    href: company.googleMaps,
    icon: "M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
  },
];

export default function ContactPage() {
  return (
    <main>
      <PageHero
        title="Contact Us"
        subtitle="We're here to help. Send a message and we will get back to you."
      />
      <Section innerClassName="grid max-w-5xl gap-8 md:grid-cols-[0.9fr_1.4fr] md:items-start">
        <aside className="rounded-2xl border border-[#ead8a4] bg-[#fffdf6] p-6">
          <h2 className="text-xl font-bold text-[#3b2b0f]">Get in touch</h2>
          <p className="mt-2 text-sm leading-6 text-[#7e6b45]">
            Call for the fastest response, or use the form and we&apos;ll call you back to book a
            time.
          </p>
          <ul className="mt-5 space-y-4">
            {contactItems.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4c542] text-[#2f2512]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={item.icon} />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#9b7a2d]">
                    {item.label}
                  </p>
                  <a
                    href={item.href}
                    className="text-sm font-semibold text-[#3b2b0f] hover:underline"
                    {...(item.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {item.value}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-[#ead8a4] pt-5 text-sm leading-6 text-[#7e6b45]">
            We serve Ottawa and surrounding areas, including{" "}
            <Link href="/service-areas/kanata" className="font-semibold text-[#5f4714] underline">
              Kanata
            </Link>
            ,{" "}
            <Link href="/service-areas/orleans" className="font-semibold text-[#5f4714] underline">
              Orleans
            </Link>
            ,{" "}
            <Link href="/service-areas/nepean" className="font-semibold text-[#5f4714] underline">
              Nepean
            </Link>{" "}
            and{" "}
            <Link href="/service-areas/barrhaven" className="font-semibold text-[#5f4714] underline">
              Barrhaven
            </Link>
            .
          </p>
        </aside>
        <HcpLeadForm />
      </Section>
    </main>
  );
}
