"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const brandLogos: Array<
  { name: string; src: string; type: "icon" } | { name: string; type: "wordmark" }
> = [
  { name: "Samsung", src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/samsung.svg", type: "icon" },
  { name: "Roper", type: "wordmark" },
  { name: "Panasonic", src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/panasonic.svg", type: "icon" },
  { name: "NuTone", type: "wordmark" },
  { name: "Maytag", src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/maytag.svg", type: "icon" },
  { name: "LG", src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/lg.svg", type: "icon" },
  { name: "GE", src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/generalelectric.svg", type: "icon" },
  { name: "KitchenAid", type: "wordmark" },
  { name: "Kenmore", type: "wordmark" },
  { name: "JennAir", type: "wordmark" },
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
