import { requireUser } from "@/lib/auth";
import { importHousecallPro } from "@/lib/actions";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";

export const metadata = { title: "Import from Housecall Pro" };

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-ink">{n}</span>
      <div className="text-sm">
        <div className="font-semibold text-stone-900">{title}</div>
        <div className="mt-0.5 text-stone-600">{children}</div>
      </div>
    </li>
  );
}

export default async function ImportPage() {
  await requireUser(["admin"]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Import from Housecall Pro" subtitle="Bring over your customers, job history and price book." back={{ href: "/settings", label: "Settings" }} />

      <Card title="1. Export from Housecall Pro">
        <ol className="space-y-4">
          <Step n={1} title="Customers">
            In Housecall Pro open <b>Customers</b> → <b>Actions</b> → <b>Export</b> → <b>Send file</b>. Housecall Pro emails you a CSV file (check spam if it
            hasn&apos;t arrived within an hour).
          </Step>
          <Step n={2} title="Jobs">
            Open <b>Jobs</b> → <b>Actions</b> → <b>Export</b> → <b>Send file</b>. Another CSV arrives by email. This brings over your job history, amounts and what was paid.
          </Step>
          <Step n={3} title="Price book (optional)">
            Open <b>Price book</b> and use <b>Export</b> for your services and materials. Parts are sorted into appliance types automatically when the category or name
            mentions the appliance (e.g. &ldquo;Dishwasher&rdquo;).
          </Step>
          <Step n={4} title="Add your technicians first">
            On the <b>Team</b> page, add each technician using the same name they had in Housecall Pro, so imported jobs get assigned to them.
          </Step>
        </ol>
        <p className="mt-4 text-xs text-stone-500">Only Housecall Pro admins can export. If you get an Excel (.xlsx) file, open it and save it as CSV first.</p>
      </Card>

      <Card title="2. Upload the files here" className="mt-6">
        <ActionForm action={importHousecallPro} className="space-y-4">
          {[
            ["customers", "Customers CSV"],
            ["jobs", "Jobs CSV"],
            ["pricebook", "Price book CSV"],
          ].map(([name, label]) => (
            <label key={name} className="block">
              <span className="label">{label}</span>
              <input type="file" name={name} accept=".csv,.tsv,.txt,text/csv" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
            </label>
          ))}
          <ul className="list-disc space-y-1 pl-5 text-xs text-stone-500">
            <li>Upload one file or all three. Customers are matched by Housecall Pro ID, email, phone or name, so nobody gets duplicated.</li>
            <li>Importing the same file again is safe: anything already imported is skipped.</li>
            <li>Completed jobs with an amount get an invoice and their recorded payment, so customer balances carry over. Each job keeps Housecall Pro&apos;s line-item text in its description.</li>
          </ul>
          <div className="flex justify-end">
            <SubmitButton pendingText="Importing… this can take a minute">Import</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
