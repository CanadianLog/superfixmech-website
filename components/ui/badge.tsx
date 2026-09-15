import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border border-[#f0d98e] bg-[#fff7da] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7a5d1f]",
        className,
      )}
    >
      {children}
    </span>
  );
}
