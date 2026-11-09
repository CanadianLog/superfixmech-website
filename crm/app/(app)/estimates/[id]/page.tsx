import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { customerAddresses, getCustomer, getEstimate, lineItems, listPricebook, taxRate, timeZone } from "@/lib/data";
import { customerName, fmtStamp } from "@/lib/format";
import { appOrigin } from "@/lib/origin";
import { convertEstimateToJob, deleteEstimate, setEstimateStatus } from "@/lib/actions";
import { PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmButton, CopyButton, SubmitButton } from "@/components/forms";
import { EstimateForm } from "@/components/estimate-form";

export default async function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(["admin", "dispatcher"]);
  const est = getEstimate(Number((await params).id));
  if (!est) notFound();
  const c = getCustomer(est.customer_id)!;
  const locked = est.status === "converted";
  const statusBtn = (status: string, label: string, cls = "btn-ghost") => (
    <form action={setEstimateStatus}>
      <input type="hidden" name="id" value={est.id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={cls} pendingText="…">{label}</SubmitButton>
    </form>
  );
  const portal = `/p/e/${est.token}`;
  const mailto = `mailto:${c.email}?subject=${encodeURIComponent(`Your estimate #${est.number} from ${getSettings().company_name}`)}&body=${encodeURIComponent(`Hi ${c.first_name || ""},\n\nYou can review and approve your estimate here:\n${await appOrigin()}${portal}\n\nThank you!`)}`;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Estimate #{est.number} <StatusBadge status={est.status} /></span>}
        subtitle={<><Link className="link" href={`/customers/${c.id}`}>{customerName(c)}</Link>{est.responded_at && ` · responded ${fmtStamp(est.responded_at, timeZone())}`}</>}
        back={{ href: "/estimates", label: "Estimates" }}
        actions={
          <>
            <Link href={portal} target="_blank" className="btn-ghost">Customer view</Link>
            <CopyButton text={portal} label="Copy customer link" />
            {c.email && <a href={mailto} className="btn-ghost">Email</a>}
            {est.status === "draft" && statusBtn("sent", "Mark sent")}
            {(est.status === "sent" || est.status === "draft") && statusBtn("approved", "Mark approved")}
            {(est.status === "sent" || est.status === "draft") && statusBtn("declined", "Mark declined")}
            {est.status === "declined" && statusBtn("sent", "Reopen")}
            {est.job_id ? (
              <Link href={`/jobs/${est.job_id}`} className="btn-primary">Open job</Link>
            ) : (
              est.status !== "declined" && (
                <form action={convertEstimateToJob}>
                  <input type="hidden" name="id" value={est.id} />
                  <SubmitButton pendingText="Converting…">Convert to job</SubmitButton>
                </form>
              )
            )}
          </>
        }
      />
      {locked && <p className="mb-4 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-900">This estimate was converted to a job and is now read-only.</p>}
      <EstimateForm
        estimate={est}
        customerId={c.id}
        addresses={customerAddresses(c.id)}
        pricebook={listPricebook()}
        taxRate={taxRate()}
        items={lineItems("estimate", est.id).map((i) => ({ ...i, taxable: !!i.taxable }))}
        readOnly={locked}
      />
      {!locked && (
        <form action={deleteEstimate} className="mt-10 border-t border-stone-200 pt-6">
          <input type="hidden" name="id" value={est.id} />
          <ConfirmButton message={`Delete estimate #${est.number}?`}>Delete estimate</ConfirmButton>
        </form>
      )}
    </div>
  );
}
