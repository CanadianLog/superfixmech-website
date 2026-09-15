import type { Metadata } from "next";
import { PolicyContent } from "@/components/sections/policy-content";

export const metadata: Metadata = {
  title: "Cancellation Policy | SuperFix Mechanical",
  description:
    "Scheduling and cancellation policy for appliance repair appointments with SuperFix Mechanical in Ottawa.",
};

export default function CancellationPolicyPage() {
  return (
    <main>
      <PolicyContent
        title="Cancellation Policy"
        intro="This placeholder policy explains scheduling and cancellation expectations."
        sections={[
          {
            heading: "Notice Requirements",
            points: [
              "Cancellations made at least 24 hours in advance are free of charge.",
              "Late cancellations may include a scheduling fee.",
              "Rescheduling requests are reviewed based on technician availability.",
            ],
          },
          {
            heading: "How to Cancel",
            points: [
              "Use the phone number or email listed on this website.",
              "Provide your name, address, and appointment date for quick support.",
            ],
          },
        ]}
      />
    </main>
  );
}
