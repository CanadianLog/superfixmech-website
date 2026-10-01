export type ArticleSection = {
  heading: string;
  paragraphs?: string[];
  points?: string[];
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMinutes: number;
  related: { href: string; label: string };
  intro: string;
  sections: ArticleSection[];
};

export const articles: Article[] = [
  {
    slug: "fridge-not-cooling-what-to-check",
    title: "Fridge Not Cooling? 7 Things to Check Before You Call a Technician",
    description:
      "An Ottawa appliance technician's checklist for a warm fridge: thermostat settings, blocked vents, dirty coils, door seals, and the signs that mean it's time for a repair.",
    date: "2026-10-01",
    readMinutes: 6,
    related: { href: "/repair/fridge-repair", label: "Fridge Repair in Ottawa" },
    intro:
      "A fridge that stops cooling puts a whole week of groceries at risk, so it's natural to want a technician at the door right away. Before you book, though, a few quick checks can either solve the problem outright or help you describe it clearly, which makes the repair visit faster. Here's the same checklist our technicians run through when they arrive.",
    sections: [
      {
        heading: "1. Confirm the temperature settings",
        paragraphs: [
          "It sounds obvious, but controls get bumped all the time, especially on models with the dial inside the fresh-food section. The fridge should sit around 4°C (40°F) and the freezer around -18°C (0°F). If the setting was changed, give the fridge 24 hours to settle before judging it.",
        ],
      },
      {
        heading: "2. Make sure the vents aren't blocked",
        paragraphs: [
          "Most fridges push cold air from the freezer into the fresh-food section through a small vent. A box of food or a bag of frozen vegetables pressed against that vent can leave the freezer cold and the fridge warm. Move items away from the back wall and see whether airflow improves.",
        ],
      },
      {
        heading: "3. Clean the condenser coils",
        paragraphs: [
          "The condenser coils release heat from the fridge. When they're coated in dust and pet hair, the fridge has to run longer and may never reach temperature. Unplug the fridge, pull off the lower kick plate (or slide the fridge out to reach coils at the back), and vacuum them gently with a brush attachment.",
        ],
      },
      {
        heading: "4. Check the door gaskets",
        paragraphs: [
          "Close the door on a sheet of paper. If it slides out with no resistance, the seal isn't doing its job. Torn or flattened gaskets let warm, humid air in, which also causes frost build-up in the freezer. Gaskets are an inexpensive part and a common, quick repair.",
        ],
      },
      {
        heading: "5. Listen to the fans",
        paragraphs: [
          "Open the freezer and press the door switch. You should hear the evaporator fan running. Then listen near the back of the fridge for the condenser fan. A silent fan, or one that squeals or clicks, is a common reason a fridge runs but doesn't cool.",
        ],
      },
      {
        heading: "6. Look for frost on the freezer back panel",
        paragraphs: [
          "A thick layer of frost on the rear panel of the freezer usually points to a defrost system failure: a heater, thermostat, sensor, or control board. Manually defrosting (unplugging for a day with the doors open) may restore cooling temporarily, but the problem will return until the faulty part is replaced.",
        ],
      },
      {
        heading: "7. Give it room to breathe",
        paragraphs: [
          "Fridges squeezed into tight cabinets, or placed in a hot garage, struggle to shed heat. Leave a few centimetres of clearance at the top and back where the manufacturer calls for it.",
        ],
      },
      {
        heading: "When to call a professional",
        points: [
          "The compressor clicks on and off but the fridge never gets cold.",
          "You've cleaned the coils and the fridge is still warm after 24 hours.",
          "There's heavy frost on the freezer back panel.",
          "A fan is silent or noisy.",
          "You smell a burning or chemical odour, or hear loud buzzing.",
        ],
        paragraphs: [
          "Sealed-system work (refrigerant, compressor, evaporator) requires certified tools and training. If any of the signs above apply, book a diagnostic so a technician can pinpoint the failed part before your food spoils.",
        ],
      },
    ],
  },
  {
    slug: "dryer-taking-too-long-to-dry",
    title: "Why Is My Dryer Taking So Long? Lint, Venting, and Ottawa Winters",
    description:
      "Long dry times waste energy and can be a fire hazard. Learn the most common causes, from clogged vents to failed heating elements, and what you can safely fix yourself.",
    date: "2026-10-01",
    readMinutes: 5,
    related: { href: "/repair/dryer-repair", label: "Dryer Repair in Ottawa" },
    intro:
      "If a normal load now takes two or three cycles to dry, your dryer is telling you something. In most Ottawa homes we visit, the cause is airflow rather than a broken part, and that's good news, because airflow problems are often the cheapest to fix. They're also the most important to deal with, because restricted airflow is a leading cause of dryer fires.",
    sections: [
      {
        heading: "Start with the lint trap",
        paragraphs: [
          "Clean the lint screen before every load. Once a month, wash it with warm soapy water: dryer sheets leave a waxy film that blocks airflow even when the screen looks clean. Hold it under the tap; if water pools on top instead of flowing through, it needs a scrub.",
        ],
      },
      {
        heading: "Check the vent hose and outside hood",
        paragraphs: [
          "Pull the dryer out and look at the vent hose. Crushed or kinked foil ducting dramatically reduces airflow. Rigid or semi-rigid metal duct is the safer choice. Then go outside and run the dryer: you should feel a strong stream of warm air at the exterior hood.",
          "In Ottawa winters, the exterior flap can freeze shut or get buried under snow banks. Keep the hood clear after every storm, and check that bird or wasp nests haven't blocked it in the summer.",
        ],
      },
      {
        heading: "Don't overload it",
        paragraphs: [
          "Clothes need room to tumble. An overstuffed drum dries slowly and unevenly. Also make sure the washer's spin cycle is working properly: if clothes come out of the washer dripping, the dryer is being asked to do the washer's job.",
        ],
      },
      {
        heading: "Signs of a failed part",
        points: [
          "The drum turns but there's no heat at all: often a heating element, thermal fuse, or (on gas dryers) an igniter or gas valve coil.",
          "The dryer stops partway through a cycle: frequently a thermal fuse or an overheating issue caused by blocked venting.",
          "Squealing, thumping, or grinding: worn drum rollers, idler pulley, or belt.",
          "The dryer won't start at all: door switch, start switch, or a blown thermal fuse.",
        ],
      },
      {
        heading: "A note on thermal fuses",
        paragraphs: [
          "A thermal fuse is a safety device that blows when the dryer overheats. Replacing it without fixing the blocked vent that caused it means the new one will blow too, or worse. If your thermal fuse has failed, have the venting inspected at the same time.",
        ],
      },
      {
        heading: "When to book a repair",
        paragraphs: [
          "If you've cleaned the lint screen, confirmed strong airflow outside, and the dryer still runs cool or takes multiple cycles, it's time for a diagnosis. Gas dryers in particular should only be serviced by a qualified technician.",
        ],
      },
    ],
  },
  {
    slug: "dishwasher-not-draining",
    title: "Dishwasher Not Draining? Common Causes and Simple Fixes",
    description:
      "Standing water at the bottom of your dishwasher is usually caused by a clogged filter, a blocked garbage disposal connection, or a kinked drain hose. Here's how to check each one.",
    date: "2026-10-01",
    readMinutes: 5,
    related: { href: "/repair/dishwasher-repair", label: "Dishwasher Repair in Ottawa" },
    intro:
      "Opening the dishwasher to find a pool of murky water is one of the most common calls we get. The good news: a lot of drainage problems come down to a clog you can clear yourself in a few minutes. Always turn off power to the dishwasher at the breaker before reaching into the tub.",
    sections: [
      {
        heading: "Clean the filter",
        paragraphs: [
          "Most modern dishwashers have a removable filter at the bottom of the tub, under the lower spray arm. Twist it out, rinse it under hot water, and scrub away grease and food with a soft brush. Many manufacturers recommend doing this monthly, and few people ever do.",
        ],
      },
      {
        heading: "Check the garbage disposal connection",
        paragraphs: [
          "If your dishwasher drains into a garbage disposal, run the disposal for a few seconds before starting the dishwasher. On a newly installed disposal, the knockout plug inside the dishwasher inlet may never have been removed, which will stop the dishwasher from draining entirely.",
        ],
      },
      {
        heading: "Inspect the drain hose",
        paragraphs: [
          "Look under the sink for a kinked, crushed, or clogged drain hose. The hose should also have a high loop (or connect to an air gap) so dirty sink water can't flow back into the dishwasher.",
        ],
      },
      {
        heading: "Signs it's the pump or control",
        points: [
          "You hear a humming sound during the drain portion of the cycle but no water moves.",
          "The dishwasher displays a drain-related error code.",
          "The filter and hose are clear but water still sits in the tub.",
          "Water drains slowly and you hear grinding or rattling.",
        ],
        paragraphs: [
          "These usually point to a failed drain pump, a blocked pump impeller, or a check valve problem. These parts are replaceable and a repair is typically far cheaper than a new dishwasher.",
        ],
      },
      {
        heading: "Prevent it from happening again",
        points: [
          "Scrape plates well; you don't need to pre-rinse, but large food scraps clog filters.",
          "Clean the filter monthly.",
          "Run hot water at the sink before starting a cycle so the dishwasher fills with hot water.",
          "Use the right amount of detergent; too much can leave residue that traps debris.",
        ],
      },
    ],
  },
  {
    slug: "repair-or-replace-appliance",
    title: "Repair or Replace? How to Decide When an Appliance Breaks",
    description:
      "Use the age of your appliance, the cost of the repair, and its overall condition to decide whether a repair or a replacement is the smarter choice.",
    date: "2026-10-01",
    readMinutes: 6,
    related: { href: "/repair", label: "Appliance Repair Services" },
    intro:
      "When an appliance fails, the first question is usually \"Is it worth fixing?\" There's no single right answer, but there is a straightforward way to think it through. Here's the framework our technicians use when homeowners ask us for an honest opinion.",
    sections: [
      {
        heading: "Rule of thumb: the 50% rule",
        paragraphs: [
          "If the repair costs less than half the price of a comparable new appliance, and the appliance is less than halfway through its expected life, repairing is usually the better value. As the appliance gets older or the repair gets more expensive, replacement starts to make more sense.",
        ],
      },
      {
        heading: "Typical appliance lifespans",
        points: [
          "Refrigerators: 10 to 15 years",
          "Washers and dryers: 10 to 13 years",
          "Dishwashers: 8 to 12 years",
          "Ovens and ranges: 13 to 15 years",
          "Microwaves: 8 to 10 years",
          "Range hoods: 10 to 15 years or more",
        ],
        paragraphs: [
          "These are averages. A well-maintained, higher-end appliance often outlasts them, while heavy use shortens them.",
        ],
      },
      {
        heading: "When repair usually wins",
        points: [
          "The appliance is relatively new or otherwise in good shape.",
          "The failure is a common wear part: a belt, pump, igniter, door gasket, fan motor, or switch.",
          "It's a built-in or premium model that would be expensive or difficult to replace.",
          "Replacing it would mean changing cabinetry, venting, or electrical work.",
        ],
      },
      {
        heading: "When replacement may be smarter",
        points: [
          "The appliance is near or past the end of its expected lifespan.",
          "A major sealed-system or main control board failure on an older unit.",
          "It has needed several repairs in the past couple of years.",
          "Rust, cracked tubs, or structural damage.",
          "You were already planning to upgrade for capacity or efficiency.",
        ],
      },
      {
        heading: "Don't forget the environmental cost",
        paragraphs: [
          "Repairing keeps a large appliance out of the landfill and avoids the energy cost of making and shipping a new one. For many households that's worth factoring in, especially when the repair is straightforward.",
        ],
      },
      {
        heading: "Get a diagnosis first",
        paragraphs: [
          "You can't make a good decision without knowing what actually failed. A proper diagnostic visit tells you the part, the cost, and the condition of the rest of the appliance, so you can decide with real numbers rather than guesses. If replacement does make more sense, we can also install your new appliance.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
