import { saveMessagingSettings, saveReviewSettings, sendTestMessage } from "@/lib/actions";
import { emailConfigured, smsConfigured } from "@/lib/messaging";
import { ActionForm, SubmitButton } from "./forms";
import { Card, Field } from "./ui";

const Pill = ({ on }: { on: boolean }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${on ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>{on ? "Ready" : "Not set up"}</span>
);

export function MessagingCard({ s }: { s: Record<string, string> }) {
  const sms = smsConfigured(s);
  const email = emailConfigured(s);
  return (
    <div id="messaging" className="mt-6 scroll-mt-6">
      <Card title="Texts & email">
        <p className="text-sm text-stone-600">
          Used to send invoices, receipts and Google review requests automatically. Until these are set up, the CRM opens your phone&apos;s own texting or email app with the message already written, so you can still send it with one tap.
        </p>
        <ActionForm action={saveMessagingSettings} className="mt-5 space-y-6">
          <section>
            <div className="mb-2 flex items-center gap-2"><h3 className="text-sm font-bold">Texting (Twilio)</h3><Pill on={sms} /></div>
            <p className="mb-3 text-xs text-stone-500">
              Sign up at twilio.com, buy a local 613 number (about US$1–2/month plus roughly a cent per text), then copy the Account SID and Auth Token from the Twilio console.
              Customers who reply STOP are blocked automatically.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Account SID"><input className="input" name="twilio_sid" defaultValue={s.twilio_sid} autoComplete="off" placeholder="AC…" /></Field>
              <Field label="Auth token"><input className="input" type="password" name="twilio_token" autoComplete="off" placeholder={s.twilio_token ? "•••••••• (saved)" : ""} /></Field>
              <Field label="Your Twilio number"><input className="input" name="twilio_from" defaultValue={s.twilio_from} placeholder="+16135551234" /></Field>
            </div>
          </section>
          <section>
            <div className="mb-2 flex items-center gap-2"><h3 className="text-sm font-bold">Email (your mailbox)</h3><Pill on={email} /></div>
            <p className="mb-3 text-xs text-stone-500">
              Gmail / Google Workspace: server <code>smtp.gmail.com</code>, port <code>465</code>, your full email, and an <b>app password</b> (Google Account → Security → 2-Step Verification → App passwords).
              Outlook / Microsoft 365: <code>smtp.office365.com</code>, port <code>587</code>.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="SMTP server"><input className="input" name="smtp_host" defaultValue={s.smtp_host} placeholder="smtp.gmail.com" /></Field>
              <Field label="Port"><input className="input" name="smtp_port" defaultValue={s.smtp_port} inputMode="numeric" /></Field>
              <Field label="Send as name"><input className="input" name="smtp_from_name" defaultValue={s.smtp_from_name} /></Field>
              <Field label="Email address (login)"><input className="input" name="smtp_user" defaultValue={s.smtp_user} placeholder="service@superfixmech.ca" autoComplete="off" /></Field>
              <Field label="Password / app password"><input className="input" type="password" name="smtp_pass" autoComplete="off" placeholder={s.smtp_pass ? "•••••••• (saved)" : ""} /></Field>
            </div>
          </section>
          <div className="flex justify-end"><SubmitButton>Save</SubmitButton></div>
        </ActionForm>

        {(sms || email) && (
          <ActionForm action={sendTestMessage} className="mt-6 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4">
            <Field label="Send a test">
              <select className="input" name="channel" defaultValue={sms ? "sms" : "email"}>
                {sms && <option value="sms">Text to</option>}
                {email && <option value="email">Email to</option>}
              </select>
            </Field>
            <input className="input max-w-xs" name="to" placeholder="Your mobile # or email" aria-label="Send test to" />
            <SubmitButton className="btn-ghost" pendingText="Sending…">Send test</SubmitButton>
          </ActionForm>
        )}
      </Card>
    </div>
  );
}

export function ReviewCard({ s }: { s: Record<string, string> }) {
  return (
    <div id="reviews" className="mt-6 scroll-mt-6">
      <Card title="Google reviews">
        <ActionForm action={saveReviewSettings} className="space-y-4">
          <Field label="Your Google review link" hint="In Google Business Profile (search “SuperFix Mechanical” on Google while signed in) click “Ask for reviews” and copy the link, e.g. https://g.page/r/…/review">
            <input className="input" name="google_review_url" defaultValue={s.google_review_url} placeholder="https://g.page/r/XXXXXXXX/review" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="review_auto" defaultChecked={s.review_auto === "1"} className="h-4 w-4 accent-amber-500" />
            Automatically ask for a review when a job is marked finished
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Wait before sending (minutes)" hint="Texts are never sent between 8pm and 9am; they wait until morning.">
              <input className="input" name="review_delay_minutes" inputMode="numeric" defaultValue={s.review_delay_minutes} />
            </Field>
            <Field label="Don't ask the same customer again for (days)">
              <input className="input" name="review_cooldown_days" inputMode="numeric" defaultValue={s.review_cooldown_days} />
            </Field>
          </div>
          <details className="rounded-lg bg-stone-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Edit message wording</summary>
            <p className="mt-2 text-xs text-stone-500">
              You can use {"{first_name}"}, {"{company}"}, {"{phone}"}, {"{review_link}"}, and on invoices/receipts {"{amount}"}, {"{invoice_number}"}, {"{method}"}, {"{link}"}.
            </p>
            <div className="mt-3 grid gap-3">
              <Field label="Review request – text"><textarea className="input" name="tpl_review_sms" defaultValue={s.tpl_review_sms} /></Field>
              <Field label="Review request – email"><textarea className="input min-h-32" name="tpl_review_email" defaultValue={s.tpl_review_email} /></Field>
              <Field label="Invoice – text"><textarea className="input" name="tpl_invoice_sms" defaultValue={s.tpl_invoice_sms} /></Field>
              <Field label="Invoice – email"><textarea className="input min-h-32" name="tpl_invoice_email" defaultValue={s.tpl_invoice_email} /></Field>
              <Field label="Receipt – text"><textarea className="input" name="tpl_receipt_sms" defaultValue={s.tpl_receipt_sms} /></Field>
              <Field label="Receipt – email"><textarea className="input min-h-32" name="tpl_receipt_email" defaultValue={s.tpl_receipt_email} /></Field>
            </div>
          </details>
          <div className="flex justify-end"><SubmitButton>Save</SubmitButton></div>
        </ActionForm>
      </Card>
    </div>
  );
}
