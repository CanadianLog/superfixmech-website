import type { Address, Customer, LineItemInput, Totals } from "./types";

export function money(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

/** Parses "12.50", "$1,200" etc. into cents. Returns 0 for blanks or junk. */
export function toCents(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  const n = typeof input === "number" ? input : parseFloat(String(input).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function lineTotal(item: Pick<LineItemInput, "kind" | "quantity" | "unit_price_cents">): number {
  const amount = Math.round(item.quantity * item.unit_price_cents);
  return item.kind === "discount" ? -Math.abs(amount) : amount;
}

export function computeTotals(
  items: Pick<LineItemInput, "kind" | "quantity" | "unit_price_cents" | "taxable">[],
  taxRatePercent: number,
): Totals {
  let subtotal = 0;
  let taxable = 0;
  for (const it of items) {
    const t = lineTotal(it);
    subtotal += t;
    if (it.taxable) taxable += t;
  }
  const tax = Math.max(0, Math.round((taxable * taxRatePercent) / 100));
  return { subtotal, tax, total: subtotal + tax };
}

export function customerName(c: Pick<Customer, "first_name" | "last_name" | "company">): string {
  const n = `${c.first_name} ${c.last_name}`.trim();
  return n || c.company || "Unnamed customer";
}

export function addressLine(a: Pick<Address, "street" | "unit" | "city" | "province" | "postal_code"> | null | undefined): string {
  if (!a) return "";
  const street = [a.unit && `${a.unit} -`, a.street].filter(Boolean).join(" ");
  return [street, a.city, [a.province, a.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

export function mapsUrl(a: Parameters<typeof addressLine>[0]): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine(a))}`;
}

/* ---------- dates ----------
 * Scheduled times are stored as local wall-clock strings ('YYYY-MM-DDTHH:mm') in the
 * business time zone, so they never shift when the server runs in UTC.
 */

export function todayIn(tz: string, d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function nowLocal(tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Adds days to a 'YYYY-MM-DD' date string. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekStart(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const dow = d.getUTCDay(); // 0 = Sunday
  return addDays(date, -dow);
}

export function fmtDate(date: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!date) return "";
  const d = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric", ...opts }).format(d);
}

export function fmtTime(local: string | null | undefined): string {
  if (!local || local.length < 16) return "";
  const [h, m] = local.slice(11, 16).split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function fmtSchedule(start: string | null, end: string | null): string {
  if (!start) return "Unscheduled";
  const day = fmtDate(start, { weekday: "short", year: undefined });
  return `${day}, ${fmtTime(start)}${end ? `–${fmtTime(end)}` : ""}`;
}

/** Formats a UTC ISO timestamp in the business time zone. */
export function fmtStamp(iso: string | null | undefined, tz: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function minutesOfDay(local: string): number {
  const [h, m] = local.slice(11, 16).split(":").map(Number);
  return h * 60 + m;
}

export const STATUS_LABEL: Record<string, string> = {
  unscheduled: "Unscheduled",
  scheduled: "Scheduled",
  dispatched: "On my way",
  in_progress: "In progress",
  completed: "Completed",
  canceled: "Canceled",
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  declined: "Declined",
  converted: "Converted to job",
  open: "Open",
  partial: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export const STATUS_TONE: Record<string, string> = {
  unscheduled: "bg-amber-100 text-amber-900 ring-amber-300",
  scheduled: "bg-sky-100 text-sky-900 ring-sky-300",
  dispatched: "bg-indigo-100 text-indigo-900 ring-indigo-300",
  in_progress: "bg-violet-100 text-violet-900 ring-violet-300",
  completed: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  canceled: "bg-zinc-100 text-zinc-600 ring-zinc-300",
  draft: "bg-zinc-100 text-zinc-700 ring-zinc-300",
  sent: "bg-sky-100 text-sky-900 ring-sky-300",
  approved: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  declined: "bg-rose-100 text-rose-900 ring-rose-300",
  converted: "bg-violet-100 text-violet-900 ring-violet-300",
  open: "bg-sky-100 text-sky-900 ring-sky-300",
  partial: "bg-amber-100 text-amber-900 ring-amber-300",
  paid: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  overdue: "bg-rose-100 text-rose-900 ring-rose-300",
  void: "bg-zinc-100 text-zinc-600 ring-zinc-300",
};

export const PAYMENT_METHODS = ["card", "cash", "cheque", "e-transfer", "financing", "other"];

/** Appliance types used on jobs and to organise the parts catalogue. */
export const APPLIANCE_TYPES = [
  "Refrigerator",
  "Freezer",
  "Dishwasher",
  "Washer",
  "Dryer",
  "Oven",
  "Range",
  "Cooktop",
  "Microwave",
  "Range hood",
  "Ice maker",
  "Wine cooler",
  "Garbage disposal",
  "Other",
];

/** Tax choices offered on jobs, estimates and invoices (Ontario HST, federal GST, none). */
export const TAX_OPTIONS = [
  { rate: 13, label: "HST 13%" },
  { rate: 5, label: "GST 5%" },
  { rate: 0, label: "No tax" },
];

export function taxLabel(rate: number): string {
  return TAX_OPTIONS.find((t) => t.rate === rate)?.label ?? `Tax ${rate}%`;
}

/**
 * Splits a total that already includes tax into its pre-tax amount, using the same rounding as
 * computeTotals. Returns the largest pre-tax amount whose total does not exceed the original
 * (at most a cent below when no exact split exists), so a paid invoice never shows a balance.
 */
export function splitTaxInclusive(totalCents: number, ratePercent: number): { subtotal: number; tax: number } {
  if (totalCents <= 0 || ratePercent <= 0) return { subtotal: totalCents, tax: 0 };
  let s = Math.floor(totalCents / (1 + ratePercent / 100)) + 2;
  while (s > 0 && s + Math.round((s * ratePercent) / 100) > totalCents) s--;
  return { subtotal: s, tax: Math.round((s * ratePercent) / 100) };
}
