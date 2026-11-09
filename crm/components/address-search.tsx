"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { placeId: string; main: string; secondary: string };
type Parts = { street: string; unit: string; city: string; province: string; postal_code: string };

const newSession = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2));

/**
 * Google address search. Picking a suggestion fills the street, unit, city, province and
 * postal code inputs (by name) in the same form, so it drops into any address form.
 */
export function AddressSearch({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const [filled, setFilled] = useState("");
  const session = useRef(newSession());

  useEffect(() => {
    if (q.trim().length < 3) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}&session=${session.current}`, { signal: ctrl.signal });
        const j = (await res.json()) as { suggestions?: Suggestion[]; error?: string };
        if (j.error) throw new Error(j.error);
        setItems(j.suggestions ?? []);
        setActive(0);
        setOpen(true);
        setError("");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  async function pick(s: Suggestion) {
    setOpen(false);
    setQ(`${s.main}${s.secondary ? `, ${s.secondary}` : ""}`);
    try {
      const res = await fetch(`/api/places/details?id=${encodeURIComponent(s.placeId)}&session=${session.current}`);
      const j = (await res.json()) as { address?: Parts; error?: string };
      if (!j.address) throw new Error(j.error ?? "No address found");
      const form = ref.current?.form;
      const set = (name: keyof Parts, value: string) => {
        const el = form?.elements.namedItem(name);
        if (el instanceof HTMLInputElement && value) {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      };
      (["street", "unit", "city", "province", "postal_code"] as const).forEach((k) => set(k, j.address![k]));
      setFilled("Address filled in below. Add a unit number if there is one.");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      session.current = newSession(); // one Google billing session per address picked
    }
  }

  return (
    <div className={`relative ${className}`}>
      <span className="label">Search address</span>
      <input
        ref={ref}
        className="input"
        value={q}
        placeholder="Start typing an address…"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="address-suggestions"
        aria-autocomplete="list"
        onChange={(e) => {
          setQ(e.target.value);
          setFilled("");
          if (e.target.value.trim().length < 3) {
            setItems([]);
            setOpen(false);
          }
        }}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault(); // don't submit the form while choosing
            pick(items[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && items.length > 0 && (
        <ul id="address-suggestions" role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
          {items.map((s, i) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-amber-50" : ""}`}
            >
              <div className="font-medium text-stone-900">{s.main}</div>
              {s.secondary && <div className="text-xs text-stone-500">{s.secondary}</div>}
            </li>
          ))}
          <li className="px-3 py-1 text-right text-[10px] text-stone-400">Powered by Google</li>
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-rose-700">{error}</p>}
      {filled && <p className="mt-1 text-xs text-emerald-700">{filled}</p>}
    </div>
  );
}
