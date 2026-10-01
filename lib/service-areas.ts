export type ServiceArea = {
  slug: string;
  name: string;
  metaDescription: string;
  intro: string;
  neighbourhoods: string[];
  localNotes: { heading: string; text: string }[];
  faq: { question: string; answer: string }[];
};

export const serviceAreaPages: ServiceArea[] = [
  {
    slug: "kanata",
    name: "Kanata",
    metaDescription:
      "Appliance repair in Kanata: fridges, washers, dryers, dishwashers, ovens and more. Local technicians serving Bridlewood, Kanata Lakes, Beaverbrook, Morgan's Grant and all of Kanata. Call 613-366-7009.",
    intro:
      "SuperFix Mechanical provides appliance repair and installation throughout Kanata, from the established streets of Beaverbrook and Katimavik to newer homes in Kanata Lakes, Bridlewood and the Kanata North area. Tell us what's wrong and we'll book a visit with a technician who knows the brands and models common in west-end Ottawa homes.",
    neighbourhoods: [
      "Kanata Lakes",
      "Bridlewood",
      "Beaverbrook",
      "Katimavik-Hazeldean",
      "Glen Cairn",
      "Morgan's Grant",
      "Kanata North",
      "Emerald Meadows",
      "Hazeldean",
      "Marchwood",
    ],
    localNotes: [
      {
        heading: "Older homes and newer builds",
        text: "Kanata has a wide mix of housing, from homes built decades ago to brand-new subdivisions. Older homes often have tighter laundry closets and longer dryer vent runs, which we check whenever a dryer is slow. In newer builds we see a lot of builder-grade appliances reaching the end of their warranty, and they're usually well worth repairing.",
      },
      {
        heading: "Winter is hard on laundry and fridges",
        text: "Exterior dryer vents can freeze or get buried in snow, and garage fridges and freezers struggle in cold temperatures. If your dryer or garage freezer acts up in January, those are the first things we look at.",
      },
      {
        heading: "Installation too",
        text: "Replacing an appliance? We install washers, dryers, dishwashers, range hoods, and over-the-range microwaves across Kanata, so your new unit is level, connected, and venting properly from day one.",
      },
    ],
    faq: [
      {
        question: "Do you service all of Kanata?",
        answer:
          "Yes. We cover Kanata North and South, including Kanata Lakes, Bridlewood, Beaverbrook, Glen Cairn, Morgan's Grant and surrounding streets, as well as nearby Stittsville.",
      },
      {
        question: "Which appliance brands do you repair in Kanata?",
        answer:
          "We work on all major brands, including Samsung, LG, Whirlpool, GE, Frigidaire, KitchenAid, Maytag, Bosch, Electrolux and Kenmore.",
      },
      {
        question: "How do I book a repair in Kanata?",
        answer:
          "Call 613-366-7009 or book online. Let us know the appliance, the brand and what it's doing, and we'll confirm a time that works for you.",
      },
    ],
  },
  {
    slug: "orleans",
    name: "Orleans",
    metaDescription:
      "Appliance repair in Orleans: fridges, washers, dryers, dishwashers, ovens and more. Local technicians serving Avalon, Chapel Hill, Convent Glen, Fallingbrook and all of Orleans. Call 613-366-7009.",
    intro:
      "SuperFix Mechanical provides appliance repair and installation across Orleans, from Convent Glen and Queenswood Heights to Avalon, Chapel Hill and the growing communities near Cardinal Creek. Whether it's a fridge that stopped cooling or a washer that won't drain, we'll book a visit and get it working again.",
    neighbourhoods: [
      "Avalon",
      "Chapel Hill",
      "Convent Glen",
      "Fallingbrook",
      "Queenswood Heights",
      "Cardinal Creek",
      "Notre-Dame-des-Champs",
      "Orléans Village",
      "Chatelaine Village",
      "Hiawatha Park",
    ],
    localNotes: [
      {
        heading: "Busy family households",
        text: "Many Orleans homes run their washer, dryer and dishwasher every day, so wear parts like drain pumps, belts, door gaskets and drum rollers come up often. These are typically quick, affordable repairs compared to buying new.",
      },
      {
        heading: "Winter is hard on laundry and fridges",
        text: "Exterior dryer vents can freeze or get buried in snow, and garage fridges and freezers struggle in cold temperatures. If your dryer or garage freezer acts up in the winter months, those are the first things we check.",
      },
      {
        heading: "Installation too",
        text: "Replacing an appliance? We install washers, dryers, dishwashers, range hoods, and over-the-range microwaves throughout Orleans, so your new unit is level, connected, and venting properly from day one.",
      },
    ],
    faq: [
      {
        question: "Do you service all of Orleans?",
        answer:
          "Yes. We cover Orleans from Convent Glen and Queenswood Heights to Avalon, Chapel Hill, Fallingbrook and Cardinal Creek, as well as nearby Gloucester and Blackburn Hamlet.",
      },
      {
        question: "Which appliance brands do you repair in Orleans?",
        answer:
          "We work on all major brands, including Samsung, LG, Whirlpool, GE, Frigidaire, KitchenAid, Maytag, Bosch, Electrolux and Kenmore.",
      },
      {
        question: "How do I book a repair in Orleans?",
        answer:
          "Call 613-366-7009 or book online. Let us know the appliance, the brand and what it's doing, and we'll confirm a time that works for you.",
      },
    ],
  },
];

export function getServiceArea(slug: string) {
  return serviceAreaPages.find((area) => area.slug === slug);
}
