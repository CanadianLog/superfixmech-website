import Link from "next/link";
import { saveJob } from "@/lib/actions";
import { addressLine, APPLIANCE_TYPES, customerName } from "@/lib/format";
import type { Address, Customer, Job, LineItemInput, PricebookItem, User } from "@/lib/types";
import { ActionForm, SubmitButton } from "./forms";
import { Card, Field } from "./ui";
import { LineItemsEditor } from "./line-items-editor";
import { LEAD_SOURCES } from "./customer-form";


export function JobForm({
  customer,
  addresses,
  techs,
  pricebook,
  taxRate,
  job,
  items = [],
  defaultDate,
  suppliers = [],
}: {
  customer: Customer;
  addresses: Address[];
  techs: User[];
  pricebook: PricebookItem[];
  taxRate: number;
  job?: Job;
  items?: LineItemInput[];
  defaultDate?: string;
  suppliers?: string[];
}) {
  const date = job?.scheduled_start?.slice(0, 10) ?? defaultDate ?? "";
  return (
    <ActionForm action={saveJob} className="space-y-6">
      {job && <input type="hidden" name="id" value={job.id} />}
      <input type="hidden" name="customer_id" value={customer.id} />
      <Card title="Customer">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold">{customerName(customer)}</div>
            <div className="text-sm text-stone-500">{[customer.phone, customer.email].filter(Boolean).join(" · ")}</div>
          </div>
          {!job && <Link href="/jobs/new" className="text-sm text-stone-500 hover:text-stone-900">Change</Link>}
        </div>
        <Field label="Service address" className="mt-4">
          {addresses.length ? (
            <select className="input" name="address_id" defaultValue={job?.address_id ?? addresses[0]?.id}>
              {addresses.map((a) => <option key={a.id} value={a.id}>{addressLine(a)}</option>)}
            </select>
          ) : (
            <div className="text-sm text-stone-500">No address on file. <Link className="link" href={`/customers/${customer.id}?addr=new`}>Add one</Link> first if this is an on-site job.</div>
          )}
        </Field>
      </Card>

      <Card title="Job">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2"><input className="input" name="title" defaultValue={job?.title} placeholder="e.g. Fridge not cooling" required /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea className="input" name="description" defaultValue={job?.description} placeholder="What the customer reported, symptoms, error codes…" /></Field>
          <Field label="Appliance type">
            <ApplianceSelect defaultValue={job?.appliance} />
          </Field>
          <Field label="Brand"><input className="input" name="brand" defaultValue={job?.brand} /></Field>
          <Field label="Model #"><input className="input" name="model" defaultValue={job?.model} /></Field>
          <Field label="Serial #"><input className="input" name="serial" defaultValue={job?.serial} /></Field>
          <Field label="Lead source">
            <input className="input" name="lead_source" list="job-lead-sources" defaultValue={job?.lead_source ?? customer.lead_source} />
            <datalist id="job-lead-sources">{LEAD_SOURCES.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <Field label="Private notes" hint="Only your team sees these."><input className="input" name="private_notes" defaultValue={job?.private_notes} /></Field>
        </div>
      </Card>

      <Card title="Schedule & dispatch">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Date"><input className="input" type="date" name="date" defaultValue={date} /></Field>
          <Field label="Arrival from"><input className="input" type="time" name="start_time" step={900} defaultValue={job?.scheduled_start?.slice(11, 16) ?? (defaultDate ? "09:00" : "")} /></Field>
          <Field label="To"><input className="input" type="time" name="end_time" step={900} defaultValue={job?.scheduled_end?.slice(11, 16) ?? ""} /></Field>
          <Field label="Technician">
            <select className="input" name="tech_id" defaultValue={job?.tech_id ?? ""}>
              <option value="">Unassigned</option>
              {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
        </div>
        <p className="mt-2 text-xs text-stone-400">Leave the date blank to keep the job unscheduled. Arrival windows default to 2 hours.</p>
      </Card>

      <Card title="Line items">
        <LineItemsEditor initial={items} pricebook={pricebook} taxRate={job?.tax_rate ?? taxRate} appliance={job?.appliance} suppliers={suppliers} />
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={job ? `/jobs/${job.id}` : "/jobs"} className="btn-ghost">Cancel</Link>
        <SubmitButton>{job ? "Save job" : "Create job"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function ApplianceSelect({ defaultValue = "", name = "appliance" }: { defaultValue?: string; name?: string }) {
  const known = APPLIANCE_TYPES.includes(defaultValue);
  return (
    <select className="input" name={name} defaultValue={defaultValue}>
      <option value="">Select appliance…</option>
      {APPLIANCE_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
      {defaultValue && !known && <option value={defaultValue}>{defaultValue}</option>}
    </select>
  );
}
