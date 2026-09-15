"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

type FaqItem = string | { question: string; answer: string };

type FaqListProps = {
  title?: string;
  items: FaqItem[];
};

const getDiyAnswer = (question: string) =>
  `For "${question.replace(/\?$/, "")}", start with safe basics: check power and settings, inspect visible filters or vents, and reset the appliance if your model supports it. If the issue continues or involves electrical, gas, or water leakage risks, book professional service to avoid further damage.`;

export function FaqList({ title = "DIY Fixes for Common Problems", items }: FaqListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const normalized = items.map((item) =>
    typeof item === "string" ? { question: item, answer: getDiyAnswer(item) } : item,
  );

  return (
    <Section className="py-12 md:py-16">
      <h2 className="mb-7 text-center text-3xl font-extrabold text-[#3b2b0f] md:text-4xl">
        {title}
      </h2>
      <Card className="p-0">
        {normalized.map((item, index) => (
          <div key={item.question} className="border-b border-[#f1dfab] last:border-0">
            <button
              type="button"
              onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-expanded={openIndex === index}
            >
              <p className="text-sm font-semibold text-[#5f4714]">
                {index + 1}. {item.question}
              </p>
              <span className="text-xl leading-none text-[#7a5d1f]">
                {openIndex === index ? "-" : "+"}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4">
                <p className="text-sm leading-7 text-[#7e6b45]">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </Card>
    </Section>
  );
}
