import type { Metadata } from "next";
import { HomeSections } from "@/components/sections/home-sections";

export const metadata: Metadata = {
  title: "SuperFix Mechanical | Ottawa Appliance Repair Experts",
  description:
    "Same-day appliance repair in Ottawa. Certified technicians for fridges, washers, dryers, dishwashers, ovens, and more. Fast, affordable, and guaranteed.",
};

export default function HomePage() {
  return <HomeSections />;
}
