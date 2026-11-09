import { addressLine, computeTotals, customerName, lineTotal, money, taxLabel } from "@/lib/format";
import type { Address, Customer, LineItem } from "@/lib/types";

/** Customer-facing estimate/invoice body, used by the portal pages and for printing. */
export function DocumentView({
  kind,
  number,
  settings,
  customer,
  address,
  items,
  taxRate,
  meta,
  message,
  footer,
  children,
}: {
  kind: "Estimate" | "Invoice";
  number: number;
  settings: Record<string, string>;
  customer: Customer;
  address?: Address;
  items: LineItem[];
  taxRate: number;
  meta: [string, string][];
  message?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const rate = taxRate;
  const totals = computeTotals(items.map((i) => ({ ...i, taxable: !!i.taxable })), rate);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
      <article className="card p-6 sm:p-10 print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-sm font-black text-brand-ink">SF</span>
              <span className="text-lg font-bold">{settings.company_name}</span>
            </div>
            <div className="mt-2 text-sm text-stone-500">
              {settings.company_address && <div>{settings.company_address}</div>}
              <div>{[settings.company_phone, settings.company_email].filter(Boolean).join(" · ")}</div>
              {settings.tax_number && <div>HST/GST # {settings.tax_number}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{kind}</div>
            <div className="text-stone-500">#{number}</div>
            <dl className="mt-2 text-sm">
              {meta.map(([k, v]) => (
                <div key={k} className="flex justify-end gap-2"><dt className="text-stone-500">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
          </div>
        </header>

        <section className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <div className="label">Prepared for</div>
            <div className="font-semibold">{customerName(customer)}</div>
            {customer.company && (customer.first_name || customer.last_name) && <div>{customer.company}</div>}
            {customer.email && <div>{customer.email}</div>}
            {customer.phone && <div>{customer.phone}</div>}
          </div>
          {address && (
            <div>
              <div className="label">Service address</div>
              <div>{addressLine(address)}</div>
            </div>
          )}
        </section>

        {message && <p className="mt-6 whitespace-pre-line rounded-lg bg-stone-50 p-4 text-sm">{message}</p>}

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-stone-800 text-left text-xs uppercase tracking-wide">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-stone-100 align-top">
                <td className="py-2.5 pr-2">
                  <div className="font-medium">{i.name}</div>
                  {i.description && <div className="whitespace-pre-line text-xs text-stone-500">{i.description}</div>}
                </td>
                <td className="py-2.5 text-right tabular-nums">{i.quantity}</td>
                <td className="py-2.5 text-right tabular-nums">{money(i.unit_price_cents)}</td>
                <td className="py-2.5 text-right tabular-nums">{money(lineTotal(i))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd className="tabular-nums">{money(totals.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-500">{taxLabel(rate)}</dt><dd className="tabular-nums">{money(totals.tax)}</dd></div>
          <div className="flex justify-between border-t-2 border-stone-800 pt-1 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{money(totals.total)}</dd></div>
          {footer}
        </dl>

        {children}
      </article>
    </div>
  );
}
