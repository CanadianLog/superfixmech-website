import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { servicePages } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Appliance Repair Ottawa | SuperFix Mechanical",
  description:
    "Browse appliance repair services in Ottawa — fridges, dishwashers, cooktops, range hoods, washers, dryers, microwaves, and ovens. Same-day service available.",
};

const mediaByService: Record<string, string> = {
  "fridge-repair": "/appliance-photos/fridge.png",
  "dishwasher-repair": "/appliance-photos/dishwasher.png",
  "cooktop-repair": "/appliance-photos/cooktop.png",
  "range-hood-repair": "/appliance-photos/range-hood.png",
  "washer-repair": "/appliance-photos/washer.png",
  "dryer-repair": "/appliance-photos/dryer.png",
  "microwave-repair": "/appliance-photos/microwave.png",
  "oven-repair": "/appliance-photos/oven.png",
};

export default function RepairPage() {
  return (
    <main>
      <PageHero
        title="Appliance Repair Services"
        subtitle="Browse our service categories and choose the appliance support you need."
      />
      <Section>
        <div className="text-center">
          <Badge>Repair Catalog</Badge>
          <h2 className="mt-4 text-3xl font-extrabold text-[#3b2b0f] md:text-4xl">
            Find Your Appliance Type
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {servicePages.map((service) => (
            <Card key={service.slug} className="overflow-hidden p-0">
              <Image
                src={mediaByService[service.slug]}
                alt={service.name}
                width={1400}
                height={933}
                className="aspect-[4/3] w-full object-cover object-top"
              />
              <div className="p-5">
              <h3 className="text-xl font-bold text-[#5f4714]">{service.name}</h3>
              <p className="mt-2 text-sm leading-7 text-[#7e6b45]">
                Placeholder service summary with common symptoms, expected process, and next
                steps.
              </p>
              <Link
                href={`/repair/${service.slug}`}
                className="mt-4 inline-block text-sm font-semibold text-[#7a5d1f] hover:underline"
              >
                Open service page
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
