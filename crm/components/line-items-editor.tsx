"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { centsToInput, computeTotals, lineTotal, money, taxLabel, TAX_OPTIONS, toCents } from "@/lib/format";
import type { LineItemInput, PricebookItem } from "@/lib/types";

type Row = LineItemInput & { key: number; priceText: string; costText: string };

let seq = 0;
const toRow = (i: LineItemInput): Row => ({
  ...i,
  cost_cents: i.cost_cents ?? 0,
  key: ++seq,
  priceText: centsToInput(i.unit_price_cents),
  costText: i.cost_cents ? centsToInput(i.cost_cents) : "",
});

/**
 * Editable list of services, materials and discounts with live totals.
 * Serialises to a hidden `items` input, so it works inside any server-action form.
 */
export function LineItemsEditor({
  initial,
  pricebook,
  taxRate: initialRate,
  appliance = "",
  readOnly = false,
  suppliers = [],
}: {
  initial: LineItemInput[];
  pricebook: PricebookItem[];
  taxRate: number;
  /** Appliance on the job; its parts are listed first in the catalogue picker. */
  appliance?: string;
  readOnly?: boolean;
  /** Supplier names to suggest in "Bought from". */
  suppliers?: string[];
}) {
  const [rows, setRows] = useState<Row[]>(() => initial.map(toRow));
  // After a save, the browser resets the form, which can leave dropdowns and tick boxes showing their
  // defaults instead of what's saved. Redraw the editor from its state whenever that happens.
  const rootRef = useRef<HTMLDivElement>(null);
  const [redraw, setRedraw] = useState(0);
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const onReset = () => setTimeout(() => setRedraw((n) => n + 1), 0);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);
  const [pick, setPick] = useState("");
  const [taxRate, setTaxRate] = useState(initialRate);

  const totals = useMemo(() => computeTotals(rows, taxRate), [rows, taxRate]);
  const cost = useMemo(() => rows.reduce((s, r) => s + (r.kind === "discount" ? 0 : Math.round((r.cost_cents ?? 0) * r.quantity)), 0), [rows]);
  const profit = totals.subtotal - cost;
  const listId = useId();
  const supplierOptions = useMemo(() => {
    const all = [...suppliers, ...pricebook.map((p) => p.supplier ?? ""), ...rows.map((r) => r.supplier ?? "")].map((s) => s.trim()).filter(Boolean);
    return [...new Map(all.map((s) => [s.toLowerCase(), s])).values()];
  }, [suppliers, pricebook, rows]);
  const serialised = JSON.stringify(
    rows.map((r) => ({ kind: r.kind, name: r.name, description: r.description, quantity: r.quantity, unit_price_cents: r.unit_price_cents, taxable: r.taxable, cost_cents: r.cost_cents ?? 0, supplier: r.supplier ?? "" })),
  );

  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const add = (item?: Partial<LineItemInput>) =>
    setRows((rs) => [...rs, toRow({ kind: "service", name: "", description: "", quantity: 1, unit_price_cents: 0, taxable: true, ...item })]);
  const move = (idx: number, dir: -1 | 1) =>
    setRows((rs) => {
      const next = [...rs];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return rs;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const grouped = useMemo(() => {
    const m = new Map<string, PricebookItem[]>();
    for (const p of pricebook) {
      const k = `${p.appliance || "General"} — ${p.kind === "service" ? "Services" : "Parts"}`;
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    const match = appliance.trim().toLowerCase();
    return [...m.entries()].sort(([a], [b]) => {
      const am = match && a.toLowerCase().startsWith(match) ? 0 : 1;
      const bm = match && b.toLowerCase().startsWith(match) ? 0 : 1;
      return am - bm;
    });
  }, [pricebook, appliance]);

  return (
    <div ref={rootRef} key={redraw}>
      <input type="hidden" name="items" value={serialised} />
      <datalist id={listId}>
        {supplierOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {!readOnly && <input type="hidden" name="tax_rate" value={taxRate} />}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
              <th className="py-2 pr-2">Item</th>
              <th className="w-20 px-2 py-2">Qty</th>
              <th className="w-28 px-2 py-2">Price</th>
              <th className="w-28 px-2 py-2" title="What this costs you, per unit. Customers never see it.">
                Your cost <span aria-hidden>🔒</span>
              </th>
              <th className="w-14 px-2 py-2 text-center">Tax</th>
              <th className="w-28 px-2 py-2 text-right">Amount</th>
              {!readOnly && <th className="w-20" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-stone-400">
                  No line items yet.
                </td>
              </tr>
            )}
            {rows.map((r, idx) => (
              <tr key={r.key} className="border-t border-stone-100 align-top">
                <td className="py-2 pr-2">
                  {readOnly ? (
                    <div>
                      <div className="font-medium">{r.name}</div>
                      {r.description && <div className="whitespace-pre-line text-xs text-stone-500">{r.description}</div>}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        <select
                          aria-label="Type"
                          className="input w-28 shrink-0 px-2"
                          value={r.kind}
                          onChange={(e) => update(r.key, { kind: e.target.value as Row["kind"] })}
                        >
                          <option value="service">Service</option>
                          <option value="material">Material</option>
                          <option value="discount">Discount</option>
                        </select>
                        <input
                          aria-label="Item name"
                          className="input"
                          placeholder="Item name"
                          value={r.name}
                          onChange={(e) => update(r.key, { name: e.target.value })}
                        />
                      </div>
                      <input
                        aria-label="Description"
                        className="input text-xs"
                        placeholder="Description (optional)"
                        value={r.description}
                        onChange={(e) => update(r.key, { description: e.target.value })}
                      />
                    </div>
                  )}
                </td>
                <td className="px-2 py-2">
                  {readOnly ? (
                    r.quantity
                  ) : (
                    <input
                      aria-label="Quantity"
                      className="input px-2"
                      inputMode="decimal"
                      value={String(r.quantity)}
                      onChange={(e) => update(r.key, { quantity: parseFloat(e.target.value) || 0 })}
                    />
                  )}
                </td>
                <td className="px-2 py-2">
                  {readOnly ? (
                    money(r.unit_price_cents)
                  ) : (
                    <input
                      aria-label="Unit price"
                      className="input px-2"
                      inputMode="decimal"
                      value={r.priceText}
                      onChange={(e) => update(r.key, { priceText: e.target.value, unit_price_cents: toCents(e.target.value) })}
                      onBlur={() => update(r.key, { priceText: centsToInput(r.unit_price_cents) })}
                    />
                  )}
                </td>
                <td className="px-2 py-2">
                  {readOnly ? (
                    <span className="text-stone-500">{r.cost_cents ? money(r.cost_cents) : "—"}</span>
                  ) : (
                    <input
                      aria-label="Your cost per unit (not shown to customers)"
                      className="input bg-stone-50 px-2"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={r.costText}
                      onChange={(e) => update(r.key, { costText: e.target.value, cost_cents: toCents(e.target.value) })}
                      onBlur={() => update(r.key, { costText: r.cost_cents ? centsToInput(r.cost_cents) : "" })}
                    />
                  )}
                  {r.kind === "material" &&
                    (readOnly ? (
                      r.supplier && <div className="mt-1 truncate text-xs text-stone-500">from {r.supplier}</div>
                    ) : (
                      <input
                        aria-label="Bought from (not shown to customers)"
                        className="input mt-1 bg-stone-50 px-2 text-xs"
                        placeholder="Bought from"
                        list={listId}
                        value={r.supplier ?? ""}
                        onChange={(e) => update(r.key, { supplier: e.target.value })}
                      />
                    ))}
                </td>
                <td className="px-2 py-3 text-center">
                  <input
                    aria-label="Taxable"
                    type="checkbox"
                    className="h-4 w-4 accent-amber-500"
                    checked={r.taxable}
                    disabled={readOnly}
                    onChange={(e) => update(r.key, { taxable: e.target.checked })}
                  />
                </td>
                <td className="px-2 py-3 text-right font-medium tabular-nums">{money(lineTotal(r))}</td>
                {!readOnly && (
                  <td className="py-2 pl-1 text-right whitespace-nowrap">
                    <button type="button" className="px-1 text-stone-400 hover:text-stone-800" onClick={() => move(idx, -1)} aria-label="Move up">
                      ↑
                    </button>
                    <button type="button" className="px-1 text-stone-400 hover:text-stone-800" onClick={() => move(idx, 1)} aria-label="Move down">
                      ↓
                    </button>
                    <button
                      type="button"
                      className="px-1 text-stone-400 hover:text-rose-600"
                      onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={() => add()}>
            + Custom item
          </button>
          {pricebook.length > 0 && (
            <select
              aria-label="Add from price book"
              className="input w-auto max-w-xs py-1.5 text-xs"
              value={pick}
              onChange={(e) => {
                const p = pricebook.find((x) => String(x.id) === e.target.value);
                if (p) add({ kind: p.kind, name: p.name, description: p.description, unit_price_cents: p.unit_price_cents, taxable: !!p.taxable, cost_cents: p.cost_cents, supplier: p.supplier ?? "" });
                setPick("");
              }}
            >
              <option value="">+ Add from parts & services catalogue…</option>
              {grouped.map(([cat, items]) => (
                <optgroup key={cat} label={cat}>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {money(p.unit_price_cents)}{p.cost_cents ? ` (cost ${money(p.cost_cents)})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </div>
      )}

      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-stone-500">Subtotal</dt>
          <dd className="tabular-nums">{money(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-stone-500">
            {readOnly ? (
              taxLabel(taxRate)
            ) : (
              <select
                aria-label="Tax"
                className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-sm text-stone-800"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
              >
                {TAX_OPTIONS.map((t) => (
                  <option key={t.rate} value={t.rate}>
                    {t.label}
                  </option>
                ))}
                {!TAX_OPTIONS.some((t) => t.rate === taxRate) && <option value={taxRate}>{taxLabel(taxRate)}</option>}
              </select>
            )}
          </dt>
          <dd className="tabular-nums">{money(totals.tax)}</dd>
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-1 text-base font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{money(totals.total)}</dd>
        </div>
      </dl>

      {/* Internal only: never on anything the customer sees */}
      <div className="ml-auto mt-3 w-full max-w-xs rounded-lg bg-stone-100 px-3 py-2 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>Your cost</span>
          <span className="tabular-nums">{money(cost)}</span>
        </div>
        <div className={`flex justify-between font-semibold ${profit < 0 ? "text-rose-700" : "text-emerald-700"}`}>
          <span>Profit (before HST)</span>
          <span className="tabular-nums">
            {money(profit)}
            {totals.subtotal > 0 && <span className="ml-1 text-xs font-normal text-stone-500">({Math.round((profit / totals.subtotal) * 100)}%)</span>}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-stone-400">🔒 Only your team sees this.</div>
      </div>
    </div>
  );
}
