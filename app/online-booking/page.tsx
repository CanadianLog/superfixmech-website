import type { Metadata } from "next";
import { BookingRequestForm } from "@/components/sections/booking-request-form";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Book a Service Appointment | SuperFix Mechanical",
  description:
    "Book appliance repair service in Ottawa online. Tell us about your issue and we'll confirm a time — fast, same-day appointments available.",
};

export default function OnlineBookingPage() {
  return (
    <main>
      <PageHero
        title="Book a Service Appointment"
        subtitle="Tell us about your appliance issue and we'll get back to you to confirm a time."
      />
      <Section innerClassName="max-w-5xl">
        <div className="rounded-2xl border border-[#f1dfab] bg-white p-5 shadow-[0_10px_30px_-18px_rgba(74,52,12,0.25)] md:p-8">
          <BookingRequestForm />
        </div>
      </Section>
    </main>
  );
}
