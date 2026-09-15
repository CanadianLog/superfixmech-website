import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  subtitle: string;
  ctaHref?: string;
  ctaLabel?: string;
  mode?: "stacked" | "overlay" | "video";
  showCta?: boolean;
  className?: string;
};

export function PageHero({
  title,
  subtitle,
  ctaHref = "/online-booking",
  ctaLabel = "Book Now",
  mode = "stacked",
  showCta = false,
  className,
}: PageHeroProps) {
  if (mode === "video") {
    return (
      <section
        className={cn(
          "relative h-full min-h-[320px] overflow-hidden bg-[#4d3a10] md:min-h-[420px]",
          className,
        )}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        >
          <source
            src="https://framerusercontent.com/assets/Y0KHvF7TN2xrIaZjaq5VPPdmbo.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/65" />
        <Container className="relative z-10 flex h-full flex-col items-center justify-center pt-24 pb-10 text-center text-white md:pt-28 md:pb-14 lg:pt-36 lg:translate-y-[6vh]">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 md:text-lg">
            {subtitle}
          </p>
          {showCta && (
            <Button href={ctaHref} variant="light" className="mt-8 px-7 py-3 text-base">
              {ctaLabel}
            </Button>
          )}
        </Container>
      </section>
    );
  }

  if (mode === "overlay") {
    return (
      <section className="relative overflow-hidden bg-[#5f4714]">
        <div className="absolute inset-0 opacity-35">
          <Image src="/stock/banner-generic.jpg" alt="" fill className="object-cover" priority />
        </div>
        <Container className="relative z-10 py-16 text-center text-white md:py-24">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/90 md:text-base">{subtitle}</p>
          {showCta && (
            <Button href={ctaHref} variant="light" className="mt-6">
              {ctaLabel}
            </Button>
          )}
        </Container>
      </section>
    );
  }

  return (
    <section className={cn("overflow-hidden")}>
      <div className="relative h-[160px] bg-[#5f4714] md:h-[220px]">
        <Image src="/stock/banner-generic.jpg" alt="" fill className="object-cover" priority />
      </div>
      <div className="bg-[#5f4714] py-8 text-center text-white md:py-10">
        <Container>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 md:text-base">{subtitle}</p>
          {showCta && (
            <Button href={ctaHref} variant="light" className="mt-5">
              {ctaLabel}
            </Button>
          )}
        </Container>
      </div>
    </section>
  );
}
