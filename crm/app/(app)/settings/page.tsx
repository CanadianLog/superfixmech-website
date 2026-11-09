import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { get, getSettings } from "@/lib/db";
import { appOrigin } from "@/lib/origin";
import { TAX_OPTIONS } from "@/lib/format";
import { loadDemoData, rotateBookingKey, saveSettings } from "@/lib/actions";
import { Card, Field, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { QuickBooksCard } from "@/components/quickbooks-card";
import { AddressSearchCard, MessagingCard, ReviewCard, WebsiteCard } from "@/components/messaging-cards";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ qbo?: string }> }) {
  const { qbo } = await searchParams;
  await requireUser(["admin"]);
  const s = getSettings();
  const origin = await appOrigin();
  const empty = (get<{ n: number }>("SELECT COUNT(*) AS n FROM customers")?.n ?? 0) === 0;
  const snippet = `fetch("${origin}/api/public/booking", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    key: "${s.booking_api_key || "GENERATE_A_KEY_FIRST"}",
    first_name: "Jane", last_name: "Doe",
    phone: "613-555-0100", email: "jane@example.com",
    street: "1 Main St", city: "Ottawa", postal_code: "K1A 0A1",
    appliance: "Dishwasher", brand: "Bosch",
    issue: "Not draining",
    preferred_date: "2026-11-12", preferred_time: "morning"
  })
});`;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Settings" actions={<Link href="/import" className="btn-ghost">Import from Housecall Pro</Link>} />
      <ActionForm action={saveSettings} className="space-y-6">
        <Card title="Company (shown on estimates and invoices)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name"><input className="input" name="company_name" defaultValue={s.company_name} /></Field>
            <Field label="Phone"><input className="input" name="company_phone" defaultValue={s.company_phone} /></Field>
            <Field label="Email"><input className="input" name="company_email" defaultValue={s.company_email} /></Field>
            <Field label="Website"><input className="input" name="company_website" defaultValue={s.company_website} /></Field>
            <Field label="Address" className="sm:col-span-2"><input className="input" name="company_address" defaultValue={s.company_address} /></Field>
          </div>
        </Card>
        <Card title="Tax & billing">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Default tax" hint="You can change it on each job, estimate and invoice.">
              <select className="input" name="tax_rate" defaultValue={s.tax_rate}>
                {TAX_OPTIONS.map((t) => <option key={t.rate} value={t.rate}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="HST / GST number"><input className="input" name="tax_number" defaultValue={s.tax_number} /></Field>
            <Field label="Invoice due in (days)" hint="0 = due on receipt"><input className="input" name="invoice_terms_days" inputMode="numeric" defaultValue={s.invoice_terms_days} /></Field>
            <Field label="Estimates valid for (days)"><input className="input" name="estimate_valid_days" inputMode="numeric" defaultValue={s.estimate_valid_days} /></Field>
            <Field label="Time zone"><input className="input" name="time_zone" defaultValue={s.time_zone} /></Field>
            <Field label="Default invoice note" className="sm:col-span-3"><textarea className="input" name="invoice_footer" defaultValue={s.invoice_footer} /></Field>
          </div>
        </Card>
        <div className="flex justify-end"><SubmitButton>Save settings</SubmitButton></div>
      </ActionForm>

      <MessagingCard s={s} />
      <ReviewCard s={s} />
      <AddressSearchCard s={s} fromEnv={!!process.env.GOOGLE_MAPS_API_KEY} />
      <WebsiteCard s={s} origin={origin} />
      <QuickBooksCard origin={origin} status={qbo} />

      <Card title="Website booking requests" className="mt-6">
        <p className="text-sm text-stone-600">
          Your website (or any form tool) can send booking requests straight into the CRM. Each request creates or matches a customer and adds an
          <b> unscheduled job</b> tagged &ldquo;Online booking&rdquo;, ready to dispatch.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code id="booking-key" className="rounded bg-stone-100 px-2 py-1 text-sm">{s.booking_api_key || "No key yet"}</code>
          <form action={rotateBookingKey}><button className="btn-ghost btn-sm">{s.booking_api_key ? "Generate new key" : "Generate key"}</button></form>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold">Example request</summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-stone-900 p-4 text-xs text-stone-100">{snippet}</pre>
          <p className="mt-2 text-xs text-stone-500">Plain HTML forms work too: POST form fields with the same names to the same URL and add a hidden <code>redirect</code> field with the page to send people to afterwards.</p>
        </details>
      </Card>

      {empty && (
        <Card title="Sample data" className="mt-6">
          <form action={loadDemoData} className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">Load sample customers, technicians, jobs, estimates and invoices to try things out.</p>
            <button className="btn-ghost">Load sample data</button>
          </form>
        </Card>
      )}
    </div>
  );
}
