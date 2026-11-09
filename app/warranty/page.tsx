import type { Metadata } from "next";
import { PolicyContent } from "@/components/sections/policy-content";

export const metadata: Metadata = {
  title: "Warranty Policy | SuperFix Mechanical",
  description:
    "30-day warranty on parts and labour for appliance repairs completed by SuperFix Mechanical in Ottawa.",
};

export default function WarrantyPage() {
  return (
    <main>
      <PolicyContent
        title="Warranty Policy"
        intro="Every repair completed by SuperFix Mechanical is covered by a 30-day warranty on parts and labour. This policy explains what is covered and the conditions that apply."
        sections={[
          {
            heading: "30-Day Warranty on Parts & Labour",
            points: [
              "Coverage applies to the originally serviced issue only.",
              "If the same issue recurs within 30 days, re-inspection is included.",
              "If an installed part fails in the covered window, replacement is included.",
            ],
          },
          {
            heading: "Conditions of Warranty",
            points: [
              "Coverage begins from the service date.",
              "Warranty may be void for misuse or unauthorized modifications.",
              "Cosmetic and pre-existing conditions are excluded unless documented.",
            ],
          },
        ]}
      />
    </main>
  );
}
