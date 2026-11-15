import type { ExtraSection } from "@/components/sections/service-detail";
import { company } from "@/lib/site-data";

type RepairContent = {
  overview: string;
  bullets: string[];
  metaDescription: string;
  extraSections: ExtraSection[];
  faq: { question: string; answer: string }[];
};

const fee = `$${company.diagnosticFee} plus tax`;

/** The visit steps are the same for every appliance; only the model-tag tip changes. */
const visitSection = (appliance: string, modelTag: string): ExtraSection => ({
  heading: `How a ${appliance} repair visit works`,
  points: [
    `Book online or call ${company.phone}. We answer ${company.hours.label.toLowerCase()}, and same-day visits are available across Ottawa, subject to availability.`,
    `The diagnostic fee is ${fee}. The technician finds the fault and gives you a quote before any repair work begins.`,
    "You decide whether to go ahead. Completed repairs carry a 30-day warranty on parts and labour.",
    `Have the model number ready if you can. ${modelTag}`,
  ],
});

/** Per-service repair copy, shared by the repair index and each repair page. */
export const serviceContent: Record<string, RepairContent> = {
  "fridge-repair": {
    overview:
      "A fridge that stops cooling puts a week of groceries at risk, so we treat fridge calls as urgent. We repair top-freezer, bottom-freezer, side-by-side and French-door refrigerators in Ottawa homes, condos and rental units.",
    bullets: [
      "Fridge not cooling",
      "Water leaking",
      "Noisy compressor sounds",
      "Ice maker failures",
      "Door seal damage",
    ],
    metaDescription: `Fridge repair in Ottawa for Samsung, LG, Whirlpool, GE and Frigidaire. Not cooling, leaking, noisy or icing up. ${fee} diagnostic. Call ${company.phone}.`,
    extraSections: [
      {
        heading: "What usually causes fridge problems",
        points: [
          "Warm fridge, cold freezer: a failed evaporator fan or a defrost fault that lets frost block the airflow between the two compartments.",
          "Warm everywhere: dirty condenser coils, a failed condenser fan, a bad start relay, or a compressor that no longer runs.",
          "Water on the floor or under the crisper drawers: a frozen or clogged defrost drain, or a leaking water line to the ice maker.",
          "Ice maker not producing: a failed water inlet valve, a frozen fill tube, or the ice maker module itself.",
          "Frost or sweating around the door: a torn or flattened door gasket that no longer seals.",
        ],
      },
      visitSection(
        "fridge",
        "On most fridges the tag is on the inside wall of the fresh-food section, near the top.",
      ),
      {
        heading: "Fridge brands we repair",
        paragraphs: [
          "We repair Samsung, LG, Whirlpool, GE, Frigidaire, KitchenAid, Maytag, Kenmore, Bosch and Electrolux refrigerators, along with most other major brands sold in Canada.",
          "Want to check a few things yourself first? These guides cover the safe basics.",
        ],
        links: [
          { href: "/blog/fridge-not-cooling-what-to-check", label: "Fridge not cooling: what to check" },
          { href: "/blog/noisy-fridge-sounds-what-they-mean", label: "What noisy fridge sounds mean" },
          { href: "/blog/repair-or-replace-appliance", label: "Repair or replace?" },
        ],
      },
    ],
    faq: [
      {
        question: "My fridge stopped cooling. What should I do before the technician arrives?",
        answer:
          "Keep the doors closed as much as possible. A closed fridge holds a safe temperature for about four hours, and a full freezer for much longer. Check that the fridge has power and that the temperature dial was not bumped, then call us. Do not unplug it unless you see water near electrical parts or smell burning.",
      },
      {
        question: "Why is my fridge leaking water?",
        answer:
          "The most common cause is a blocked defrost drain: meltwater cannot reach the drain pan, so it runs into the fridge or onto the floor. A leaking ice maker water line or a cracked drain pan can also cause it. We clear the drain or replace the failed part.",
      },
      {
        question: "How much does a fridge repair cost in Ottawa?",
        answer: `The diagnostic fee is ${fee}. The repair price depends on which part failed, so the technician gives you a quote after finding the fault and before starting any work.`,
      },
    ],
  },
  "dishwasher-repair": {
    overview:
      "Standing water, gritty dishes or a dishwasher that will not start usually come down to a few parts we replace often. We repair built-in dishwashers in Ottawa kitchens, including units in condos and rental properties.",
    bullets: [
      "Dishwasher not draining",
      "Poor cleaning results",
      "Water not filling",
      "Door latch problems",
      "Unusual vibration",
    ],
    metaDescription: `Dishwasher repair in Ottawa for Bosch, Whirlpool, KitchenAid, Samsung and LG. Not draining, not cleaning or leaking. ${fee} diagnostic. Call ${company.phone}.`,
    extraSections: [
      {
        heading: "What usually causes dishwasher problems",
        points: [
          "Water left in the bottom: a clogged filter, a kinked drain hose, a blocked connection at the sink drain, or a failed drain pump.",
          "Dishes still dirty: blocked spray arms, a worn circulation pump, or water that is not getting hot enough.",
          "Not filling: a failed water inlet valve or a stuck float switch.",
          "Will not start: a broken door latch or a failed control board.",
          "Leaking at the door: a worn door gasket, or too much suds from the wrong detergent.",
        ],
      },
      visitSection(
        "dishwasher",
        "The tag is usually on the inside edge of the door or on the side of the tub.",
      ),
      {
        heading: "Dishwasher brands we repair",
        paragraphs: [
          "We repair Bosch, Whirlpool, KitchenAid, Maytag, Samsung, LG, GE, Frigidaire, Kenmore and Electrolux dishwashers, along with most other major brands.",
          "If the dishwasher is past repairing, we also install the replacement.",
        ],
        links: [
          { href: "/blog/dishwasher-not-draining", label: "Dishwasher not draining" },
          { href: "/blog/dishwasher-not-cleaning-dishes", label: "Dishwasher not cleaning dishes" },
          { href: "/installation/dishwasher-installation", label: "Dishwasher installation in Ottawa" },
        ],
      },
    ],
    faq: [
      {
        question: "Why is there water pooling at the bottom of my dishwasher?",
        answer:
          "A small amount of water under the filter is normal. Water covering the bottom of the tub means it is not draining. Clean the filter first and check that the drain hose under the sink is not kinked. If water still sits there, the drain pump or the drain connection needs attention.",
      },
      {
        question: "Why does my dishwasher stop mid-cycle?",
        answer:
          "Common causes are a door latch that loses contact, a heating fault that makes the machine wait for a temperature it never reaches, or a failing control board. Note where in the cycle it stops and any lights or codes it shows. That helps the technician find the fault faster.",
      },
      {
        question: "How much does a dishwasher repair cost in Ottawa?",
        answer: `The diagnostic fee is ${fee}. The technician finds the fault and gives you a quote before any repair work begins.`,
      },
    ],
  },
  "cooktop-repair": {
    overview:
      "A dead burner or an element that only runs on high takes half your stove out of service. We repair coil, smooth-top (radiant), induction and gas cooktops in Ottawa homes.",
    bullets: [
      "Heating element failure",
      "Ignition problems",
      "Inconsistent heat levels",
      "Knob or switch failure",
      "Surface indicator issues",
    ],
    metaDescription: `Cooktop repair in Ottawa: coil, smooth-top, induction and gas. Dead burners, elements stuck on high, ignition faults. ${fee} diagnostic. Call ${company.phone}.`,
    extraSections: [
      {
        heading: "What usually causes cooktop problems",
        points: [
          "One burner dead: a burned-out surface element, a loose or scorched connection, or a failed switch behind the knob.",
          "Element stuck on high: a failed infinite switch that no longer cycles the element on and off.",
          "Gas burner clicks but will not light: a dirty or wet igniter, a blocked burner port, or a failed spark module.",
          "Induction zone will not heat: cookware that is not induction-compatible, or a fault in the zone's power board.",
          "Hot-surface light stays on: a failed limiter inside the element.",
        ],
      },
      visitSection(
        "cooktop",
        "On a range the tag is usually on the frame behind the oven door or the storage drawer. On a built-in cooktop it is on the underside.",
      ),
      {
        heading: "Cooktop brands we repair",
        paragraphs: [
          "We repair GE, Whirlpool, Frigidaire, Samsung, LG, KitchenAid, Bosch, Maytag, Kenmore and JennAir cooktops and ranges, along with most other major brands.",
          "A cracked glass cooktop should not be used. Switch it off at the breaker and book a visit.",
        ],
        links: [
          { href: "/repair/oven-repair", label: "Oven repair in Ottawa" },
          { href: "/blog/oven-not-heating-properly", label: "Oven not heating properly" },
          { href: "/blog/repair-or-replace-appliance", label: "Repair or replace?" },
        ],
      },
    ],
    faq: [
      {
        question: "Why is one burner not heating?",
        answer:
          "On an electric cooktop it is usually the element itself, the wiring to it, or the switch behind the knob. On a coil stove you can swap the dead coil with a working one of the same size. If the dead spot stays in the same place, the fault is in the socket or the switch, not the coil.",
      },
      {
        question: "Why does my gas burner keep clicking?",
        answer:
          "Clicking that never stops usually means moisture or food residue around the igniter, often after a spill or cleaning. Let it dry fully. If it keeps clicking once dry, or the burner will not light at all, the igniter or spark module needs replacing. If you smell gas, turn the burner off, leave the area and call your gas utility first.",
      },
      {
        question: "How much does a cooktop repair cost in Ottawa?",
        answer: `The diagnostic fee is ${fee}. The technician finds the fault and gives you a quote before any repair work begins.`,
      },
    ],
  },
  "range-hood-repair": {
    overview:
      "A range hood that hums without pulling air, rattles, or has dead lights is usually a quick fix. We repair under-cabinet, wall-mount and island range hoods, and the fan in over-the-range microwaves.",
    bullets: [
      "Weak airflow",
      "Excessive fan noise",
      "Non-working lights",
      "Control panel faults",
      "Odor retention",
    ],
    metaDescription: `Range hood and hood fan repair in Ottawa for Broan, NuTone, Venmar, Bosch and more. Weak airflow, noisy fans, dead lights. ${fee} diagnostic. Call ${company.phone}.`,
    extraSections: [
      {
        heading: "What usually causes range hood problems",
        points: [
          "Weak airflow: grease-clogged filters, a stuck damper flap in the duct, or a fan motor that has slowed with age.",
          "Rattling or grinding: a loose or unbalanced fan wheel, or worn motor bearings.",
          "Fan dead but lights work: a failed fan motor, speed switch or control board.",
          "Lights dead but fan works: burned-out bulbs, a failed light socket or a failed light switch.",
          "Cooking smells linger: a recirculating hood with a charcoal filter that is overdue for replacement.",
        ],
      },
      visitSection(
        "range hood",
        "Remove the grease filter and look inside the hood body for the tag.",
      ),
      {
        heading: "Range hood brands we repair",
        paragraphs: [
          "We repair Broan, NuTone, Venmar, Best, Bosch, KitchenAid, GE, Whirlpool, Samsung and LG range hoods, along with most other major brands.",
          "If the hood is not worth repairing, we remove it and install the new one.",
        ],
        links: [
          { href: "/installation/range-hood-installation", label: "Range hood installation in Ottawa" },
          { href: "/installation/otr-microwave-installation", label: "OTR microwave installation" },
          { href: "/blog/repair-or-replace-appliance", label: "Repair or replace?" },
        ],
      },
    ],
    faq: [
      {
        question: "Why is my hood fan running but not pulling air?",
        answer:
          "Start with the grease filters. Wash metal mesh filters in hot soapy water and let them dry. If airflow is still weak, the damper flap in the duct may be stuck shut or the motor may be failing. Both are repairs we handle on site.",
      },
      {
        question: "Why does my range hood rattle or vibrate?",
        answer:
          "A fan wheel that has worked loose on its shaft, a build-up of grease that throws the wheel off balance, or worn motor bearings. A loose filter or duct connection can also buzz at certain speeds.",
      },
      {
        question: "How much does a range hood repair cost in Ottawa?",
        answer: `The diagnostic fee is ${fee}. The technician finds the fault and gives you a quote before any repair work begins.`,
      },
    ],
  },
  "washer-repair": {
    overview:
      "A washer full of water that will not drain or spin leaves you with a soaked load and no laundry. We repair front-load and top-load washing machines in Ottawa homes, condos and rental units, including stacked laundry pairs.",
    bullets: [
      "Drum not spinning",
      "Water not draining",
      "Excessive vibration",
      "Cycle stops unexpectedly",
      "Door lock faults",
    ],
    metaDescription: `Washing machine repair in Ottawa for Samsung, LG, Whirlpool and Maytag. Not draining, not spinning or leaking. ${fee} diagnostic. Call ${company.phone}.`,
    extraSections: [
      {
        heading: "What usually causes washer problems",
        points: [
          "Will not drain: a sock or coin in the drain pump, a clogged pump filter, a kinked drain hose, or a failed pump.",
          "Will not spin: a worn drive belt, a failed lid switch or door lock, or a motor or motor-control fault.",
          "Shakes and walks: an unbalanced load, feet that are not level, or worn suspension rods or shock absorbers.",
          "Leaks: a torn door boot on a front-loader, loose fill hoses, or a leaking pump.",
          "Stops mid-cycle: a door lock that drops out, a water-level sensor fault, or a control board fault.",
        ],
      },
      visitSection(
        "washer",
        "On a front-loader the tag is inside the door opening. On a top-loader it is under the lid or on the back panel.",
      ),
      {
        heading: "Washer brands we repair",
        paragraphs: [
          "We repair Samsung, LG, Whirlpool, Maytag, GE, Frigidaire, Kenmore, Electrolux, Bosch and Inglis washers, along with most other major brands.",
          "Buying a new washer? We install it, level it and run a test cycle before we leave.",
        ],
        links: [
          { href: "/blog/washer-not-draining-or-spinning", label: "Washer not draining or spinning" },
          { href: "/installation/washer-installation", label: "Washer installation in Ottawa" },
          { href: "/repair/dryer-repair", label: "Dryer repair in Ottawa" },
        ],
      },
    ],
    faq: [
      {
        question: "My washer is full of water and will not drain. What can I do?",
        answer:
          "Unplug it first. Many front-loaders have a small access door at the bottom front with a drain filter behind it. Put towels and a shallow pan down, open it slowly and clear anything caught inside. If the filter is clean and the washer still will not drain, the pump has likely failed.",
      },
      {
        question: "Why does my washer shake so loudly on spin?",
        answer:
          "Try a smaller, evenly spread load and check that all four feet sit firmly on the floor. If it still bangs, the suspension rods or shock absorbers that hold the tub are worn and need replacing.",
      },
      {
        question: "How much does a washer repair cost in Ottawa?",
        answer: `The diagnostic fee is ${fee}. The technician finds the fault and gives you a quote before any repair work begins.`,
      },
    ],
  },
  "dryer-repair": {
    overview:
      "A dryer that runs for two cycles and still leaves clothes damp is wasting power and may be a fire risk. We repair electric and gas dryers in Ottawa homes, condos and rental units, including stacked laundry pairs.",
    bullets: [
      "No heat",
      "Long drying times",
      "Not starting",
      "Loud noise",
      "Burning odor concerns",
    ],
    metaDescription: `Dryer repair in Ottawa for Samsung, LG, Whirlpool, Maytag and GE. No heat, long dry times, not starting, squealing. ${fee} diagnostic. Call ${company.phone}.`,
    extraSections: [
      {
        heading: "What usually causes dryer problems",
        points: [
          "Runs but no heat: a blown thermal fuse, a failed heating element, or a failed igniter on a gas dryer.",
          "Takes too long to dry: a blocked or crushed vent, a clogged lint screen, or a weak heating element.",
          "Will not start: a failed door switch, start switch, thermal fuse or drive motor.",
          "Squealing or thumping: worn drum rollers, a worn idler pulley, or a frayed belt.",
          "Burning smell: lint built up inside the cabinet or vent. Stop using the dryer until it is checked.",
        ],
      },
      visitSection(
        "dryer",
        "Open the door and look around the door opening for the tag.",
      ),
      {
        heading: "Dryer brands we repair",
        paragraphs: [
          "We repair Samsung, LG, Whirlpool, Maytag, GE, Frigidaire, Kenmore, Electrolux, Bosch and Inglis dryers, along with most other major brands.",
          "Ottawa winters are hard on dryer vents. An outside vent hood that is frozen shut or buried in snow causes the same long dry times as a failed part, so the vent is one of the first things we check when a dryer is slow.",
        ],
        links: [
          { href: "/blog/dryer-taking-too-long-to-dry", label: "Dryer taking too long to dry" },
          { href: "/installation/dryer-installation", label: "Dryer installation in Ottawa" },
          { href: "/repair/washer-repair", label: "Washer repair in Ottawa" },
        ],
      },
    ],
    faq: [
      {
        question: "Why is my dryer running but not heating?",
        answer:
          "On an electric dryer, check the breaker panel first. Dryers use two breakers, and if one trips the drum still turns with no heat. If the breakers are fine, the usual cause is a blown thermal fuse or a failed heating element. A thermal fuse often blows because the vent is blocked, so the vent needs checking too.",
      },
      {
        question: "Why is my dryer taking so long to dry?",
        answer:
          "Restricted airflow is the most common cause. Clean the lint screen, then check the vent hose behind the dryer and the vent hood outside for lint, kinks, ice or snow. If airflow is good and loads still take too long, a heating part is weak.",
      },
      {
        question: "How much does a dryer repair cost in Ottawa?",
        answer: `The diagnostic fee is ${fee}. The technician finds the fault and gives you a quote before any repair work begins.`,
      },
    ],
  },
  "microwave-repair": {
    overview:
      "A microwave that runs but leaves food cold, or one with a dead display, can often be repaired for less than a replacement, especially built-in and over-the-range models. We repair over-the-range, built-in and countertop microwaves in Ottawa.",
    bullets: [
      "Not heating",
      "Turntable not spinning",
      "Display/control errors",
      "Door latch failure",
      "Sparking concerns",
    ],
    metaDescription: `Microwave repair in Ottawa: over-the-range, built-in and countertop. Not heating, sparking, dead display or door faults. ${fee} diagnostic. Call ${company.phone}.`,
    extraSections: [
      {
        heading: "What usually causes microwave problems",
        points: [
          "Runs but does not heat: a failed magnetron, high-voltage diode or capacitor.",
          "Completely dead: a blown internal fuse, often caused by a worn door switch.",
          "Sparking inside: a burned waveguide cover, food residue on the walls, or chipped paint in the cavity.",
          "Turntable not turning: a failed turntable motor or a cracked drive coupler.",
          "Buttons do not respond: a worn touchpad or a failed control board.",
        ],
      },
      visitSection(
        "microwave",
        "Open the door and look on the frame or the inside left wall for the tag.",
      ),
      {
        heading: "Microwave brands we repair",
        paragraphs: [
          "We repair Panasonic, Samsung, LG, Whirlpool, GE, Frigidaire, KitchenAid, Maytag, Kenmore and Bosch microwaves, along with most other major brands.",
          "Please do not open a microwave cabinet yourself. The high-voltage capacitor can hold a dangerous charge even when the unit is unplugged.",
        ],
        links: [
          { href: "/blog/microwave-not-heating", label: "Microwave running but not heating" },
          { href: "/installation/otr-microwave-installation", label: "OTR microwave installation in Ottawa" },
          { href: "/blog/repair-or-replace-appliance", label: "Repair or replace?" },
        ],
      },
    ],
    faq: [
      {
        question: "Is it worth repairing a microwave?",
        answer:
          "For an over-the-range or built-in microwave, usually yes. Replacing one means matching the cabinet opening and mounting, which adds cost. For a small countertop model, a new unit often costs less than the repair, and we will tell you so.",
      },
      {
        question: "Why is my microwave sparking?",
        answer:
          "Stop using it. The usual cause is a burned waveguide cover, the small panel on the inside wall, or baked-on food that has carbonized. Metal trim on dishes can also arc. If the cover or the cavity wall is burned, it needs a technician.",
      },
      {
        question: "How much does a microwave repair cost in Ottawa?",
        answer: `The diagnostic fee is ${fee}. The technician finds the fault and gives you a quote before any repair work begins.`,
      },
    ],
  },
  "oven-repair": {
    overview:
      "An oven that will not heat, runs too hot or shuts off mid-bake usually has one failed part. We repair electric and gas ovens in Ottawa, including freestanding ranges, slide-in ranges and built-in wall ovens.",
    bullets: [
      "Not heating to target temp",
      "Uneven cooking",
      "Error code display",
      "Ignition failures",
      "Door not closing correctly",
    ],
    metaDescription: `Oven and stove repair in Ottawa for GE, Whirlpool, Frigidaire, Samsung and LG. Not heating, uneven baking, error codes. ${fee} diagnostic. Call ${company.phone}.`,
    extraSections: [
      {
        heading: "What usually causes oven problems",
        points: [
          "Electric oven will not heat: a burned-out bake or broil element, often with a visible blister or break.",
          "Gas oven will not heat: a weak igniter that glows but never opens the gas valve.",
          "Temperature is off or baking is uneven: a failed temperature sensor, a worn door gasket, or a convection fan that has stopped.",
          "Error code on the display: often a sensor or control board fault. Note the code before you reset it.",
          "Door will not close or unlock: bent hinges, or a door lock motor stuck after a self-clean cycle.",
        ],
      },
      visitSection(
        "oven",
        "Open the oven door or the bottom drawer and look on the frame for the tag.",
      ),
      {
        heading: "Oven brands we repair",
        paragraphs: [
          "We repair GE, Whirlpool, Frigidaire, Samsung, LG, KitchenAid, Maytag, Kenmore, Bosch and JennAir ovens and ranges, along with most other major brands.",
          "Searching for stove repair? In most Ottawa kitchens the stove is a range: an oven with a cooktop on top. We repair both halves.",
        ],
        links: [
          { href: "/blog/oven-not-heating-properly", label: "Oven not heating properly" },
          { href: "/repair/cooktop-repair", label: "Cooktop repair in Ottawa" },
          { href: "/blog/how-long-do-home-appliances-last", label: "How long do appliances last?" },
        ],
      },
    ],
    faq: [
      {
        question: "Why does my oven take so long to preheat?",
        answer:
          "On an electric oven, one of the two elements has usually failed, so the other is doing all the work. On a gas oven, a weak igniter is slow to open the gas valve. A failed temperature sensor can also make the oven think it is hotter or colder than it is.",
      },
      {
        question: "My oven door is locked after self-cleaning. What should I do?",
        answer:
          "Let the oven cool fully, which can take an hour or more, then switch the breaker off for five minutes and back on. If the door is still locked, the lock motor or its switch has failed. Do not force the door, because that bends the latch.",
      },
      {
        question: "How much does an oven repair cost in Ottawa?",
        answer: `The diagnostic fee is ${fee}. The technician finds the fault and gives you a quote before any repair work begins.`,
      },
    ],
  },
};
