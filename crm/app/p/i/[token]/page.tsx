import { notFound } from "next/navigation";
import { get, getSettings } from "@/lib/db";
import { getAddress, getCustomer, getInvoice, invoicePayments, lineItems, rateFor } from "@/lib/data";
import { fmtDate, money } from "@/lib/format";
import { DocumentView } from "@/components/document";
import { PrintButton } from "@/components/forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your invoice", robots: { index: false } };

export default async function InvoicePortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = get<{ id: number }>("SELECT id FROM invoices WHERE token = ?", token);
  const inv = row && getInvoice(row.id);
  if (!inv || inv.status === "void") notFound();
  const customer = getCustomer(inv.customer_id)!;
  const job = inv.job_id ? get<{ address_id: number | null }>("SELECT address_id FROM jobs WHERE id = ?", inv.job_id) : undefined;
  const s = getSettings();
  const payments = invoicePayments(inv.id);

  return (
    <DocumentView
      kind="Invoice"
      number={inv.number}
      settings={s}
      customer={customer}
      address={getAddress(job?.address_id ?? null)}
      items={lineItems("invoice", inv.id)}
      taxRate={rateFor("invoice", inv.id)}
      meta={[["Issued", fmtDate(inv.issued_on)], ["Due", fmtDate(inv.due_on)]]}
      footer={
        <>
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between text-stone-500">
              <dt className="capitalize">Paid {fmtDate(p.paid_on, { year: undefined })} ({p.method})</dt>
              <dd className="tabular-nums">−{money(p.amount_cents)}</dd>
            </div>
          ))}
          <div className="flex justify-between rounded-lg bg-amber-50 px-2 py-1.5 text-base font-bold">
            <dt>Balance due</dt>
            <dd className="tabular-nums">{money(Math.max(0, inv.balance_cents))}</dd>
          </div>
        </>
      }
    >
      {inv.display_status === "paid" && <div className="mt-6 text-center text-2xl font-black uppercase tracking-widest text-emerald-600">Paid — thank you!</div>}
      {inv.notes && <p className="mt-8 whitespace-pre-line text-sm text-stone-600">{inv.notes}</p>}
      <div className="no-print mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-6 text-sm text-stone-500">
        <span>Payment options: e-transfer to {s.company_email}, or call {s.company_phone} to pay by card.</span>
        <PrintButton />
      </div>
    </DocumentView>
  );
}
