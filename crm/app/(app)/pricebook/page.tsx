import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPricebook, listSuppliers } from "@/lib/data";
import { APPLIANCE_TYPES, centsToInput, money } from "@/lib/format";
import { deletePricebookItem, savePricebookItem, togglePricebookItem } from "@/lib/actions";
import { ConfirmButton } from "@/components/forms";
import { Card, Empty, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { ApplianceSelect } from "@/components/job-form";
import type { PricebookItem } from "@/lib/types";

export const metadata = { title: "Parts & services" };

function margin(i: PricebookItem) {
  if (!i.cost_cents || !i.unit_price_cents) return null;
  return { profit: i.unit_price_cents - i.cost_cents, pct: Math.round(((i.unit_price_cents - i.cost_cents) / i.unit_price_cents) * 100) };
}

export default async function PricebookPage({ searchParams }: { searchParams: Promise<{ edit?: string; appliance?: string; kind?: string; q?: string }> }) {
  await requireUser(["admin", "dispatcher"]);
  const { edit, appliance = "", kind = "", q = "" } = await searchParams;
  const all = listPricebook(true);
  const editing = all.find((i) => String(i.id) === edit);

  const counts = new Map<string, number>();
  for (const i of all) counts.set(i.appliance || "General", (counts.get(i.appliance || "General") ?? 0) + 1);
  const tabs = ["", "General", ...APPLIANCE_TYPES.filter((a) => counts.has(a)), ...[...counts.keys()].filter((a) => a !== "General" && !APPLIANCE_TYPES.includes(a))];

  const needle = q.trim().toLowerCase();
  const items = all.filter(
    (i) =>
      (!appliance || (i.appliance || "General") === appliance) &&
      (!kind || i.kind === kind) &&
      (!needle || `${i.name} ${i.category} ${i.description}`.toLowerCase().includes(needle)),
  );
  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ appliance, kind, q, ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return `/pricebook${s ? `?${s}` : ""}`;
  };

  // Group the visible items by appliance so each type gets its own section.
  const groups = new Map<string, PricebookItem[]>();
  for (const i of items) groups.set(i.appliance || "General", [...(groups.get(i.appliance || "General") ?? []), i]);

  return (
    <>
      <PageHeader title="Parts & services catalogue" subtitle="Your parts and services by appliance type, with what they cost you and what you charge." />

      <nav className="mb-3 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Link
            key={t || "all"}
            href={href({ appliance: t })}
            className={`rounded-full px-3 py-1 text-sm ring-1 ${appliance === t ? "bg-stone-900 text-white ring-stone-900" : "bg-white text-stone-700 ring-stone-300 hover:bg-stone-50"}`}
          >
            {t || "All"} <span className="opacity-60">{t ? counts.get(t) ?? 0 : all.length}</span>
          </Link>
        ))}
      </nav>
      <form className="mb-4 flex flex-wrap gap-2">
        {appliance && <input type="hidden" name="appliance" value={appliance} />}
        <select name="kind" defaultValue={kind} className="input w-auto">
          <option value="">Parts & services</option>
          <option value="material">Parts only</option>
          <option value="service">Services only</option>
        </select>
        <input className="input max-w-xs" name="q" defaultValue={q} placeholder="Search…" />
        <button className="btn-ghost">Filter</button>
      </form>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {items.length === 0 && (
            <Card>
              <Empty>No items here yet. Add your first one on the right.</Empty>
            </Card>
          )}
          {[...groups.entries()].map(([group, rows]) => (
            <Card key={group} title={group} pad={false}>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-right">Your cost</th>
                      <th className="text-right">Customer price</th>
                      <th className="hidden text-right md:table-cell">Profit</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((i) => {
                      const m = margin(i);
                      return (
                        <tr key={i.id} className={i.active ? "" : "opacity-50"}>
                          <td>
                            <div className="font-semibold">{i.name}</div>
                            <div className="text-xs text-stone-500">
                              {i.kind === "material" ? "Part" : "Service"}
                              {i.category ? ` · ${i.category}` : ""}
                              {i.taxable ? "" : " · not taxable"}
                              {i.supplier ? ` · from ${i.supplier}` : ""}
                              {i.active ? "" : " · hidden"}
                            </div>
                          </td>
                          <td className="text-right tabular-nums text-stone-600">{i.cost_cents ? money(i.cost_cents) : "—"}</td>
                          <td className="text-right font-semibold tabular-nums">{money(i.unit_price_cents)}</td>
                          <td className="hidden text-right tabular-nums md:table-cell">
                            {m ? (
                              <span className={m.profit < 0 ? "text-rose-700" : "text-emerald-700"}>
                                {money(m.profit)} <span className="text-xs text-stone-400">({m.pct}%)</span>
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="whitespace-nowrap text-right">
                            <Link href={href({ edit: String(i.id) })} className="text-xs text-stone-500 hover:text-stone-900">
                              Edit
                            </Link>
                            <form action={togglePricebookItem} className="ml-3 inline">
                              <input type="hidden" name="id" value={i.id} />
                              <button className="text-xs text-stone-500 hover:text-stone-900">{i.active ? "Hide" : "Show"}</button>
                            </form>
                            <form action={deletePricebookItem} className="ml-3 inline">
                              <input type="hidden" name="id" value={i.id} />
                              <ConfirmButton className="text-xs text-stone-400 hover:text-rose-700" message={`Delete “${i.name}” from your catalogue? Jobs and invoices that already use it are not changed.`}>
                                Delete
                              </ConfirmButton>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
        <Card title={editing ? "Edit item" : "Add part or service"} className="self-start">
          <ItemForm key={editing?.id ?? `new-${appliance}`} item={editing} appliance={appliance === "General" ? "" : appliance} suppliers={listSuppliers()} />
        </Card>
      </div>
    </>
  );
}

function ItemForm({ item, appliance, suppliers }: { item?: PricebookItem; appliance: string; suppliers: string[] }) {
  return (
    <form action={savePricebookItem} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      <label className="block">
        <span className="label">Appliance type</span>
        <ApplianceSelect defaultValue={item?.appliance ?? appliance} />
        <span className="mt-1 block text-xs text-stone-400">Leave blank for items that apply to everything (service call, labour).</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Type</span>
          <select className="input" name="kind" defaultValue={item?.kind ?? "material"}>
            <option value="material">Part</option>
            <option value="service">Service</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Category</span>
          <input className="input" name="category" defaultValue={item?.category} placeholder="e.g. Heating" />
        </label>
      </div>
      <label className="block">
        <span className="label">Name</span>
        <input className="input" name="name" defaultValue={item?.name} placeholder="e.g. Drain pump" required />
      </label>
      <label className="block">
        <span className="label">Description / part #</span>
        <textarea className="input" name="description" defaultValue={item?.description} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Your cost</span>
          <input className="input" name="cost" inputMode="decimal" placeholder="0.00" defaultValue={item ? centsToInput(item.cost_cents) : ""} />
        </label>
        <label className="block">
          <span className="label">Charge customer</span>
          <input className="input" name="price" inputMode="decimal" placeholder="0.00" defaultValue={item ? centsToInput(item.unit_price_cents) : ""} required />
        </label>
      </div>
      <label className="block">
        <span className="label">Usually bought from</span>
        <input className="input" name="supplier" list="catalogue-suppliers" defaultValue={item?.supplier} placeholder="e.g. Reliable Parts" />
        <datalist id="catalogue-suppliers">
          {suppliers.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <span className="mt-1 block text-xs text-stone-400">Only your team sees this. It fills in when you add this part to a job.</span>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="taxable" defaultChecked={item ? !!item.taxable : true} className="h-4 w-4 accent-amber-500" /> Taxable
      </label>
      <div className="flex justify-end gap-2">
        {item && (
          <Link href="/pricebook" className="btn-ghost">
            Cancel
          </Link>
        )}
        <SubmitButton>{item ? "Save" : "Add to catalogue"}</SubmitButton>
      </div>
    </form>
  );
}
