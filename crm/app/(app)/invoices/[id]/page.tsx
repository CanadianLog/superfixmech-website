import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSettings, get } from "@/lib/db";
import { getCustomer, getInvoice, invoicePayments, lineItems, listPricebook, rateFor, timeZone, today } from "@/lib/data";
import { customerName, fmtDate, fmtStamp, money } from "@/lib/format";
import { appOrigin } from "@/lib/origin";
import { deleteInvoice, deletePayment, saveInvoice, setInvoiceStatus, syncInvoiceToQbo } from "@/lib/actions";
import { emailConfigured, smsConfigured } from "@/lib/messaging";
import { PaymentForm, ReceiptForm, SendInvoiceForm } from "@/components/checkout";
import { qboConfig } from "@/lib/quickbooks";
import { Card, Field, PageHeader, StatusBadge } from "@/components/ui";
import { ActionForm, ConfirmButton, CopyButton, SubmitButton } from "@/components/forms";
import { LineItemsEditor } from "@/components/line-items-editor";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin", "dispatcher"]);
  const inv = getInvoice(Number((await params).id));
  if (!inv) notFound();
  const c = getCustomer(inv.customer_id)!;
  const payments = invoicePayments(inv.id);
  const s = getSettings();
  const locked = inv.status === "void";
  const portal = `/p/i/${inv.token}`;
  const mailto = `mailto:${c.email}?subject=${encodeURIComponent(`Invoice #${inv.number} from ${s.company_name}`)}&body=${encodeURIComponent(`Hi ${c.first_name || ""},\n\nThank you for your business. Your invoice for ${money(inv.total_cents)} is here:\n${await appOrigin()}${portal}\n\n${s.company_name}\n${s.company_phone}`)}`;
  const job = inv.job_id ? get<{ id: number; number: number }>("SELECT id, number FROM jobs WHERE id = ?", inv.job_id) : undefined;
  const statusBtn = (status: string, label: string, cls = "btn-ghost") => (
    <form action={setInvoiceStatus}>
      <input type="hidden" name="id" value={inv.id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={cls} pendingText="…">{label}</SubmitButton>
    </form>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Invoice #{inv.number} <StatusBadge status={inv.display_status} /></span>}
        subtitle={<><Link className="link" href={`/customers/${c.id}`}>{customerName(c)}</Link>{job && <> · <Link className="link" href={`/jobs/${job.id}`}>Job #{job.number}</Link></>}</>}
        back={{ href: "/invoices", label: "Invoices" }}
        actions={
          <>
            <Link href={portal} target="_blank" className="btn-ghost">Customer view / print</Link>
            <CopyButton text={portal} label="Copy customer link" />
            {c.email && <a href={mailto} className="btn-ghost">Email</a>}
            {inv.status === "draft" && statusBtn("sent", "Mark sent", "btn-primary")}
            {inv.status !== "void" && payments.length === 0 && statusBtn("void", "Void")}
            {inv.status === "void" && statusBtn("draft", "Un-void")}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActionForm action={saveInvoice} className="space-y-6">
            <input type="hidden" name="id" value={inv.id} />
            <Card title="Line items">
              <LineItemsEditor
                initial={lineItems("invoice", inv.id).map((i) => ({ ...i, taxable: !!i.taxable }))}
                pricebook={listPricebook()}
                taxRate={rateFor("invoice", inv.id)}
                readOnly={locked}
              />
            </Card>
            <Card title="Details">
              <fieldset disabled={locked} className="grid gap-4 sm:grid-cols-2">
                <Field label="Issued"><input className="input" type="date" name="issued_on" defaultValue={inv.issued_on} /></Field>
                <Field label="Due"><input className="input" type="date" name="due_on" defaultValue={inv.due_on} /></Field>
                <Field label="Notes on invoice" className="sm:col-span-2"><textarea className="input" name="notes" defaultValue={inv.notes} /></Field>
              </fieldset>
            </Card>
            {!locked && <div className="flex justify-end"><SubmitButton>Save invoice</SubmitButton></div>}
          </ActionForm>
        </div>

        <div className="space-y-6">
          <Card title="Balance">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">Total</dt><dd className="tabular-nums">{money(inv.total_cents)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Paid</dt><dd className="tabular-nums">−{money(inv.paid_cents)}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-1 text-lg font-bold"><dt>Balance due</dt><dd className={`tabular-nums ${inv.balance_cents > 0 ? "text-rose-700" : "text-emerald-700"}`}>{money(Math.max(0, inv.balance_cents))}</dd></div>
            </dl>
          </Card>

          {!locked && (
            <Card title="Send invoice">
              <SendInvoiceForm invoice={inv} phone={c.phone} email={c.email} smsReady={smsConfigured()} emailReady={emailConfigured()} />
            </Card>
          )}

          {!locked && inv.balance_cents > 0 && (
            <Card title="Record payment & send receipt">
              <PaymentForm invoice={inv} phone={c.phone} email={c.email} smsReady={smsConfigured()} emailReady={emailConfigured()} today={today()} />
            </Card>
          )}

          {user.role === "admin" && (
            <form action={deleteInvoice} className="flex justify-end">
              <input type="hidden" name="id" value={inv.id} />
              <ConfirmButton
                message={`Delete invoice #${inv.number}?${payments.length ? ` Its ${payments.length} recorded payment(s) are deleted too.` : ""}${inv.qbo_id ? " It stays in QuickBooks; void or delete it there if needed." : ""} The job and customer are kept. This can't be undone.`}
              >
                Delete invoice
              </ConfirmButton>
            </form>
          )}

          {qboConfig().connected && !locked && (
            <Card title="QuickBooks">
              <ActionForm action={syncInvoiceToQbo} className="space-y-3 text-sm">
                <input type="hidden" name="id" value={inv.id} />
                <p className="text-stone-600">
                  {inv.qbo_synced_at ? `Last sent ${fmtStamp(inv.qbo_synced_at, timeZone())}. Send again after edits to update it.` : "Not in QuickBooks yet."}
                </p>
                <SubmitButton className="btn-ghost w-full" pendingText="Sending…">{inv.qbo_id ? "Update in QuickBooks" : "Send to QuickBooks"}</SubmitButton>
              </ActionForm>
            </Card>
          )}

          <Card title="Payments">
            {payments.length ? (
              <ul className="space-y-3 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold tabular-nums">{money(p.amount_cents)}</div>
                      <div className="text-xs capitalize text-stone-500">{p.method === "card" ? "credit card" : p.method}{p.reference ? ` · ${p.reference}` : ""} · {fmtDate(p.paid_on)}{p.token && <> · <Link className="link normal-case" href={`/p/r/${p.token}`} target="_blank">receipt</Link></>}</div>
                    </div>
                    {user.role === "admin" && (
                      <form action={deletePayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="invoice_id" value={inv.id} />
                        <ConfirmButton className="text-xs text-stone-400 hover:text-rose-600" message="Delete this payment record?">Delete</ConfirmButton>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400">No payments yet.</p>
            )}
            {payments.length > 0 && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <div className="label">Receipt for the last payment</div>
                <ReceiptForm paymentId={payments[payments.length - 1].id} phone={c.phone} email={c.email} smsReady={smsConfigured()} emailReady={emailConfigured()} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
