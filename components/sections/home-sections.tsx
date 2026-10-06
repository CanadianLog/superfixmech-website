import Image from "next/image";
import Link from "next/link";
import { BrandStrip } from "@/components/layout/brand-strip";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { serviceAreaPages } from "@/lib/service-areas";
import { company, servicePages } from "@/lib/site-data";

const mediaByService: Record<string, string> = {
  "fridge-repair": "/appliance-photos/fridge.png",
  "dishwasher-repair": "/appliance-photos/dishwasher.png",
  "cooktop-repair": "/appliance-photos/cooktop.png",
  "range-hood-repair": "/appliance-photos/range-hood.png",
  "washer-repair": "/appliance-photos/washer.png",
  "dryer-repair": "/appliance-photos/dryer.png",
  "microwave-repair": "/appliance-photos/microwave.png",
  "oven-repair": "/appliance-photos/oven.png",
};

const values = [
  {
    title: "Our Mission",
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    text: "We deliver fast, reliable, and expert appliance service that builds lasting trust and peace of mind\u2014done right the first time.",
  },
  {
    title: "Our Promise",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    text: "Honest service, skilled technicians, and lasting results. No hidden fees\u2014just quality repairs and genuine care for every home.",
  },
  {
    title: "Our Essence",
    icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    text: "A family business built on skill, integrity, and pride. We blend old-school craftsmanship with modern efficiency in every job.",
  },
  {
    title: "Our Culture",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    text: "Tech-savvy yet down-to-earth, we bring friendly, reliable service that makes every repair feel professional, personal, and local.",
  },
];

const serviceAreas: Record<string, string[]> = {
  "Central Ottawa": [
    "Downtown Ottawa",
    "Centretown",
    "ByWard Market",
    "Sandy Hill",
    "Lowertown",
    "Glebe",
    "Little Italy",
    "Hintonberg",
    "Wellington West",
  ],
  "South Ottawa": [
    "Barrhaven",
    "Merivale",
    "Hunt Club",
    "Riverside South",
    "Greenboro",
    "Findlay Creek",
    "South Keys",
    "Leitrim",
    "Manotick",
  ],
  "West Ottawa": [
    "Bells Corners",
    "Nepean",
    "Westboro",
    "Bayshore",
    "Kanata",
    "Queensway Terrace",
    "Stittsville",
    "Crystal Beach",
    "Britannia",
  ],
  "East Ottawa": [
    "Blackburn Hamlet",
    "Beacon Hill",
    "Orleans",
    "Vanier",
    "Cyrville",
    "Overbrook",
    "Gloucester",
    "Embrun",
  ],
};

const areaPageByName: Record<string, string> = Object.fromEntries(
  serviceAreaPages.map((area) => [area.name, area.slug]),
);

const testimonials = [
  {
    name: "Patrick R.",
    text: "I reached out to Adam because my dryer wasn't working. He arrived promptly and performed a fantastic repair. He was a very pleasant person to deal with, and I highly recommend his services.",
    rating: 5,
  },
  {
    name: "Chris B.",
    text: "Had an issue with our fridge not cooling properly and called superfix. They came out, found the problem pretty quickly and got it fixed. Fridge has been working great since. Really happy with the service.",
    rating: 5,
  },
  {
    name: "Sanjeev B.",
    text: "Adam did a great job fixing our stove. He was quick to respond, showed up on time and had the issue figured out pretty fast. Now our large burner works again! Would definitely recommend them.",
    rating: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#facc15">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function HomeSections() {
  return (
    <main>
      <section className="flex min-h-[calc(66vh-var(--site-header-h))] min-h-[calc(66svh-var(--site-header-h))] flex-col md:min-h-[calc(100vh-var(--site-header-h))] md:min-h-[calc(100svh-var(--site-header-h))]">
        <PageHero
          title="Ottawa Appliance Repair Experts"
          subtitle="Same-day home appliance repair by certified technicians. Fast, affordable, professional and insured."
          mode="video"
          showCta
          className="flex-1"
        />
        {/* Numbers banner intentionally replaced with brand carousel per latest design direction */}
        <BrandStrip variant="hero" />
      </section>

      <Section className="bg-[#fffdf5]">
        <div className="text-center">
          <Badge>We Fix Everything</Badge>
          <h2 className="mt-3 text-3xl font-extrabold text-[#3b2b0f] md:mt-4 md:text-5xl">Appliance Service</h2>
          <p className="mx-auto mt-3 hidden max-w-2xl text-sm leading-7 text-[#7e6b45] sm:block md:mt-4 md:text-base">
            Specialized repair services across kitchen and laundry appliances. Fast diagnostics,
            certified technicians, and clear upfront communication.
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-[#7e6b45] sm:hidden">
            Same-day diagnostics. Certified techs. Clear quote first.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2.5 sm:mt-10 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {servicePages.map((service) => (
            <Link
              key={service.slug}
              href={`/repair/${service.slug}`}
              className="surface group flex flex-col overflow-hidden border-[#f1dfab] transition-all duration-300 hover:-translate-y-1 hover:border-[#d9b557] hover:shadow-2xl"
            >
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-b from-[#fff8df] to-[#f8ecc4] p-2.5 sm:aspect-[4/3] sm:p-6">
                <Image
                  src={mediaByService[service.slug]}
                  alt={service.name}
                  width={900}
                  height={900}
                  sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 30vw"
                  className="h-full w-full object-contain drop-shadow-[0_10px_10px_rgba(59,43,15,0.18)] transition-transform duration-300 group-hover:scale-105 sm:drop-shadow-[0_18px_18px_rgba(59,43,15,0.18)]"
                />
              </div>
              <div className="flex flex-1 flex-col items-center justify-center px-1.5 py-2 text-center sm:items-start sm:space-y-3 sm:p-5 sm:text-left">
                <h3 className="text-[0.8rem] font-bold leading-tight text-[#3b2b0f] sm:text-xl">
                  {service.name.replace(/ Repair$/, "")}
                  <span className="hidden sm:inline"> Repair</span>
                </h3>
                <ul className="hidden space-y-1 text-xs text-[#7e6b45] sm:block">
                  <li>• Same-day diagnostics</li>
                  <li>• Certified appliance techs</li>
                  <li>• Clear quote before repair</li>
                </ul>
                <span className="hidden rounded-full border border-[#e8c96b] bg-[#fff8df] px-4 py-2 text-sm font-semibold text-[#5f4714] transition group-hover:border-[#5f4714] group-hover:bg-[#f4c542] group-hover:text-[#2f2512] sm:inline-flex">
                  Learn more
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="bg-gradient-to-br from-[#f8d36a] via-[#f4c542] to-[#e9b82f] py-9 text-[#2f2512] md:py-16">
        <div className="grid grid-cols-2 gap-2.5 md:gap-4 xl:grid-cols-4">
          {values.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#e0c06a] bg-[#fff6de] p-3.5 text-[#3b2b0f] md:p-6 shadow-[0_16px_30px_-20px_rgba(95,71,20,0.45)]"
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-2 h-6 w-6 opacity-85 md:mb-4 md:h-[30px] md:w-[30px]"
              >
                <path d={item.icon} />
              </svg>
              <h3 className="text-base font-extrabold md:text-2xl">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-snug text-[#7e6b45] md:mt-3 md:text-sm md:leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-[#fffef8]">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Badge>Coverage</Badge>
            <h2 className="mt-3 text-3xl font-extrabold text-[#3b2b0f] md:mt-4 md:text-5xl">Areas We Service</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#7e6b45] md:text-base">
              We provide reliable appliance repair across Ottawa with fast dispatch windows and
              flexible appointment times.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5 md:mt-8 md:gap-6">
              {Object.entries(serviceAreas).map(([region, cities]) => (
                <div key={region} className="rounded-2xl border border-[#eedca7] bg-[#fff9e8] p-3 md:p-4">
                  <h3 className="mb-1.5 text-sm font-bold text-[#5f4714] md:mb-2 md:text-lg">{region}</h3>
                  <ul className="space-y-1 md:space-y-1.5">
                    {cities.map((city) => (
                      <li key={city} className="flex items-start gap-1.5 text-xs text-[#7e6b45] md:gap-2 md:text-sm">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#d6a52d]" />
                        {areaPageByName[city] ? (
                          <Link
                            href={`/service-areas/${areaPageByName[city]}`}
                            className="font-semibold text-[#5f4714] underline hover:text-[#3b2b0f]"
                          >
                            {city}
                          </Link>
                        ) : (
                          city
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <Card className="overflow-hidden border-[#eedca7] p-0">
            <iframe
              title="SuperFixMech Service Area Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d719109.7820689518!2d-76.45964010968795!3d45.24733603797201!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x676a36eea2f1b8b3%3A0x6d15874565f8bace!2sSuper%20Fix%20Mechanical!5e0!3m2!1sen!2sca!4v1789079970161!5m2!1sen!2sca"
              className="h-[260px] w-full border-0 md:h-[480px]"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </Card>
        </div>
      </Section>

      <Section className="bg-[#fffdf5]">
        <div className="text-center">
          <Badge>Reviews</Badge>
          <h2 className="mt-3 text-3xl font-extrabold text-[#3b2b0f] md:mt-4 md:text-5xl">
            What Our Clients Are Saying
          </h2>
        </div>
        <div className="-mx-[4vw] mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[4vw] pb-2 md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {testimonials.map((t) => (
            <Card key={t.name} className="flex w-[82%] shrink-0 snap-center flex-col gap-3 border-[#f1dfab] md:w-auto md:shrink md:gap-4">
              <StarRating count={t.rating} />
              <p className="flex-1 text-sm leading-relaxed text-[#7e6b45]">&ldquo;{t.text}&rdquo;</p>
              <div className="pt-2">
                <p className="text-sm font-bold text-[#5f4714]">{t.name}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-[#9a8457]">Verified Customer</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-[#f4c542] py-9 text-[#2f2512] md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold md:text-5xl">A Family Owned Business</h2>
          <p className="mt-3 text-sm md:mt-4 md:text-base leading-relaxed text-[#5f4714]">
            We treat you like family ensuring quality work, professional service, affordable prices &amp; honesty. We are not satisfied until you are! High ethics and morals ensure a great experience for you and your family. We look forward to working with you and hope to service your appliance needs for years to come.
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex rounded-full border border-[#e0c06a] bg-[#fff8df] px-6 py-3 md:mt-6 text-sm font-semibold transition hover:bg-[#e9b82f] hover:text-[#2f2512]"
          >
            Learn more about us
          </Link>
        </div>
      </Section>

      <CtaBand />
    </main>
  );
}
