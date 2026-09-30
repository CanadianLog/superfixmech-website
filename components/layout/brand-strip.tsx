"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const brandLogos: Array<
  { name: string; src: string; type: "icon" } | { name: string; type: "wordmark" }
> = [
  { name: "Whirlpool", src: "/brand-logos/whirlpool.svg", type: "icon" },
  { name: "Samsung", src: "/brand-logos/samsung.svg", type: "icon" },
  { name: "LG", src: "/brand-logos/lg.svg", type: "icon" },
  { name: "GE", src: "/brand-logos/ge.svg", type: "icon" },
  { name: "Frigidaire", src: "/brand-logos/frigidaire.svg", type: "icon" },
  { name: "Bosch", src: "/brand-logos/bosch.svg", type: "icon" },
  { name: "KitchenAid", src: "/brand-logos/kitchenaid.svg", type: "icon" },
  { name: "Maytag", src: "/brand-logos/maytag.svg", type: "icon" },
  { name: "Kenmore", src: "/brand-logos/kenmore.svg", type: "icon" },
  { name: "Electrolux", src: "/brand-logos/electrolux.svg", type: "icon" },
  { name: "JennAir", src: "/brand-logos/jennair.svg", type: "icon" },
  { name: "Amana", src: "/brand-logos/amana.svg", type: "icon" },
  { name: "Panasonic", src: "/brand-logos/panasonic.svg", type: "icon" },
  { name: "IKEA", src: "/brand-logos/ikea.svg", type: "icon" },
  { name: "Admiral", src: "/brand-logos/admiral.svg", type: "icon" },
  { name: "Inglis", src: "/brand-logos/inglis.svg", type: "icon" },
  { name: "Danby", src: "/brand-logos/danby.png", type: "icon" },
  { name: "Blomberg", src: "/brand-logos/blomberg.svg", type: "icon" },
  { name: "Broan", src: "/brand-logos/broan.png", type: "icon" },
  { name: "NuTone", src: "/brand-logos/nutone.png", type: "icon" },
  { name: "Venmar", src: "/brand-logos/venmar.png", type: "icon" },
  { name: "Best", src: "/brand-logos/best.svg", type: "icon" },
  { name: "Roper", src: "/brand-logos/roper.png", type: "icon" },
];

type BrandStripProps = {
  variant?: "default" | "hero";
  className?: string;
};

export function BrandStrip({ variant = "default", className }: BrandStripProps) {
  const doubled = [...brandLogos, ...brandLogos];
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "overflow-hidden border-y",
        isHero
          ? "border-[#d9b557] bg-[#f4c542] py-6 md:py-7"
          : "border-[#d9b557] bg-[#f4c542] py-5",
        className,
      )}
    >
      <div className="brand-carousel-track">
        {doubled.map((brand, index) => (
          <div
            key={`${brand.name}-${index}`}
            className={cn(
              "mx-4 flex shrink-0 items-center justify-center px-2 md:mx-5",
              isHero ? "h-12 w-[144px] md:w-[160px]" : "h-11 w-[120px] md:w-[128px]",
            )}
          >
            {brand.type === "icon" ? (
              <Image
                src={brand.src}
                alt={brand.name}
                width={104}
                height={32}
                className={cn(
                  "object-contain grayscale opacity-85",
                  isHero ? "h-9 w-[120px] md:h-10 md:w-[130px]" : "h-8 w-[104px]",
                )}
                unoptimized
              />
            ) : (
              <span
                className={cn(
                  "font-extrabold uppercase tracking-[0.11em] text-[#5f4714]",
                  isHero ? "text-base md:text-lg" : "text-sm",
                )}
              >
                {brand.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
