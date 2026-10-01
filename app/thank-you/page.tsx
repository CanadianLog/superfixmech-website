import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { company } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Thank You | SuperFix Mechanical",
  description: "We've received your appointment request.",
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <main>
      <Section className="py-20 text-center md:py-28">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-extrabold text-[#3b2b0f] md:text-5xl">
            Thanks, we&apos;ve got your request!
          </h1>
          <p className="mt-5 text-base leading-7 text-[#7e6b45]">
            We&apos;ll call you shortly to confirm your appointment time. Keep your phone handy;
            the call may come from {company.phone}.
          </p>
          <p className="mt-3 text-base leading-7 text-[#7e6b45]">
            Need help right away? Call us at{" "}
            <a href="tel:+16133667009" className="font-semibold text-[#5f4714] underline">
              {company.phone}
            </a>
            .
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/" variant="primary">
              Back to Home
            </Button>
            <Button href="/blog" variant="outline">
              Troubleshooting Tips
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
