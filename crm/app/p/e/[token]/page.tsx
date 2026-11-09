import { notFound } from "next/navigation";
import { get, getSettings } from "@/lib/db";
import { getAddress, getCustomer, lineItems, rateFor, timeZone } from "@/lib/data";
import { fmtDate, fmtStamp } from "@/lib/format";
import { respondToEstimate } from "@/lib/actions";
import type { Estimate } from "@/lib/types";
import { DocumentView } from "@/components/document";
import { PrintButton, SubmitButton } from "@/components/forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your estimate", robots: { index: false } };

export default async function EstimatePortal({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ done?: string }> }) {
  const { token } = await params;
  const { done } = await searchParams;
  const est = get<Estimate>("SELECT * FROM estimates WHERE token = ?", token);
  if (!est) notFound();
  const customer = getCustomer(est.customer_id)!;
  const s = getSettings();
  const canRespond = est.status === "sent" || est.status === "draft";

  return (
    <DocumentView
      kind="Estimate"
      number={est.number}
      settings={s}
      customer={customer}
      address={getAddress(est.address_id)}
      items={lineItems("estimate", est.id)}
      taxRate={rateFor("estimate", est.id)}
      message={[est.title, est.message].filter(Boolean).join("\n\n")}
      meta={[["Date", fmtDate(est.created_at)], ...(est.valid_until ? [["Valid until", fmtDate(est.valid_until)] as [string, string]] : [])]}
    >
      <div className="no-print mt-10 border-t border-stone-200 pt-6">
        {done && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Thanks! We&apos;ve received your response and will be in touch shortly.</p>}
        {canRespond ? (
          <form action={respondToEstimate} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <label className="block max-w-sm">
              <span className="label">Type your full name to sign</span>
              <input className="input" name="signature" autoComplete="name" />
            </label>
            <div className="flex flex-wrap gap-2">
              <SubmitButton name="decision" value="approved" pendingText="Sending…">Approve estimate</SubmitButton>
              <SubmitButton name="decision" value="declined" className="btn-ghost" pendingText="Sending…">Decline</SubmitButton>
              <PrintButton />
            </div>
            <p className="text-xs text-stone-500">Questions? Call {s.company_phone} or email {s.company_email}.</p>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>
              {est.status === "declined" ? "You declined this estimate" : "You approved this estimate"}
              {est.responded_at ? ` on ${fmtStamp(est.responded_at, timeZone())}` : ""}. Call {s.company_phone} with any questions.
            </span>
            <PrintButton />
          </div>
        )}
      </div>
    </DocumentView>
  );
}
