import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Appliance Maintenance Plans | SuperFix Mechanical",
  description:
    "Preventive appliance maintenance in Ottawa — seasonal checks, safety inspections, and priority scheduling to reduce unexpected breakdowns.",
};

export default function MaintenancePage() {
  return (
    <main>
      <PageHero
        title="Preventive Maintenance"
        subtitle="Routine service plans to reduce unexpected appliance downtime."
      />
      <Section>
        <div className="mb-8 overflow-hidden rounded-2xl border border-[#f1dfab]">
          <Image
            src="/stock/kitchen.jpg"
            alt="Appliance maintenance stock"
            width={1400}
            height={933}
            className="h-[260px] w-full object-cover md:h-[320px]"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Seasonal performance checks",
            "Safety and efficiency inspection",
            "Priority scheduling reminders",
          ].map((title) => (
            <Card key={title}>
              <h2 className="text-2xl font-extrabold text-[#3b2b0f]">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#7e6b45]">
                Placeholder plan details, service windows, and expected maintenance tasks.
              </p>
            </Card>
          ))}
        </div>
      </Section>
      <CtaBand />
    </main>
  );
}
