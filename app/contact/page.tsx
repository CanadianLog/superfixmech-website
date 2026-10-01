import type { Metadata } from "next";
import { HcpLeadForm } from "@/components/sections/hcp-lead-form";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Contact Us | SuperFix Mechanical",
  description:
    "Get in touch with SuperFix Mechanical for appliance repair in Ottawa. Call 613-366-7009 or send us a message and we'll get back to you.",
};

export default function ContactPage() {
  return (
    <main>
      <PageHero
        title="Contact Us"
        subtitle="We're here to help. Send a message and we will get back to you."
      />
      <Section innerClassName="max-w-4xl">
        <HcpLeadForm />
      </Section>
    </main>
  );
}
