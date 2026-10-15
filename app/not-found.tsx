import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { company } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Page Not Found | SuperFix Mechanical",
  description: "The page you were looking for could not be found.",
  alternates: { canonical: null },
};

const popularLinks = [
  { href: "/repair", label: "Appliance repair services" },
  { href: "/installation", label: "Appliance installation" },
  { href: "/blog", label: "Troubleshooting guides" },
  { href: "/about", label: "About SuperFix Mechanical" },
];

export default function NotFound() {
  return (
    <main>
      <Section className="py-20 text-center md:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#9b7a2d]">Error 404</p>
          <h1 className="mt-3 text-4xl font-extrabold text-[#3b2b0f] md:text-5xl">
            Sorry, we couldn&apos;t find that page
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#7e6b45]">
            The link may be old or mistyped. If your appliance needs help, we&apos;re just a call
            away at{" "}
            <a href="tel:+16133667009" className="font-semibold text-[#5f4714] underline">
              {company.phone}
            </a>
            .
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/online-booking" variant="primary">
              Book a Repair
            </Button>
            <Button href="/" variant="outline">
              Back to Home
            </Button>
          </div>
          <ul className="mt-10 grid gap-3 text-left sm:grid-cols-2">
            {popularLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-xl border border-[#ead8a4] bg-[#fffdf6] px-4 py-3 text-sm font-semibold text-[#5f4714] transition hover:border-[#d9b557] hover:bg-[#fff7da]"
                >
                  {link.label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </main>
  );
}
