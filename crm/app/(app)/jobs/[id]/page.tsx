import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, isOffice } from "@/lib/auth";
import { activitiesFor, getAddress, getCustomer, getJob, invoicePayments, lineItems, listInvoices, listPricebook, listSuppliers, rateFor, timeZone, today } from "@/lib/data";
import { addressLine, customerName, fmtSchedule, fmtStamp, mapsUrl, money } from "@/lib/format";
import { createInvoiceFromJob, deleteJob, finishJob, saveJobItems, saveTechNotes, setJobStatus } from "@/lib/actions";
import { getSettings } from "@/lib/db";
import { emailConfigured, messagesForJob, smsConfigured } from "@/lib/messaging";
import { PaidBadge, PaymentForm, ReceiptForm, ReviewStatus, SendInvoiceForm } from "@/components/checkout";
import { Card, PageHeader, StatusBadge, TechDot } from "@/components/ui";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/forms";
import { LineItemsEditor } from "@/components/line-items-editor";
import { Timeline } from "@/components/timeline";
import { ApplianceSelect } from "@/components/job-form";
import type { JobStatus } from "@/lib/types";

const NEXT_STEP: Partial<Record<JobStatus, { status: JobStatus; label: string }>> = {
  unscheduled: { status: "dispatched", label: "On my way" },
  scheduled: { status: "dispatched", label: "On my way" },
  dispatched: { status: "in_progress", label: "Start job" },
};

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const job = getJob(Number((await params).id));
  if (!job) notFound();
  if (!isOffice(user) && job.tech_id !== user.id) redirect("/jobs");
  const customer = getCustomer(job.customer_id)!;
  const address = getAddress(job.address_id);
  const invoices = listInvoices({ jobId: job.id });
  const tz = timeZone();
  const step = NEXT_STEP[job.status];
  const s = getSettings();
  const invoice = invoices.find((i) => i.display_status !== "void");
  const smsReady = smsConfigured(s);
  const emailReady = emailConfigured(s);
  const canFinish = job.status !== "completed" && job.status !== "canceled";

  return (
    <>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{job.title || "Job"} <span className="text-base font-normal text-stone-400">#{job.number}</span> <StatusBadge status={job.status} /></span>}
        subtitle={[fmtSchedule(job.scheduled_start, job.scheduled_end), [job.brand, job.appliance].filter(Boolean).join(" "), job.model && `Model ${job.model}`, job.serial && `Serial ${job.serial}`].filter(Boolean).join(" · ")}
        back={{ href: "/jobs", label: "Jobs" }}
        actions={
          <>
            {isOffice(user) && <Link href={`/jobs/${job.id}/edit`} className="btn-ghost">Edit / reschedule</Link>}
            {step && (
              <form action={setJobStatus}>
                <input type="hidden" name="id" value={job.id} />
                <input type="hidden" name="status" value={step.status} />
                <SubmitButton pendingText="Updating…">{step.label}</SubmitButton>
              </form>
            )}
            {canFinish && (
              <form action={finishJob}>
                <input type="hidden" name="id" value={job.id} />
                <SubmitButton className="btn btn-dark bg-emerald-700 hover:bg-emerald-800" pendingText="Finishing…">✓ Job finished</SubmitButton>
              </form>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {job.status === "completed" && (
            <div id="checkout" className="scroll-mt-6">
              <Card
                title="Checkout"
                className="border-emerald-300 ring-2 ring-emerald-100"
                actions={invoice && <Link href={isOffice(user) ? `/invoices/${invoice.id}` : `/p/i/${invoice.token}`} className="link text-xs">Invoice #{invoice.number} →</Link>}
              >
                {!invoice ? (
                  <form action={createInvoiceFromJob} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-stone-600">No invoice for this job yet.</span>
                    <input type="hidden" name="job_id" value={job.id} />
                    <SubmitButton pendingText="Creating…">Create invoice</SubmitButton>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="text-sm text-stone-500">
                        Invoice #{invoice.number} · <StatusBadge status={invoice.display_status} />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold tabular-nums">{money(invoice.total_cents)}</div>
                        {invoice.paid_cents > 0 && invoice.balance_cents > 0 && <div className="text-sm text-rose-700">Balance {money(invoice.balance_cents)}</div>}
                      </div>
                    </div>

                    <section>
                      <h3 className="mb-2 text-sm font-bold">1. Send invoice</h3>
                      <SendInvoiceForm invoice={invoice} phone={customer.phone} email={customer.email} smsReady={smsReady} emailReady={emailReady} />
                    </section>

                    <section className="border-t border-stone-100 pt-5">
                      <h3 className="mb-2 text-sm font-bold">2. Payment & receipt</h3>
                      {invoice.balance_cents > 0 ? (
                        <PaymentForm invoice={invoice} phone={customer.phone} email={customer.email} smsReady={smsReady} emailReady={emailReady} today={today()} />
                      ) : (
                        <>
                          <PaidBadge invoice={invoice} />
                          {(() => {
                            const last = invoicePayments(invoice.id).at(-1);
                            return last ? (
                              <div className="mt-4">
                                <div className="label">Receipt for the {money(last.amount_cents)} payment</div>
                                <ReceiptForm paymentId={last.id} phone={customer.phone} email={customer.email} smsReady={smsReady} emailReady={emailReady} />
                              </div>
                            ) : null;
                          })()}
                          <ul className="mt-2 space-y-1 text-xs text-stone-500">
                            {invoicePayments(invoice.id).map((p) => (
                              <li key={p.id}>
                                {money(p.amount_cents)} · {p.method === "card" ? "credit card" : p.method} · {p.paid_on}
                                {p.token && <> · <Link className="link" href={`/p/r/${p.token}`} target="_blank">receipt</Link></>}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </section>

                    <section className="border-t border-stone-100 pt-5">
                      <h3 className="mb-2 text-sm font-bold">3. Google review request</h3>
                      <ReviewStatus jobId={job.id} messages={messagesForJob(job.id)} tz={tz} hasReviewLink={!!s.google_review_url} />
                    </section>
                  </div>
                )}
              </Card>
            </div>
          )}

          <Card title="Appliance">
            <form action={saveTechNotes} className="grid gap-3 sm:grid-cols-4">
              <input type="hidden" name="id" value={job.id} />
              <label className="block"><span className="label">Appliance type</span><ApplianceSelect defaultValue={job.appliance} /></label>
              <label className="block"><span className="label">Brand</span><input className="input" name="brand" defaultValue={job.brand} /></label>
              <label className="block"><span className="label">Model #</span><input className="input" name="model" defaultValue={job.model} /></label>
              <label className="block"><span className="label">Serial #</span><input className="input" name="serial" defaultValue={job.serial} /></label>
              <label className="block sm:col-span-4"><span className="label">Private notes</span><textarea className="input" name="private_notes" defaultValue={job.private_notes} placeholder="Diagnosis, parts to order, follow-ups…" /></label>
              <div className="flex justify-end sm:col-span-4"><SubmitButton className="btn-ghost btn-sm">Save appliance info</SubmitButton></div>
            </form>
          </Card>

          <Card title="Line items">
            <ActionForm action={saveJobItems}>
              <input type="hidden" name="id" value={job.id} />
              <LineItemsEditor
                initial={lineItems("job", job.id).map((i) => ({ ...i, taxable: !!i.taxable }))}
                pricebook={listPricebook()}
                suppliers={listSuppliers()}
                taxRate={rateFor("job", job.id)}
                appliance={job.appliance}
              />
              <div className="mt-4 flex justify-end">
                <SubmitButton className="btn-dark">Save line items</SubmitButton>
              </div>
            </ActionForm>
          </Card>

          <Timeline items={activitiesFor({ jobId: job.id })} tz={tz} jobId={job.id} />
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <div className="space-y-2 text-sm">
              {isOffice(user) ? (
                <Link href={`/customers/${customer.id}`} className="text-base font-semibold hover:underline">{customerName(customer)}</Link>
              ) : (
                <div className="text-base font-semibold">{customerName(customer)}</div>
              )}
              {customer.phone && <div><a className="link" href={`tel:${customer.phone}`}>{customer.phone}</a> · <a className="link" href={`sms:${customer.phone}`}>Text</a></div>}
              {customer.email && <div><a className="link break-all" href={`mailto:${customer.email}`}>{customer.email}</a></div>}
              {address && (
                <div className="pt-2">
                  <div className="label">Service address</div>
                  <a className="hover:underline" href={mapsUrl(address)} target="_blank" rel="noreferrer">{addressLine(address)}</a>
                  {address.notes && <div className="text-xs text-stone-500">{address.notes}</div>}
                  <a className="btn-ghost btn-sm mt-2" href={mapsUrl(address)} target="_blank" rel="noreferrer">Directions</a>
                </div>
              )}
              {customer.notes && <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 whitespace-pre-line">{customer.notes}</div>}
            </div>
          </Card>

          <Card title="Details">
            <dl className="space-y-3 text-sm">
              <div><dt className="label">Technician</dt><dd><TechDot color={job.tech_color} name={job.tech_name} /></dd></div>
              {job.description && <div><dt className="label">Description</dt><dd className="whitespace-pre-line">{job.description}</dd></div>}
              {job.lead_source && <div><dt className="label">Lead source</dt><dd>{job.lead_source}</dd></div>}
              {job.started_at && <div><dt className="label">Started</dt><dd>{fmtStamp(job.started_at, tz)}</dd></div>}
              {job.completed_at && <div><dt className="label">Completed</dt><dd>{fmtStamp(job.completed_at, tz)}</dd></div>}
              {job.estimate_id && <div><dt className="label">From estimate</dt><dd><Link className="link" href={`/estimates/${job.estimate_id}`}>View estimate</Link></dd></div>}
            </dl>
          </Card>

          <Card title="Invoice">
            {invoices.length ? (
              <ul className="space-y-2 text-sm">
                {invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <Link className="link" href={`/invoices/${i.id}`}>Invoice #{i.number}</Link>
                    <span className="flex items-center gap-2"><StatusBadge status={i.display_status} /> {money(i.total_cents)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <form action={createInvoiceFromJob} className="space-y-2 text-sm">
                <p className="text-stone-500">No invoice yet. Line items are copied onto the invoice.</p>
                <input type="hidden" name="job_id" value={job.id} />
                <SubmitButton className="btn-ghost btn-sm" pendingText="Creating…">Create invoice</SubmitButton>
              </form>
            )}
          </Card>

          <Card title="Change status">
            <form action={setJobStatus} className="flex gap-2">
              <input type="hidden" name="id" value={job.id} />
              <select name="status" className="input" defaultValue={job.status}>
                {(["unscheduled", "scheduled", "dispatched", "in_progress", "completed", "canceled"] as const).map((st) => (
                  <option key={st} value={st}>{st === "dispatched" ? "On my way" : st.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}</option>
                ))}
              </select>
              <SubmitButton className="btn-ghost">Set</SubmitButton>
            </form>
          </Card>

          {user.role === "admin" && (
            <form action={deleteJob} className="flex justify-end">
              <input type="hidden" name="id" value={job.id} />
              <ConfirmButton message={`Delete job #${job.number}? Its line items and notes are deleted. ${invoices.length ? "Its invoice is kept. " : ""}This can't be undone.`}>
                Delete job
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
