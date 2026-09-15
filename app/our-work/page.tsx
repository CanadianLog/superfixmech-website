import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Our Work | SuperFix Mechanical",
  description:
    "See recent appliance repair projects completed by SuperFix Mechanical in Ottawa.",
};

const galleryImages = [
  "/stock/technician.jpg",
  "/stock/laundry.jpg",
  "/stock/cooking.jpg",
  "/stock/fridge.jpg",
  "/stock/dishwasher.jpg",
  "/stock/kitchen.jpg",
];

export default function OurWorkPage() {
  return (
    <main>
      <PageHero
        title="Our Work"
        subtitle="Project highlights, diagnostics snapshots, and before/after placeholders."
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item, index) => (
            <Card key={item} className="overflow-hidden p-0">
              <Image
                src={galleryImages[index]}
                alt="Work sample placeholder"
                width={1400}
                height={933}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-5">
                <h2 className="text-xl font-extrabold text-[#3b2b0f]">Repair Case #{item}</h2>
                <p className="mt-2 text-sm leading-7 text-[#7e6b45]">
                  Placeholder summary for diagnosis notes, parts replaced, and outcome.
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Section>
      <CtaBand />
    </main>
  );
}
