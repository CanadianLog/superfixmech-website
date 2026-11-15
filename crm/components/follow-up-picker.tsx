"use client";

import { useRef } from "react";

/** Date box plus one-tap buttons (Tomorrow, Next week…) for the next call. */
export function FollowUpPicker({ min, options }: { min: string; options: { label: string; date: string }[] }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={ref} type="date" name="follow_up_on" className="input w-auto" min={min} aria-label="Call again on" />
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
          onClick={() => {
            if (ref.current) ref.current.value = o.date;
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
