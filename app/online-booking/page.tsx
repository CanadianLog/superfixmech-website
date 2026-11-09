import type { Metadata } from "next";
import Link from "next/link";
import { BookingRequestForm } from "@/components/sections/booking-request-form";
import { FaqList } from "@/components/sections/faq-list";
import { PageHero } from "@/components/sections/page-hero";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { serviceAreaPages } from "@/lib/service-areas";
import { company, servicePages } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Book a Service Appointment | SuperFix Mechanical",
  description:
    "Book appliance repair service in Ottawa online. Tell us about your issue and we'll confirm a time — fast, same-day appointments available.",
};

const steps = [
  {
    title: "Tell us what's wrong",
    body: "Pick your appliance, describe the problem, and share your address and contact details using the form below.",
  },
  {
    title: "We confirm your time",
    body: "We review your request and get back to you to confirm an appointment window that works for you.",
  },
  {
    title: "Diagnosis and repair",
    body: "A certified technician diagnoses the problem and gives you a clear quote before any repair work begins.",
  },
];

const faq = [
  {
    question: "Which appliances do you repair?",
    answer: `We repair ${servicePages
      .map((service) => service.name.replace(/ Repair$/i, "").toLowerCase())
      .join(", ")}. Choose your appliance in the booking form and describe what it is doing.`,
  },
  {
    question: "Where do you provide service?",
    answer: `We serve Ottawa and nearby communities, including ${serviceAreaPages
      .map((area) => area.name)
      .join(", ")}. If you are unsure whether we cover your address, call ${company.phone}.`,
  },
  {
    question: "Can I get a same-day appointment?",
    answer:
      "Same-day appointments are often available. Submit the form or call us and we will confirm the earliest time we can reach you.",
  },
  {
    question: "Will I know the price before the repair starts?",
    answer:
      "Yes. We diagnose the problem first and give you a clear quote before any repair work begins, so there are no surprises.",
  },
  {
    question: "Is there a warranty on repairs?",
    answer:
      "Repairs are backed by our 30-day warranty. See the warranty policy for the full details.",
  },
  {
    question: "How much does a diagnostic cost?",
    answer: `The diagnostic fee is $${company.diagnosticFee} plus tax. The technician finds the fault and gives you a quote for the repair before any work begins.`,
  },
  {
    question: "What are your hours?",
    answer: `We are open ${company.hours.label.toLowerCase()}, including weekends. Call ${company.phone} or book online any time.`,
  },
];

export default function OnlineBookingPage() {
  return (
    <main>
      <PageHero
        title="Book a Service Appointment"
        subtitle="Tell us about your appliance issue and we'll get back to you to confirm a time."
      />
      <Section innerClassName="max-w-5xl">
        <h2 className="mb-6 text-center text-3xl font-extrabold text-[#3b2b0f] md:text-4xl">
          Request your appointment
        </h2>
        <div className="rounded-2xl border border-[#f1dfab] bg-white p-5 shadow-[0_10px_30px_-18px_rgba(74,52,12,0.25)] md:p-8">
          <BookingRequestForm />
        </div>
      </Section>
      <Section className="pt-0 md:pt-0" innerClassName="max-w-5xl">
        <h2 className="mb-7 text-center text-3xl font-extrabold text-[#3b2b0f] md:text-4xl">
          How booking works
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title}>
              <h3 className="text-xl font-extrabold text-[#3b2b0f]">
                {index + 1}. {step.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#7e6b45]">{step.body}</p>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-center text-sm leading-7 text-[#7e6b45]">
          Prefer to talk to someone? Call{" "}
          <a className="font-semibold underline" href="tel:+16133667009">
            {company.phone}
          </a>
          . You can also read our{" "}
          <Link className="font-semibold underline" href="/warranty">
            warranty policy
          </Link>{" "}
          before you book.
        </p>
      </Section>
      <FaqList title="Booking Questions" items={faq} />
    </main>
  );
}
