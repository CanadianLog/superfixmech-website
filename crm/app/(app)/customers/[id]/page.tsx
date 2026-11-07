import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { activitiesFor, customerAddresses, customerBalance, getCustomer, listEstimates, listInvoices, listJobs, timeZone } from "@/lib/data";
import { addressLine, customerName, fmtDate, mapsUrl, money } from "@/lib/format";
import { createBlankInvoice, deleteAddress, saveAddress } from "@/lib/actions";
import { Card, Empty, PageHeader, StatusBadge, Tabs } from "@/components/ui";
import { JobList } from "@/components/job-list";
import { Timeline } from "@/components/timeline";
import { ConfirmButton } from "@/components/forms";

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; addr?: string }> }) {
  await requireUser(["admin", "dispatcher"]);
  const id = Number((await params).id);
  const { tab = "jobs", addr } = await searchParams;
  const c = getCustomer(id);
  if (!c) notFound();
  const addresses = customerAddresses(id);
  const jobs = listJobs({ customerId: id });
  const estimates = listEstimates({ customerId: id });
  const invoices = listInvoices({ customerId: id });
  const balance = customerBalance(id);
  const lifetime = invoices.filter((i) => i.display_status !== "void").reduce((s, i) => s + i.paid_cents, 0);
  const name = customerName(c);

  return (
    <>
      <PageHeader
        title={name}
        subtitle={c.company && name !== c.company ? c.company : `Customer since ${fmtDate(c.created_at)}`}
        back={{ href: "/customers", label: "Customers" }}
        actions={
          <>
            <Link href={`/customers/${id}/edit`} className="btn-ghost">Edit</Link>
            <Link href={`/estimates/new?customer=${id}`} className="btn-ghost">New estimate</Link>
            <form action={createBlankInvoice}><input type="hidden" name="customer_id" value={id} /><button className="btn-ghost">New invoice</button></form>
            <Link href={`/jobs/new?customer=${id}`} className="btn-primary">+ New job</Link>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Card title="Contact">
            <dl className="space-y-3 text-sm">
              {c.phone && <div><dt className="label">Mobile</dt><dd><a className="link" href={`tel:${c.phone}`}>{c.phone}</a> · <a className="link" href={`sms:${c.phone}`}>Text</a></dd></div>}
              {c.alt_phone && <div><dt className="label">Other phone</dt><dd><a className="link" href={`tel:${c.alt_phone}`}>{c.alt_phone}</a></dd></div>}
              {c.email && <div><dt className="label">Email</dt><dd><a className="link break-all" href={`mailto:${c.email}`}>{c.email}</a></dd></div>}
              {c.lead_source && <div><dt className="label">Lead source</dt><dd>{c.lead_source}</dd></div>}
              {c.tags && <div><dt className="label">Tags</dt><dd className="flex flex-wrap gap-1">{c.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => <span key={t} className="rounded bg-stone-100 px-1.5 text-xs">{t}</span>)}</dd></div>}
              {c.notes && <div><dt className="label">Notes</dt><dd className="whitespace-pre-line">{c.notes}</dd></div>}
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 text-sm">
              <div><div className="label">Balance due</div><div className={`text-lg font-bold ${balance > 0 ? "text-rose-700" : ""}`}>{money(balance)}</div></div>
              <div><div className="label">Lifetime paid</div><div className="text-lg font-bold">{money(lifetime)}</div></div>
            </div>
          </Card>

          <Card title="Addresses" actions={<Link href={`/customers/${id}?addr=new`} className="link text-xs">+ Add</Link>}>
            <ul className="space-y-4 text-sm">
              {addresses.map((a) =>
                addr === String(a.id) ? (
                  <li key={a.id}><AddressForm customerId={id} a={a} /></li>
                ) : (
                  <li key={a.id} className="flex items-start justify-between gap-2">
                    <div>
                      <a className="hover:underline" href={mapsUrl(a)} target="_blank" rel="noreferrer">{addressLine(a)}</a>
                      {a.notes && <div className="text-xs text-stone-500">{a.notes}</div>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link href={`/customers/${id}?addr=${a.id}`} className="text-xs text-stone-500 hover:text-stone-900">Edit</Link>
                      <form action={deleteAddress}>
                        <input type="hidden" name="id" value={a.id} /><input type="hidden" name="customer_id" value={id} />
                        <ConfirmButton className="text-xs text-stone-400 hover:text-rose-600" message="Remove this address?">Remove</ConfirmButton>
                      </form>
                    </div>
                  </li>
                ),
              )}
              {addresses.length === 0 && addr !== "new" && <li className="text-stone-400">No address on file.</li>}
              {addr === "new" && <li><AddressForm customerId={id} /></li>}
            </ul>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div>
            <Tabs
              current={tab}
              items={[
                { key: "jobs", label: "Jobs", href: `/customers/${id}?tab=jobs`, count: jobs.length },
                { key: "estimates", label: "Estimates", href: `/customers/${id}?tab=estimates`, count: estimates.length },
                { key: "invoices", label: "Invoices", href: `/customers/${id}?tab=invoices`, count: invoices.length },
              ]}
            />
            <Card pad={false}>
              {tab === "jobs" && (jobs.length ? <JobList jobs={jobs} /> : <Empty action={<Link href={`/jobs/new?customer=${id}`} className="btn-primary">Create a job</Link>}>No jobs yet.</Empty>)}
              {tab === "estimates" &&
                (estimates.length ? (
                  <ul className="divide-y divide-stone-100">
                    {estimates.map((e) => (
                      <li key={e.id}><Link href={`/estimates/${e.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-amber-50/40">
                        <div><div className="font-semibold">{e.title || "Estimate"} <span className="text-xs font-normal text-stone-400">#{e.number}</span></div><div className="text-xs text-stone-500">{fmtDate(e.created_at)}</div></div>
                        <div className="flex items-center gap-3"><StatusBadge status={e.status} /><span className="font-semibold tabular-nums">{money(e.total_cents)}</span></div>
                      </Link></li>
                    ))}
                  </ul>
                ) : <Empty action={<Link href={`/estimates/new?customer=${id}`} className="btn-primary">Create an estimate</Link>}>No estimates yet.</Empty>)}
              {tab === "invoices" &&
                (invoices.length ? (
                  <ul className="divide-y divide-stone-100">
                    {invoices.map((i) => (
                      <li key={i.id}><Link href={`/invoices/${i.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-amber-50/40">
                        <div><div className="font-semibold">Invoice #{i.number}</div><div className="text-xs text-stone-500">Issued {fmtDate(i.issued_on)}{i.job_number ? ` · Job #${i.job_number}` : ""}</div></div>
                        <div className="flex items-center gap-3"><StatusBadge status={i.display_status} /><span className="font-semibold tabular-nums">{money(i.total_cents)}</span></div>
                      </Link></li>
                    ))}
                  </ul>
                ) : <Empty>No invoices yet.</Empty>)}
            </Card>
          </div>
          <Timeline items={activitiesFor({ customerId: id })} tz={timeZone()} customerId={id} />
        </div>
      </div>
    </>
  );
}

function AddressForm({ customerId, a }: { customerId: number; a?: { id: number; street: string; unit: string; city: string; province: string; postal_code: string; notes: string } }) {
  return (
    <form action={saveAddress} className="grid grid-cols-6 gap-2 rounded-lg bg-stone-50 p-3">
      <input type="hidden" name="customer_id" value={customerId} />
      {a && <input type="hidden" name="id" value={a.id} />}
      <input className="input col-span-4" name="street" placeholder="Street" defaultValue={a?.street} required />
      <input className="input col-span-2" name="unit" placeholder="Unit" defaultValue={a?.unit} />
      <input className="input col-span-3" name="city" placeholder="City" defaultValue={a?.city ?? "Ottawa"} />
      <input className="input col-span-1 px-2" name="province" placeholder="Prov" defaultValue={a?.province ?? "ON"} />
      <input className="input col-span-2" name="postal_code" placeholder="Postal" defaultValue={a?.postal_code} />
      <input className="input col-span-6" name="notes" placeholder="Access notes (optional)" defaultValue={a?.notes} />
      <div className="col-span-6 flex justify-end gap-2">
        <Link href={`/customers/${customerId}`} className="btn-ghost btn-sm">Cancel</Link>
        <button className="btn-primary btn-sm">Save address</button>
      </div>
    </form>
  );
}
