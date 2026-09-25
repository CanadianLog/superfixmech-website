import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { installationPages } from "@/lib/site-data";

const summaryByInstallation: Record<string, string> = {
  "washer-installation":
    "Proper hookup, levelling, and leak testing so your new washer runs quietly and drains correctly from day one.",
  "dryer-installation":
    "Safe venting, power/gas hookup, and load testing for new dryer installs, including dryer-vent checks.",
  "dishwasher-installation":
    "Water line, drain, and electrical hookup for new dishwashers, with a full cycle test before we leave.",
  "range-hood-installation":
    "Mounting, ducting, and electrical connection for new range hoods, including ventilation checks for proper airflow.",
  "otr-microwave-installation":
    "Secure mounting, venting, and electrical hookup for over-the-range microwaves, matched to your cabinet and range clearance.",
};

export const metadata: Metadata = {
  title: "Appliance Installation Ottawa | SuperFix Mechanical",
  description:
    "Professional appliance installation in Ottawa for washers, dryers, dishwashers, range hoods, and OTR microwaves. Certified technicians, same-day availability.",
};

export default function InstallationPage() {
  return (
    <main>
      <PageHero
        title="Appliance Installation Services"
        subtitle="Browse our installation categories and choose the appliance install you need."
      />
      <Section>
        <div className="text-center">
          <Badge>Installation Catalog</Badge>
          <h2 className="mt-4 text-3xl font-extrabold text-[#3b2b0f] md:text-4xl">
            Find Your Appliance Type
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {installationPages.map((installation) => (
            <Card key={installation.slug} className="overflow-hidden p-0">
              <Image
                src={`/service-photos/${installation.slug}.jpg`}
                alt={installation.name}
                width={1125}
                height={2000}
                className="aspect-[4/3] w-full object-cover object-center"
              />
              <div className="p-5">
                <h3 className="text-xl font-bold text-[#5f4714]">{installation.name}</h3>
                <p className="mt-2 text-sm leading-7 text-[#7e6b45]">
                  {summaryByInstallation[installation.slug]}
                </p>
                <Link
                  href={`/installation/${installation.slug}`}
                  className="mt-4 inline-block text-sm font-semibold text-[#7a5d1f] hover:underline"
                >
                  Open installation page
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Section>
      <CtaBand />
    </main>
  );
}
