import { recordPayment, sendInvoice, sendReceipt, sendReviewNow, cancelReview } from "@/lib/actions";
import { centsToInput, money } from "@/lib/format";
import type { InvoiceRow } from "@/lib/data";
import type { JobMessage } from "@/lib/messaging";
import { ActionForm, SubmitButton } from "./forms";


export const PAY_METHODS = [
  { value: "e-transfer", label: "e-Transfer", icon: "⇄" },
  { value: "card", label: "Credit card", icon: "▭" },
  { value: "cash", label: "Cash", icon: "$" },
  { value: "cheque", label: "Cheque", icon: "✎" },
];

function ChannelBoxes({ prefix = "", phone, email, smsReady, emailReady }: { prefix?: string; phone: string; email: string; smsReady: boolean; emailReady: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <label className={`flex items-center gap-2 ${phone ? "" : "opacity-50"}`}>
        <input type="checkbox" name={`${prefix}sms`} defaultChecked={!!phone} disabled={!phone} className="h-4 w-4 accent-amber-500" />
        Text {phone ? <span className="text-stone-500">{phone}</span> : <span className="text-stone-400">(no mobile #)</span>}
        {phone && !smsReady && <span className="text-xs text-stone-400">· from your phone</span>}
      </label>
      <label className={`flex items-center gap-2 ${email ? "" : "opacity-50"}`}>
        <input type="checkbox" name={`${prefix}email`} defaultChecked={!!email} disabled={!email} className="h-4 w-4 accent-amber-500" />
        Email {email ? <span className="text-stone-500">{email}</span> : <span className="text-stone-400">(no email)</span>}
        {email && !emailReady && <span className="text-xs text-stone-400">· from your email app</span>}
      </label>
    </div>
  );
}

export function SendInvoiceForm({ invoice, phone, email, smsReady, emailReady }: { invoice: InvoiceRow; phone: string; email: string; smsReady: boolean; emailReady: boolean }) {
  return (
    <ActionForm action={sendInvoice} className="space-y-3">
      <input type="hidden" name="invoice_id" value={invoice.id} />
      <ChannelBoxes phone={phone} email={email} smsReady={smsReady} emailReady={emailReady} />
      <SubmitButton className="btn-dark w-full sm:w-auto" pendingText="Sending…">
        {invoice.status === "draft" ? "Send invoice" : "Send invoice again"}
      </SubmitButton>
    </ActionForm>
  );
}

export function PaymentForm({ invoice, phone, email, smsReady, emailReady, today }: { invoice: InvoiceRow; phone: string; email: string; smsReady: boolean; emailReady: boolean; today: string }) {
  return (
    <ActionForm action={recordPayment} className="space-y-4">
      <input type="hidden" name="invoice_id" value={invoice.id} />
      <fieldset>
        <legend className="label">How did they pay?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PAY_METHODS.map((m) => (
            <label key={m.value} className="cursor-pointer">
              <input type="radio" name="method" value={m.value} required className="peer sr-only" />
              <span className="flex flex-col items-center gap-1 rounded-xl border-2 border-stone-200 bg-white px-2 py-3 text-sm font-semibold text-stone-700 transition peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-stone-900 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-300 hover:border-stone-300">
                <span className="text-lg leading-none" aria-hidden>{m.icon}</span>
                {m.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block"><span className="label">Amount</span><input className="input" name="amount" inputMode="decimal" defaultValue={centsToInput(Math.max(0, invoice.balance_cents))} required /></label>
        <label className="block"><span className="label">Date</span><input className="input" type="date" name="paid_on" defaultValue={today} /></label>
        <label className="block"><span className="label">Reference (optional)</span><input className="input" name="reference" placeholder="Cheque #, e-Transfer ref, last 4…" /></label>
      </div>
      <div>
        <div className="label">Send receipt by</div>
        <ChannelBoxes prefix="receipt_" phone={phone} email={email} smsReady={smsReady} emailReady={emailReady} />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">Record payment & send receipt</SubmitButton>
    </ActionForm>
  );
}

export function ReviewStatus({ jobId, messages, tz, hasReviewLink }: { jobId: number; messages: JobMessage[]; tz: string; hasReviewLink: boolean }) {
  const review = messages.find((m) => m.kind === "review");
  const when = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  let line: React.ReactNode = "Not sent yet.";
  if (!hasReviewLink) line = "Add your Google review link in Settings → Google reviews to start asking for reviews.";
  else if (review?.status === "queued") line = <>Will be {review.channel === "sms" ? "texted" : "emailed"} to {review.recipient} <b>{when(review.send_after)}</b>.</>;
  else if (review?.status === "sent") line = <>Sent to {review.recipient} {review.sent_at ? when(review.sent_at) : ""}.</>;
  else if (review?.status === "failed") line = <span className="text-rose-700">Couldn&apos;t send: {review.error}</span>;
  else if (review?.status === "canceled") line = "Canceled.";
  return (
    <div className="space-y-2 text-sm">
      <p className="text-stone-600">{line}</p>
      {hasReviewLink && (
        <div className="flex flex-wrap gap-2">
          <ActionForm action={sendReviewNow}>
            <input type="hidden" name="job_id" value={jobId} />
            <SubmitButton className="btn-ghost btn-sm" pendingText="Sending…">{review?.status === "sent" ? "Send again" : "Send review request now"}</SubmitButton>
          </ActionForm>
          {review?.status === "queued" && (
            <form action={cancelReview}>
              <input type="hidden" name="job_id" value={jobId} />
              <button className="btn-ghost btn-sm">Don&apos;t send</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function PaidBadge({ invoice }: { invoice: InvoiceRow }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <span className="font-semibold">Paid in full — {money(invoice.total_cents)}</span>
    </div>
  );
}

export function ReceiptForm({ paymentId, phone, email, smsReady, emailReady, label = "Send receipt" }: { paymentId: number; phone: string; email: string; smsReady: boolean; emailReady: boolean; label?: string }) {
  return (
    <ActionForm action={sendReceipt} className="space-y-3">
      <input type="hidden" name="payment_id" value={paymentId} />
      <ChannelBoxes phone={phone} email={email} smsReady={smsReady} emailReady={emailReady} />
      <SubmitButton className="btn-dark w-full sm:w-auto" pendingText="Sending…">{label}</SubmitButton>
    </ActionForm>
  );
}
