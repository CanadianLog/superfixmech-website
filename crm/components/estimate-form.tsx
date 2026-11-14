import Link from "next/link";
import { saveEstimate } from "@/lib/actions";
import { addressLine } from "@/lib/format";
import type { Address, Estimate, LineItemInput, PricebookItem } from "@/lib/types";
import { ActionForm, SubmitButton } from "./forms";
import { Card, Field } from "./ui";
import { LineItemsEditor } from "./line-items-editor";

export function EstimateForm({
  customerId,
  addresses,
  pricebook,
  taxRate,
  estimate,
  items = [],
  readOnly = false,
  suppliers = [],
}: {
  customerId: number;
  addresses: Address[];
  pricebook: PricebookItem[];
  taxRate: number;
  estimate?: Estimate;
  items?: LineItemInput[];
  readOnly?: boolean;
  suppliers?: string[];
}) {
  return (
    <ActionForm action={saveEstimate} className="space-y-6">
      {estimate && <input type="hidden" name="id" value={estimate.id} />}
      <input type="hidden" name="customer_id" value={customerId} />
      <Card title="Estimate">
        <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2"><input className="input" name="title" defaultValue={estimate?.title} placeholder="e.g. Replace dishwasher drain pump" /></Field>
          <Field label="Service address">
            <select className="input" name="address_id" defaultValue={estimate?.address_id ?? addresses[0]?.id ?? ""}>
              <option value="">—</option>
              {addresses.map((a) => <option key={a.id} value={a.id}>{addressLine(a)}</option>)}
            </select>
          </Field>
          <Field label="Valid until"><input className="input" type="date" name="valid_until" defaultValue={estimate?.valid_until ?? ""} /></Field>
          <Field label="Message to customer" className="sm:col-span-2"><textarea className="input" name="message" defaultValue={estimate?.message} placeholder="Scope of work, warranty, what's included…" /></Field>
        </fieldset>
      </Card>
      <Card title="Line items">
        <LineItemsEditor initial={items} pricebook={pricebook} taxRate={estimate?.tax_rate ?? taxRate} readOnly={readOnly} suppliers={suppliers} />
      </Card>
      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Link href={estimate ? `/estimates/${estimate.id}` : "/estimates"} className="btn-ghost">Cancel</Link>
          <SubmitButton>{estimate ? "Save estimate" : "Create estimate"}</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
