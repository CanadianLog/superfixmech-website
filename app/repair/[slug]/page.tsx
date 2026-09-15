import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/sections/service-detail";
import { servicePages } from "@/lib/site-data";

const serviceContent: Record<
  string,
  {
    overview: string;
    bullets: string[];
    faq: string[];
  }
> = {
  "fridge-repair": {
    overview:
      "Fast diagnostics and dependable repair support for temperature, noise, and component issues in modern refrigerators.",
    bullets: [
      "Fridge not cooling",
      "Water leaking",
      "Noisy compressor sounds",
      "Ice maker failures",
      "Door seal damage",
    ],
    faq: [
      "Why is my fridge not cooling evenly?",
      "Why is my fridge leaking water?",
      "Why is my fridge making unusual noises?",
    ],
  },
  "dishwasher-repair": {
    overview:
      "Professional dishwasher troubleshooting for drainage, cleaning quality, and recurring cycle performance concerns.",
    bullets: [
      "Dishwasher not draining",
      "Poor cleaning results",
      "Water not filling",
      "Door latch problems",
      "Unusual vibration",
    ],
    faq: [
      "Why are dishes still dirty after a cycle?",
      "Why does my dishwasher stop mid-cycle?",
      "Why is water pooling at the bottom?",
    ],
  },
  "cooktop-repair": {
    overview:
      "Reliable cooktop service for electric and gas systems with clear, safety-first diagnostics and repairs.",
    bullets: [
      "Heating element failure",
      "Ignition problems",
      "Inconsistent heat levels",
      "Knob or switch failure",
      "Surface indicator issues",
    ],
    faq: [
      "Why is one burner not heating?",
      "Why is ignition delayed on gas burners?",
      "Why does the control panel reset itself?",
    ],
  },
  "range-hood-repair": {
    overview:
      "Restore ventilation and kitchen airflow performance through detailed fan, switch, and ducting diagnostics.",
    bullets: [
      "Weak airflow",
      "Excessive fan noise",
      "Non-working lights",
      "Control panel faults",
      "Odor retention",
    ],
    faq: [
      "Why is the fan not pulling enough air?",
      "Why does the hood vibrate or rattle?",
      "Why are cooking odors lingering longer?",
    ],
  },
  "washer-repair": {
    overview:
      "Complete washer repairs for drainage, spin, and control issues with practical recommendations for care and prevention.",
    bullets: [
      "Drum not spinning",
      "Water not draining",
      "Excessive vibration",
      "Cycle stops unexpectedly",
      "Door lock faults",
    ],
    faq: [
      "Why does my washer stop mid-cycle?",
      "Why is my washer leaking around the door?",
      "Why does the drum shake loudly?",
    ],
  },
  "dryer-repair": {
    overview:
      "Dependable dryer repair services focused on heating performance, airflow, and cycle completion reliability.",
    bullets: [
      "No heat",
      "Long drying times",
      "Not starting",
      "Loud noise",
      "Burning odor concerns",
    ],
    faq: [
      "Why is my dryer taking so long to dry?",
      "Why does the dryer stop before finishing?",
      "Why is my dryer running but not heating?",
    ],
  },
  "microwave-repair": {
    overview:
      "Microwave repair and diagnostics for heating failures, display issues, and door latch systems in built-in and countertop models.",
    bullets: [
      "Not heating",
      "Turntable not spinning",
      "Display/control errors",
      "Door latch failure",
      "Sparking concerns",
    ],
    faq: [
      "Why is food heating unevenly?",
      "Why is the microwave noisy while running?",
      "Why does the microwave shut off suddenly?",
    ],
  },
  "oven-repair": {
    overview:
      "Targeted oven repair services for temperature control, baking consistency, and electrical or ignition reliability.",
    bullets: [
      "Not heating to target temp",
      "Uneven cooking",
      "Error code display",
      "Ignition failures",
      "Door not closing correctly",
    ],
    faq: [
      "Why does preheat take too long?",
      "Why is one side cooking faster?",
      "Why does the oven turn off unexpectedly?",
    ],
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = servicePages.find((item) => item.slug === slug);

  if (!service) {
    notFound();
  }

  const content = serviceContent[slug];

  return (
    <ServiceDetail
      title={service.name}
      overview={content.overview}
      bullets={content.bullets}
      faq={content.faq}
    />
  );
}

export function generateStaticParams() {
  return servicePages.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = servicePages.find((item) => item.slug === slug);

  if (!service) {
    return {};
  }

  return {
    title: `${service.name} Ottawa | SuperFix Mechanical`,
    description: `Professional ${service.name.toLowerCase()} in Ottawa. Same-day diagnostics, certified technicians, and a 30-day warranty on parts and labour. Call 613-366-7009.`,
  };
}
