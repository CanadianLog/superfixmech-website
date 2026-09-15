import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

type CtaBandProps = {
  title?: string;
  subtitle?: string;
};

export function CtaBand({
  title = "Ready to Fix Your Appliance Issue?",
  subtitle = "Book with confidence. Certified technicians. Guaranteed results.",
}: CtaBandProps) {
  return (
    <Section className="bg-[#fff7da] py-16 text-center text-[#3b2b0f] md:py-20">
      <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-3 text-sm text-[#7e6b45] md:text-base">{subtitle}</p>
      <Button href="/online-booking" variant="primary" className="mt-6">
        Book Now
      </Button>
    </Section>
  );
}
