import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { today } from "@/lib/data";
import { addDays, fmtDate } from "@/lib/format";
import { CALL_OUTCOMES, getProspect, outcomeLabel, prospectCalls, PROSPECT_STATUSES, statusLabel, statusTone } from "@/lib/prospects";
import { convertProspect, deleteProspect, deleteProspectCall, logProspectCall, setProspectStatus } from "@/lib/actions";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/forms";
import { Card, Field, PageHeader } from "@/components/ui";
import { ProspectForm } from "@/components/prospect-form";
import { FollowUpPicker } from "@/components/follow-up-picker";

export const metadata = { title: "Property manager" };

const when = (iso: string) =>
  new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`).toLocaleString("en-CA", { timeZone: "America/Toronto", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default async function ProspectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  await requireUser(["admin", "dispatcher"]);
  const { id } = await params;
  const { edit } = await searchParams;
  const p = getProspect(Number(id));
  if (!p) notFound();
  const calls = prospectCalls(p.id);
  const now = today();
  const name = p.company || p.contact_name;

  if (edit) {
    return (
      <>
        <PageHeader title={`Edit ${name}`} back={{ href: `/prospects/${p.id}`, label: name }} />
        <Card className="max-w-3xl">
          <ProspectForm p={p} cancelHref={`/prospects/${p.id}`} />
        </Card>
      </>
    );
  }

  const site = p.website && (/^https?:\/\//i.test(p.website) ? p.website : `https://${p.website}`);
  const overdue = p.follow_up_on && p.follow_up_on < now && !["not_interested", "converted"].includes(p.status);

  return (
    <>
      <PageHeader
        title={name}
        back={{ href: "/prospects", label: "Cold calls" }}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusTone(p.status)}`}>{statusLabel(p.status)}</span>
            {p.follow_up_on && !["not_interested", "converted"].includes(p.status) && (
              <span className={overdue ? "font-semibold text-rose-700" : ""}>
                Call {p.follow_up_on === now ? "today" : `${overdue ? "was due " : "on "}${fmtDate(p.follow_up_on)}`}
              </span>
            )}
            <span>
              · {p.call_count} call{p.call_count === 1 ? "" : "s"}
            </span>
          </span>
        }
        actions={
          <>
            {p.phone && (
              <a href={`tel:${p.phone}`} className="btn-primary">
                Call {p.phone}
              </a>
            )}
            <Link href={`/prospects/${p.id}?edit=1`} className="btn-ghost">
              Edit
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Log a call">
            <ActionForm action={logProspectCall} className="space-y-4">
              <input type="hidden" name="prospect_id" value={p.id} />
              <fieldset>
                <legend className="label">What happened?</legend>
                <div className="flex flex-wrap gap-2">
                  {CALL_OUTCOMES.map((o) => (
                    <label key={o.value} className="cursor-pointer">
                      <input type="radio" name="outcome" value={o.value} className="peer sr-only" required />
                      <span className="inline-block rounded-full px-3 py-1.5 text-sm ring-1 ring-stone-300 peer-checked:bg-stone-900 peer-checked:text-white peer-checked:ring-stone-900 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500">
                        {o.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Notes">
                <textarea className="input min-h-24" name="notes" placeholder="Who you spoke to, what they said, what to bring up next time…" />
              </Field>
              <div>
                <span className="label">Call again on</span>
                <FollowUpPicker
                  min={now}
                  options={[
                    { label: "Tomorrow", date: addDays(now, 1) },
                    { label: "Next week", date: addDays(now, 7) },
                    { label: "In 2 weeks", date: addDays(now, 14) },
                    { label: "In a month", date: addDays(now, 30) },
                  ]}
                />
                <span className="mt-1 block text-xs text-stone-400">Leave blank and we&apos;ll pick: tomorrow if interested, otherwise in 2 days. &ldquo;Not interested&rdquo; clears it.</span>
              </div>
              <div className="flex justify-end">
                <SubmitButton pendingText="Saving…">Save call</SubmitButton>
              </div>
            </ActionForm>
          </Card>

          <Card title={`Call history (${calls.length})`} pad={false}>
            {calls.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-stone-500">No calls logged yet.</p>
            ) : (
              <ol className="divide-y divide-stone-100">
                {calls.map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-semibold text-stone-900">{outcomeLabel(c.outcome)}</span>
                        <span className="text-stone-500">
                          {" "}
                          · {when(c.created_at)}
                          {c.user_name ? ` · ${c.user_name}` : ""}
                        </span>
                      </div>
                      <form action={deleteProspectCall}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="prospect_id" value={p.id} />
                        <ConfirmButton className="text-xs text-stone-400 hover:text-rose-700" message="Delete this call from the history?">
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                    {c.notes && <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{c.notes}</p>}
                    {c.follow_up_on && <p className="mt-1 text-xs text-stone-500">Follow-up set for {fmtDate(c.follow_up_on)}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-2 text-sm">
              {[
                ["Company", p.company],
                ["Contact", p.contact_name],
                ["Role", p.title],
                ["Units / buildings", p.units],
                ["Phone", p.phone && <a href={`tel:${p.phone}`} className="text-amber-700 hover:underline">{p.phone}</a>],
                ["Other phone", p.alt_phone && <a href={`tel:${p.alt_phone}`} className="text-amber-700 hover:underline">{p.alt_phone}</a>],
                ["Email", p.email && <a href={`mailto:${p.email}`} className="break-all text-amber-700 hover:underline">{p.email}</a>],
                ["Website", site && <a href={site} target="_blank" rel="noreferrer" className="break-all text-amber-700 hover:underline">{p.website}</a>],
                ["Address", [p.address, p.city].filter(Boolean).join(", ")],
                ["Found via", p.source],
                ["Added", fmtDate(p.created_at.slice(0, 10))],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k as string} className="grid grid-cols-[7.5rem_1fr] gap-2">
                    <dt className="text-stone-500">{k}</dt>
                    <dd className="min-w-0 text-stone-900">{v}</dd>
                  </div>
                ))}
            </dl>
            {p.notes && <p className="mt-4 whitespace-pre-line border-t border-stone-100 pt-3 text-sm text-stone-700">{p.notes}</p>}
          </Card>

          <Card title="Status">
            <form action={setProspectStatus} className="flex gap-2">
              <input type="hidden" name="id" value={p.id} />
              <select name="status" defaultValue={p.status} className="input">
                {PROSPECT_STATUSES.filter((s) => s.value !== "converted" || p.customer_id).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <SubmitButton className="btn-ghost">Set</SubmitButton>
            </form>
            <div className="mt-4 border-t border-stone-100 pt-4">
              {p.customer_id ? (
                <Link href={`/customers/${p.customer_id}`} className="btn-dark w-full justify-center">
                  Open customer profile
                </Link>
              ) : (
                <form action={convertProspect}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton className="btn-dark w-full justify-center" message={`Add ${name} to your customers? Their details are copied into a new customer profile.`}>
                    They signed on: make customer
                  </ConfirmButton>
                </form>
              )}
            </div>
          </Card>

          <form action={deleteProspect} className="text-right">
            <input type="hidden" name="id" value={p.id} />
            <ConfirmButton className="text-sm text-stone-400 hover:text-rose-700" message={`Delete ${name} and their call history from the cold-call list?${p.customer_id ? " Their customer profile is kept." : ""}`}>
              Delete from list
            </ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
