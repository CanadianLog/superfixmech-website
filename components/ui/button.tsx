import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "outline" | "light";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200";

const stylesByVariant = {
  primary:
    "bg-[#f4c542] text-[#2f2512] hover:-translate-y-0.5 hover:bg-[#e9b82f] shadow-[0_10px_20px_-14px_rgba(141,97,14,0.55)]",
  outline: "border border-[#e8c96b] bg-white text-[#5f4714] hover:bg-[#fff6dd]",
  light:
    "border border-[#f9de87] bg-[#fff8df] text-[#5f4714] hover:bg-[#f4c542] hover:text-[#2f2512]",
};

export function Button({
  children,
  href,
  type = "button",
  variant = "primary",
  className,
  disabled,
  onClick,
}: ButtonProps) {
  const classes = cn(
    baseStyles,
    stylesByVariant[variant],
    disabled && "pointer-events-none opacity-60",
    className
  );

  if (href && !disabled) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
