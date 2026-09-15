import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <article className={cn("surface p-5 md:p-6", className)}>{children}</article>;
}
