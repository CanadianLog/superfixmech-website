export type ServiceArea = {
  slug: string;
  name: string;
  locality: string;
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
    locality: "Kanata, Ottawa, ON",
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
    locality: "Orleans, Ottawa, ON",
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
  {
    slug: "nepean",
    name: "Nepean",
    locality: "Nepean, Ottawa, ON",
    metaDescription:
      "Appliance repair in Nepean: fridges, washers, dryers, dishwashers, ovens and more. Local technicians serving Centrepointe, Craig Henry, Qualicum, Meadowlands and all of Nepean. Call 613-366-7009.",
    intro:
      "SuperFix Mechanical repairs and installs household appliances across Nepean, from Centrepointe and Craig Henry to Qualicum, Meadowlands and Fisher Heights. Whether it's a fridge that's running warm, a dishwasher full of standing water or an oven that won't hold temperature, we'll book a technician to diagnose it and get it fixed.",
    neighbourhoods: [
      "Centrepointe",
      "Craig Henry",
      "Qualicum",
      "Meadowlands",
      "Crestview",
      "Fisher Heights",
      "Arlington Woods",
      "Leslie Park",
      "Lynwood Village",
      "Trend-Arlington",
    ],
    localNotes: [
      {
        heading: "Established homes, long-serving appliances",
        text: "Many Nepean homes have been lived in for decades, and we often find appliances that have given years of good service. Before recommending anything, we look at the age and overall condition of the unit so you can make an informed repair-or-replace decision.",
      },
      {
        heading: "Kitchen renovations and upgrades",
        text: "When Nepean homeowners update a kitchen, the new dishwasher, range hood or over-the-range microwave often needs different connections or venting than the old one. We handle the installation so everything fits, drains and vents properly.",
      },
      {
        heading: "Laundry rooms in basements",
        text: "Basement laundry is common in Nepean, which can mean long dryer vent runs and washers that drain up to a laundry tub or standpipe. Slow drying and draining problems often start there, so we check the whole setup, not just the machine.",
      },
    ],
    faq: [
      {
        question: "Do you service all of Nepean?",
        answer:
          "Yes. We cover Nepean neighbourhoods including Centrepointe, Craig Henry, Qualicum, Meadowlands, Crestview and Fisher Heights, as well as nearby Bells Corners and Merivale.",
      },
      {
        question: "Which appliance brands do you repair in Nepean?",
        answer:
          "We work on all major brands, including Samsung, LG, Whirlpool, GE, Frigidaire, KitchenAid, Maytag, Bosch, Electrolux and Kenmore.",
      },
      {
        question: "Is it worth repairing an older appliance?",
        answer:
          "Often, yes. Common failures like pumps, belts, igniters, fans and door gaskets are usually affordable to fix. Our guide on repairing versus replacing explains how to decide, and our technician will give you an honest recommendation.",
      },
    ],
  },
  {
    slug: "barrhaven",
    name: "Barrhaven",
    locality: "Barrhaven, Ottawa, ON",
    metaDescription:
      "Appliance repair in Barrhaven: fridges, washers, dryers, dishwashers, ovens and more. Local technicians serving Half Moon Bay, Stonebridge, Longfields, Chapman Mills and all of Barrhaven. Call 613-366-7009.",
    intro:
      "SuperFix Mechanical provides appliance repair and installation throughout Barrhaven, from Longfields and Davidson Heights to Half Moon Bay, Stonebridge and the newer streets in Barrhaven South. If an appliance has stopped working, tell us the brand and the problem and we'll book a visit.",
    neighbourhoods: [
      "Half Moon Bay",
      "Stonebridge",
      "Longfields",
      "Davidson Heights",
      "Chapman Mills",
      "Heart's Desire",
      "Old Barrhaven",
      "Barrhaven South",
      "Cedarhill",
      "Strandherd",
    ],
    localNotes: [
      {
        heading: "Newer homes, newer technology",
        text: "Much of Barrhaven was built in recent decades, so we see a lot of modern appliances: front-load washers, French-door fridges with ice and water dispensers, and ranges with electronic controls. These have more sensors and boards than older models, and accurate diagnosis matters more than guesswork.",
      },
      {
        heading: "Builder-grade appliances after warranty",
        text: "Appliances supplied with new homes often start to show wear soon after the manufacturer's warranty ends. Ice makers, drain pumps and door seals are common culprits, and they're generally well worth repairing.",
      },
      {
        heading: "Front-load washer care",
        text: "Front-load washers are popular in Barrhaven homes. Musty smells, error codes and draining problems are often linked to a clogged drain pump filter or a dirty door boot, which we can clean or replace and show you how to maintain.",
      },
    ],
    faq: [
      {
        question: "Do you service all of Barrhaven?",
        answer:
          "Yes. We cover Barrhaven from Longfields and Davidson Heights to Half Moon Bay, Stonebridge and Barrhaven South, as well as nearby Riverside South and Manotick.",
      },
      {
        question: "Can you fix ice makers and water dispensers?",
        answer:
          "Yes. Ice maker and dispenser problems are among the most common fridge repairs we do, from frozen fill tubes to failed valves and ice maker assemblies.",
      },
      {
        question: "How do I book a repair in Barrhaven?",
        answer:
          "Call 613-366-7009 or book online. Let us know the appliance, the brand and what it's doing, and we'll confirm a time that works for you.",
      },
    ],
  },
  {
    slug: "stittsville",
    name: "Stittsville",
    locality: "Stittsville, Ottawa, ON",
    metaDescription:
      "Appliance repair in Stittsville: fridges, washers, dryers, dishwashers, ovens and more. Local technicians serving Fairwinds, Jackson Trails, Westwood, Crossing Bridge and all of Stittsville. Call 613-366-7009.",
    intro:
      "SuperFix Mechanical repairs and installs appliances across Stittsville, from the village core around Stittsville Main Street to Fairwinds, Jackson Trails, Westwood and Crossing Bridge. Book a visit and we'll diagnose the problem and walk you through your options before any work starts.",
    neighbourhoods: [
      "Stittsville Main Street",
      "Fairwinds",
      "Jackson Trails",
      "Westwood",
      "Crossing Bridge",
      "Granite Ridge",
      "Poole Creek Village",
      "Fernbank",
      "Stittsville North",
      "Stittsville South",
    ],
    localNotes: [
      {
        heading: "A growing community",
        text: "Stittsville has grown quickly, so the appliances we see range from long-serving units in established homes to recent models in new subdivisions. We carry common parts for the brands we see most, which helps keep repeat visits to a minimum.",
      },
      {
        heading: "Second fridges and freezers",
        text: "Garage and basement fridges and chest freezers are common in Stittsville. Units in unheated garages can stop working properly in the cold, and a failed freezer can mean a lot of lost food. If yours is struggling, call before it fully fails.",
      },
      {
        heading: "Range hood and ventilation work",
        text: "Weak airflow, rattling fans and lights that won't come on are common range hood complaints. We repair existing hoods and install new ones, including checking that the ductwork suits the new unit.",
      },
    ],
    faq: [
      {
        question: "Do you service all of Stittsville?",
        answer:
          "Yes. We cover Stittsville from the Main Street area to Fairwinds, Jackson Trails, Westwood, Crossing Bridge and Fernbank, as well as nearby Kanata.",
      },
      {
        question: "Do you repair chest freezers and garage fridges?",
        answer:
          "Yes. We diagnose and repair standalone freezers and second fridges, including temperature, defrost and fan problems.",
      },
      {
        question: "How do I book a repair in Stittsville?",
        answer:
          "Call 613-366-7009 or book online. Let us know the appliance, the brand and what it's doing, and we'll confirm a time that works for you.",
      },
    ],
  },
  {
    slug: "embrun",
    name: "Embrun",
    locality: "Embrun, Russell Township, ON",
    metaDescription:
      "Appliance repair in Embrun: fridges, washers, dryers, dishwashers, ovens and more. Technicians serving Embrun, Russell and the surrounding area east of Ottawa. Call 613-366-7009.",
    intro:
      "SuperFix Mechanical serves Embrun and the surrounding area in Russell Township, east of Ottawa. You shouldn't have to wait longer for a repair because you live outside the city, so tell us what's wrong and we'll book a technician to come out, diagnose the problem and fix it.",
    neighbourhoods: [
      "Embrun village",
      "Russell",
      "Limoges",
      "Marionville",
      "Vars",
      "Rural Russell Township",
    ],
    localNotes: [
      {
        heading: "Out-of-town service, done right the first time",
        text: "Because Embrun is a drive from central Ottawa, we take extra care to gather details before the visit: the brand, model number and symptoms. That way the technician arrives prepared and can often complete the repair in one trip.",
      },
      {
        heading: "Hard-working laundry and kitchen appliances",
        text: "Family homes in Embrun put their washers, dryers and dishwashers through a lot. Drain pumps, belts, door seals and heating elements are the parts we replace most, and they're usually far cheaper to fix than replacing the whole appliance.",
      },
      {
        heading: "Installation too",
        text: "Bought a new appliance? We install washers, dryers, dishwashers, range hoods and over-the-range microwaves in Embrun and the surrounding area, and make sure everything is levelled, connected and vented properly.",
      },
    ],
    faq: [
      {
        question: "Do you really come out to Embrun?",
        answer:
          "Yes. We serve Embrun and nearby communities in Russell Township, including Russell and Limoges. Call or book online and we'll confirm availability for your address.",
      },
      {
        question: "Which appliance brands do you repair in Embrun?",
        answer:
          "We work on all major brands, including Samsung, LG, Whirlpool, GE, Frigidaire, KitchenAid, Maytag, Bosch, Electrolux and Kenmore.",
      },
      {
        question: "What should I have ready when I book?",
        answer:
          "The appliance brand, the model number (usually on a sticker inside the door or on the back) and a description of what it's doing. Photos of the model sticker and any error codes help us bring the right parts.",
      },
    ],
  },
];

export function getServiceArea(slug: string) {
  return serviceAreaPages.find((area) => area.slug === slug);
}
