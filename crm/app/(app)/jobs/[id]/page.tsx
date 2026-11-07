import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, isOffice } from "@/lib/auth";
import { activitiesFor, getAddress, getCustomer, getJob, lineItems, listInvoices, listPricebook, rateFor, timeZone } from "@/lib/data";
import { addressLine, customerName, fmtSchedule, fmtStamp, mapsUrl, money } from "@/lib/format";
import { createInvoiceFromJob, saveJobItems, saveTechNotes, setJobStatus } from "@/lib/actions";
import { Card, PageHeader, StatusBadge, TechDot } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { LineItemsEditor } from "@/components/line-items-editor";
import { Timeline } from "@/components/timeline";
import { ApplianceSelect } from "@/components/job-form";
import type { JobStatus } from "@/lib/types";

const NEXT_STEP: Partial<Record<JobStatus, { status: JobStatus; label: string }>> = {
  unscheduled: { status: "dispatched", label: "On my way" },
  scheduled: { status: "dispatched", label: "On my way" },
  dispatched: { status: "in_progress", label: "Start job" },
  in_progress: { status: "completed", label: "Finish job" },
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
            {job.status === "completed" && (
              <form action={createInvoiceFromJob}>
                <input type="hidden" name="job_id" value={job.id} />
                <SubmitButton pendingText="Creating…">{invoices.length ? "View invoice" : "Create invoice"}</SubmitButton>
              </form>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
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
        </div>
      </div>
    </>
  );
}
