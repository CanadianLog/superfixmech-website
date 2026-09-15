import type { Metadata } from "next";
import { PolicyContent } from "@/components/sections/policy-content";

export const metadata: Metadata = {
  title: "Refund Policy | SuperFix Mechanical",
  description:
    "Refund policy for parts and service charges with SuperFix Mechanical appliance repair, Ottawa.",
};

export default function RefundPolicyPage() {
  return (
    <main>
      <PolicyContent
        title="Refund Policy"
        intro="This placeholder refund policy clarifies service fees, final-sale parts, and exception handling."
        sections={[
          {
            heading: "Parts Sales",
            points: [
              "Installed or opened parts are considered final sale.",
              "Unused parts may be eligible for review within policy limits.",
              "Any exceptions require written authorization.",
            ],
          },
          {
            heading: "Service Charges",
            points: [
              "Diagnostic fees are non-refundable once service is delivered.",
              "Completed labour charges are non-refundable, except where required by law.",
              "Approved warranty claims are handled under the warranty policy.",
            ],
          },
        ]}
      />
    </main>
  );
}
