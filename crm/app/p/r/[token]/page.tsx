import { notFound } from "next/navigation";
import { get, getSettings } from "@/lib/db";
import { getCustomer, getInvoice, invoicePayments } from "@/lib/data";
import { customerName, fmtDate, money } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/messaging";
import { PrintButton } from "@/components/forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment receipt", robots: { index: false } };

export default async function ReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const p = get<{ id: number; invoice_id: number; amount_cents: number; method: string; reference: string; paid_on: string }>(
    "SELECT id, invoice_id, amount_cents, method, reference, paid_on FROM payments WHERE token = ?",
    token,
  );
  if (!p) notFound();
  const inv = getInvoice(p.invoice_id);
  if (!inv) notFound();
  const c = getCustomer(inv.customer_id)!;
  const s = getSettings();
  // Balance as of this payment (later payments excluded), so an old receipt stays accurate.
  const paidUpTo = invoicePayments(inv.id).filter((x) => x.id <= p.id).reduce((sum, x) => sum + x.amount_cents, 0);
  const balance = Math.max(0, inv.total_cents - paidUpTo);
  const method = METHOD_LABEL[p.method] ?? p.method;

  return (
    <div className="mx-auto max-w-md px-4 py-10 print:p-0">
      <article className="card p-6 sm:p-8 print:border-0 print:shadow-none">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={100} height={47} className="h-11 w-auto" />
          <div>
            <div className="font-bold">{s.company_name}</div>
            <div className="text-xs text-stone-500">{[s.company_phone, s.company_email].filter(Boolean).join(" · ")}</div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
          <h1 className="mt-3 text-lg font-bold">Payment received</h1>
          <div className="mt-1 text-4xl font-black tabular-nums">{money(p.amount_cents)}</div>
          <p className="mt-1 text-sm text-stone-500">Thank you, {c.first_name || customerName(c)}!</p>
        </div>

        <dl className="mt-8 space-y-2 border-t border-stone-200 pt-4 text-sm">
          <Row k="Paid by" v={<span className="capitalize">{method}</span>} />
          {p.reference && <Row k="Reference" v={p.reference} />}
          <Row k="Date" v={fmtDate(p.paid_on)} />
          <Row k="Invoice" v={`#${inv.number}`} />
          <Row k="Invoice total" v={money(inv.total_cents)} />
          <Row k="Balance remaining" v={<b className={balance > 0 ? "text-rose-700" : "text-emerald-700"}>{money(balance)}</b>} />
          {s.tax_number && <Row k="HST/GST #" v={s.tax_number} />}
        </dl>

        <div className="no-print mt-8 flex flex-wrap justify-between gap-2">
          <a className="btn-ghost" href={`/p/i/${inv.token}`}>View invoice</a>
          <PrintButton />
        </div>
      </article>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-500">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
