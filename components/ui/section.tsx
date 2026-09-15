import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
};

export function Section({ children, className, innerClassName }: SectionProps) {
  return (
    <section className={cn("py-14 md:py-20", className)}>
      <Container className={innerClassName}>{children}</Container>
    </section>
  );
}
