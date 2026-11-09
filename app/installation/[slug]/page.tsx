import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type ExtraSection, ServiceDetail } from "@/components/sections/service-detail";
import { company, installationPages } from "@/lib/site-data";

const installationContent: Record<
  string,
  {
    overview: string;
    bullets: string[];
    image: string;
    metaTitle?: string;
    metaDescription?: string;
    extraSections?: ExtraSection[];
    faq: { question: string; answer: string }[];
  }
> = {
  "washer-installation": {
    overview:
      "Professional washer installation in Ottawa, from hookup to first cycle. We connect your water supply and drain lines, level the machine, and test for leaks and proper drainage before we consider the job done.",
    bullets: [
      "Water supply and drain line hookup",
      "Levelling to prevent excess vibration",
      "Leak and drainage testing",
      "Removal and disposal of old unit (on request)",
      "Compatibility check for stacked or space-constrained setups",
    ],
    image: "/service-photos/washer-installation.jpg",
    faq: [
      {
        question: "Do you install stackable washer/dryer units?",
        answer:
          "Yes, we install stackable and side-by-side washer/dryer setups, including the stacking kit and any bracket hardware needed to secure the units safely.",
      },
      {
        question: "Will you take away my old washer?",
        answer:
          "We can remove and dispose of your old washer as part of the installation if you let us know in advance — just mention it when booking.",
      },
      {
        question: "How long does a washer installation take?",
        answer:
          "Most standard washer installations take under an hour, including hookup, levelling, and a test cycle to confirm everything is working correctly.",
      },
    ],
  },
  "dryer-installation": {
    overview:
      "Safe, code-correct dryer installation in Ottawa, covering electrical or gas hookup and proper venting so your dryer runs efficiently and safely from the start.",
    bullets: [
      "Electrical (240V) or gas line hookup",
      "Dryer vent connection and airflow check",
      "Levelling and stability adjustment",
      "Cord and outlet compatibility check",
      "Load test to confirm heating and cycle performance",
    ],
    image: "/service-photos/dryer-installation.jpg",
    metaTitle: "Dryer Installation in Ottawa | SuperFix Mechanical",
    metaDescription:
      "Electric and gas dryer installation in Ottawa with vent check and load test. Serving Kanata, Orleans, Nepean and Barrhaven. Call 613-366-7009.",
    extraSections: [
      {
        heading: "Before your dryer installation",
        points: [
          "Confirm whether your hookup is electric or gas. A gas dryer needs a gas line already in place.",
          "Check that the new dryer's plug matches your outlet. We flag any mismatch before we start.",
          "Leave clear access to the dryer space and the vent opening.",
          "Tell us when booking if you want the old dryer removed.",
        ],
      },
      {
        heading: "Why dryer venting matters",
        paragraphs: [
          "A restricted vent makes a dryer work harder, stretches drying times and is a fire risk. We check the existing vent run for lint buildup and kinks as part of every install.",
          "Already living with a slow dryer? These guides can help:",
        ],
        links: [
          { href: "/blog/dryer-taking-too-long-to-dry", label: "Why is my dryer taking so long?" },
          { href: "/repair/dryer-repair", label: "Dryer repair in Ottawa" },
        ],
      },
    ],
    faq: [
      {
        question: "Do you install gas dryers as well as electric?",
        answer:
          "Yes, we install both electric and gas dryers, including connecting to an existing gas line where one is already in place.",
      },
      {
        question: "Can you check my dryer vent while installing a new unit?",
        answer:
          "Yes — we check the existing vent run for restrictions or lint buildup as part of the install, since a blocked vent is a common cause of long drying times and a fire risk.",
      },
      {
        question: "What if my new dryer needs a different outlet or cord?",
        answer:
          "We'll flag any mismatch between your new dryer's plug and your existing outlet before starting, so there are no surprises — in most cases this is a quick fix.",
      },
    ],
  },
  "dishwasher-installation": {
    overview:
      "Complete dishwasher installation in Ottawa, including water supply, drain, and electrical hookup, with a full cycle test before we leave to confirm proper fill, wash, and drain. Standard installs are $185 plus tax.",
    bullets: [
      "Water supply line connection",
      "Drain hose routing and connection",
      "Electrical hookup (hardwired or plug-in)",
      "Cabinet fit and levelling",
      "Full cycle test for leaks and drainage",
    ],
    image: "/service-photos/dishwasher-installation.jpg",
    metaTitle: "Dishwasher Installation in Ottawa | SuperFix Mechanical",
    metaDescription:
      "Dishwasher installation in Ottawa with water, drain and power hookup and a full test cycle. Serving Kanata, Orleans and Nepean. Call 613-366-7009.",
    extraSections: [
      {
        heading: "How to prepare for your dishwasher installation",
        points: [
          "Measure the cabinet opening and compare it with the new dishwasher's spec sheet.",
          "Clear the space under the sink so we can reach the shut-off valve and drain connection.",
          "Make sure the water shut-off valve turns and a power connection is nearby.",
          "Tell us when booking if you want the old dishwasher removed.",
        ],
      },
      {
        heading: "Repair it or replace it?",
        paragraphs: [
          "If your current dishwasher keeps leaking, won't drain or has worn out, it may be time for a new one. These pages can help you decide:",
        ],
        links: [
          { href: "/blog/repair-or-replace-appliance", label: "Repair or replace an appliance?" },
          { href: "/blog/dishwasher-not-draining", label: "Dishwasher not draining" },
          { href: "/repair/dishwasher-repair", label: "Dishwasher repair in Ottawa" },
        ],
      },
    ],
    faq: [
      {
        question: "How much does dishwasher installation cost in Ottawa?",
        answer: `A standard dishwasher installation is $${company.installPrice} plus tax. That covers connecting to your existing water shut-off, drain and electrical outlet. Extra plumbing or wiring, or hauling away the old unit, is quoted before we begin. We confirm the price before we start work.`,
      },
      {
        question: "Can you install a dishwasher in a cabinet opening built for a different brand?",
        answer:
          "In most cases, yes — standard dishwasher openings are a common size, and we'll check fit and adjust mounting brackets or trim kits as needed during the install.",
      },
      {
        question: "Do you connect the dishwasher to my garbage disposal or drain line?",
        answer:
          "Yes, we route and connect the drain line to your existing disposal or drain connection and check for proper drainage before finishing the job.",
      },
      {
        question: "Will you test the dishwasher before you leave?",
        answer:
          "Yes, we run a full cycle after installation to confirm there are no leaks and that fill, wash, and drain are all working properly.",
      },
    ],
  },
  "range-hood-installation": {
    overview:
      "Range hood installation in Ottawa covering mounting, ducting, and electrical connection, with an airflow check to confirm proper ventilation for your kitchen. Standard installs are $185 plus tax.",
    bullets: [
      "Secure wall or under-cabinet mounting",
      "Ducted or ductless setup",
      "Electrical connection and switch/light testing",
      "Ventilation and airflow check",
      "Filter and light installation",
    ],
    image: "/service-photos/range-hood-installation.jpg",
    faq: [
      {
        question: "How much does range hood installation cost in Ottawa?",
        answer: `A standard range hood installation is $${company.installPrice} plus tax. That covers mounting and connecting the hood to existing ductwork and power. New ducting, new wiring or a new outlet is quoted before we begin. We confirm the price before we start work.`,
      },
      {
        question: "Can you install a range hood if I don't have existing ductwork?",
        answer:
          "Yes — we can install a ducted hood by routing new ductwork where feasible, or install a ductless (recirculating) range hood if running new ducting isn't practical for your kitchen.",
      },
      {
        question: "Do you handle both wall-mount and under-cabinet range hoods?",
        answer:
          "Yes, we install both wall-mounted and under-cabinet range hoods, matched to your existing cabinet layout and clearance above the cooktop.",
      },
      {
        question: "Will the range hood be properly vented to the outside?",
        answer:
          "For ducted installs, yes — we confirm the vent run terminates outside and check airflow to make sure the hood is actually clearing smoke, steam, and odors.",
      },
    ],
  },
  "otr-microwave-installation": {
    overview:
      "Over-the-range (OTR) microwave installation in Ottawa, including secure mounting, venting, and electrical hookup, matched to your cabinet and range clearance for safe everyday use. Standard installs are $185 plus tax.",
    bullets: [
      "Secure wall/cabinet mounting bracket installation",
      "Venting (external exhaust or recirculating)",
      "Electrical hookup and outlet check",
      "Clearance check above the range for safe operation",
      "Removal of old unit (on request)",
    ],
    image: "/service-photos/otr-microwave-installation.jpg",
    faq: [
      {
        question: "How much does over-the-range microwave installation cost in Ottawa?",
        answer: `A standard over-the-range microwave installation is $${company.installPrice} plus tax. That covers mounting and connecting to an existing outlet and venting. New ducting, new wiring or a new outlet is quoted before we begin. We confirm the price before we start work.`,
      },
      {
        question: "Can you install an OTR microwave in the same spot as my old one?",
        answer:
          "In most cases yes — if the new microwave is a similar size, we can typically reuse the existing mounting points and venting; if dimensions differ, we'll adjust the bracket and venting as needed.",
      },
      {
        question: "Do you vent OTR microwaves to the outside or recirculate?",
        answer:
          "We install either setup depending on your kitchen — external venting where ductwork is available, or a recirculating charcoal filter setup where it isn't.",
      },
      {
        question: "Is it safe to install an OTR microwave myself?",
        answer:
          "OTR microwaves are heavy and mounted above your range, so incorrect installation is a real safety risk. We recommend professional installation to make sure the bracket, weight support, and clearance are all correct.",
      },
    ],
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function InstallationServicePage({ params }: Props) {
  const { slug } = await params;
  const installation = installationPages.find((item) => item.slug === slug);

  if (!installation) {
    notFound();
  }

  const content = installationContent[slug];

  return (
    <ServiceDetail
      title={installation.name}
      overview={content.overview}
      bullets={content.bullets}
      bulletsHeading="What's included:"
      faq={content.faq}
      faqTitle="Installation FAQs"
      heroImage={content.image}
      path={`/installation/${slug}`}
      parent={{ name: "Installation", path: "/installation" }}
      serviceType="Appliance installation"
      extraSections={content.extraSections}
      areasHeading={content.extraSections ? "Appliance installation across Ottawa" : undefined}
      areasIntro={
        content.extraSections
          ? `We install ${installation.name.replace(/ installation$/i, "").toLowerCase()}s in Ottawa and nearby communities. Find your neighbourhood:`
          : undefined
      }
    />
  );
}

export function generateStaticParams() {
  return installationPages.map((installation) => ({ slug: installation.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const installation = installationPages.find((item) => item.slug === slug);

  if (!installation) {
    return {};
  }

  return {
    title: installationContent[slug]?.metaTitle ?? `${installation.name} Ottawa | SuperFix Mechanical`,
    description: installationContent[slug]?.metaDescription ?? `Professional ${installation.name.toLowerCase()} in Ottawa. Certified technicians, safe hookup, and full testing on every install. Call 613-366-7009 to book.`,
  };
}
