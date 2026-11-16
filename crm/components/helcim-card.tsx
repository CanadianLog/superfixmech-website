import { saveHelcimSettings } from "@/lib/actions";
import { ActionForm, SubmitButton } from "./forms";
import { Card } from "./ui";

/** Settings → Card payments (Helcim). */
export function HelcimCard({ s, origin }: { s: Record<string, string>; origin: string }) {
  const on = !!s.helcim_api_token;
  return (
    <>
      <div id="payments" className="scroll-mt-6" />
      <Card
        title="Card payments (Helcim)"
        className="mt-6"
        actions={<span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${on ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>{on ? "Connected" : "Not set up"}</span>}
      >
        <ActionForm action={saveHelcimSettings} className="space-y-4 text-sm">
          <p className="text-stone-600">
            Charge cards right from an invoice or job, and let customers pay their invoice online. Each payment is recorded on the invoice automatically and also shows in Helcim with the same invoice number.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-stone-600">
            <li>In Helcim, go to <b>All Tools → Integrations → API Access Configuration</b> and click <b>New API Access</b>.</li>
            <li>
              Tick <b>“This API access will be used for HelcimPay.js”</b> (checkout integration), and add this checkout URL: <code className="rounded bg-stone-100 px-1 break-all">{origin}</code>
            </li>
            <li>
              Access restrictions: <b>General: Read</b>, <b>Settings: No access</b>, <b>Transaction Processing: Positive Transaction</b> (charges only, no refunds).
            </li>
            <li>Save, copy the API token Helcim shows you, and paste it below.</li>
          </ol>
          <label className="block">
            <span className="label">Helcim API token</span>
            <input className="input" type="password" name="helcim_api_token" autoComplete="off" placeholder={on ? "•••••••• (saved, leave blank to keep)" : "Paste your API token"} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="helcim_online" defaultChecked={s.helcim_online === "1"} className="h-4 w-4 accent-amber-500" />
            Show a <b>Pay by card</b> button on the invoice link customers get
          </label>
          {on && (
            <label className="flex items-center gap-2 text-stone-500">
              <input type="checkbox" name="remove_token" className="h-4 w-4 accent-rose-500" /> Disconnect Helcim (removes the saved token)
            </label>
          )}
          <SubmitButton pendingText="Checking…">Save &amp; test</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
