import { disconnectQbo, saveQboKeys, saveQboMapping, syncAllToQbo } from "@/lib/actions";
import { listItems, listTaxCodes, qboConfig } from "@/lib/quickbooks";
import { ActionForm, ConfirmButton, CopyButton, SubmitButton } from "./forms";
import { Card, Field } from "./ui";

const MESSAGES: Record<string, string> = {
  connected: "QuickBooks connected.",
  denied: "Connection was cancelled in QuickBooks.",
  bad_state: "The connection link expired. Please try again.",
  missing_keys: "Add your Client ID and Client Secret first.",
  missing_code: "QuickBooks didn't send back an authorization code. Please try again.",
};

export async function QuickBooksCard({ origin, status }: { origin: string; status?: string }) {
  const c = qboConfig();
  const redirectUri = `${origin}/api/qbo/callback`;

  let lists: { taxCodes: { Id: string; Name: string }[]; items: { Id: string; Name: string; Type: string }[] } | null = null;
  let listError = "";
  if (c.connected) {
    try {
      const [taxCodes, items] = await Promise.all([listTaxCodes(), listItems()]);
      lists = { taxCodes, items };
    } catch (e) {
      listError = (e as Error).message;
    }
  }
  const mapped = !!(c.itemId && c.taxCodes[13] && c.taxCodes[5] && c.taxCodes[0]);

  return (
    <div id="quickbooks" className="mt-6 scroll-mt-6">
      <Card
        title="QuickBooks Online"
        actions={
          c.connected ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Connected{c.companyName ? ` · ${c.companyName}` : ""}</span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">Not connected</span>
          )
        }
      >
        {status && (
          <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${status === "connected" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
            {MESSAGES[status] ?? status}
          </p>
        )}
        <p className="text-sm text-stone-600">
          Sends customers, invoices and payments from the CRM to QuickBooks so your books stay up to date. Nothing in QuickBooks is ever deleted by
          the CRM.
        </p>

        {!c.connected && (
          <>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-stone-600">
              <li>
                Sign in at <a className="link" href="https://developer.intuit.com/app/developer/dashboard" target="_blank" rel="noreferrer">developer.intuit.com</a> with your QuickBooks login and create an app (choose <b>QuickBooks Online and Payments</b>, scope <b>Accounting</b>).
              </li>
              <li>
                Under <b>Keys &amp; credentials</b> (Production), add this Redirect URI:
                <span className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="break-all rounded bg-stone-100 px-2 py-1 text-xs">{redirectUri}</code>
                  <CopyButton text={redirectUri} label="Copy" />
                </span>
              </li>
              <li>Paste the Client ID and Client Secret below, save, then click Connect.</li>
            </ol>
            {c.fromEnv ? (
              <p className="mt-4 text-sm text-stone-500">Keys are set by the server (QBO_CLIENT_ID / QBO_CLIENT_SECRET).</p>
            ) : (
              <ActionForm action={saveQboKeys} className="mt-4 grid gap-3 sm:grid-cols-3">
                <Field label="Client ID"><input className="input" name="qbo_client_id" defaultValue={c.clientId} autoComplete="off" /></Field>
                <Field label="Client secret"><input className="input" type="password" name="qbo_client_secret" placeholder={c.clientSecret ? "•••••••• (saved)" : ""} autoComplete="off" /></Field>
                <Field label="Environment">
                  <select className="input" name="qbo_env" defaultValue={c.env}>
                    <option value="production">Production (real books)</option>
                    <option value="sandbox">Sandbox (testing)</option>
                  </select>
                </Field>
                <div className="sm:col-span-3 flex flex-wrap justify-end gap-2">
                  <SubmitButton className="btn-ghost">Save keys</SubmitButton>
                  {c.clientId && c.clientSecret && <a href="/api/qbo/connect" className="btn-primary">Connect to QuickBooks</a>}
                </div>
              </ActionForm>
            )}
            {c.fromEnv && <a href="/api/qbo/connect" className="btn-primary mt-3">Connect to QuickBooks</a>}
          </>
        )}

        {c.connected && (
          <div className="mt-4 space-y-6">
            {listError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">{listError}</p>}
            {lists && (
              <ActionForm action={saveQboMapping} className="space-y-3">
                <p className="text-sm font-semibold">Match your CRM to your QuickBooks setup</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Post line items to product/service" hint="Usually “Services” or “Sales”.">
                    <select className="input" name="qbo_item_id" defaultValue={c.itemId}>
                      <option value="">Choose…</option>
                      {lists.items.map((i) => <option key={i.Id} value={i.Id}>{i.Name} ({i.Type})</option>)}
                    </select>
                  </Field>
                  {([[13, "HST 13% → tax code", "e.g. HST ON"], [5, "GST 5% → tax code", "e.g. GST"], [0, "No tax → tax code", "e.g. Exempt or Zero-rated"]] as const).map(([rate, label, hint]) => (
                    <Field key={rate} label={label} hint={hint}>
                      <select className="input" name={`qbo_tax_${rate}`} defaultValue={c.taxCodes[rate]}>
                        <option value="">Choose…</option>
                        {lists.taxCodes.map((t) => <option key={t.Id} value={t.Id}>{t.Name}</option>)}
                      </select>
                    </Field>
                  ))}
                </div>
                <div className="flex justify-end"><SubmitButton className="btn-dark">Save mapping</SubmitButton></div>
              </ActionForm>
            )}
            {mapped && (
              <ActionForm action={syncAllToQbo} className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                <p className="text-sm text-stone-600">Send every sent invoice (and its payments) that isn&apos;t in QuickBooks yet. Payments on invoices already in QuickBooks are sent automatically.</p>
                <SubmitButton className="btn-primary" pendingText="Sending…">Send unsynced invoices</SubmitButton>
              </ActionForm>
            )}
            <form action={disconnectQbo} className="border-t border-stone-100 pt-4">
              <ConfirmButton message="Disconnect QuickBooks? Nothing already in QuickBooks is removed.">Disconnect</ConfirmButton>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
