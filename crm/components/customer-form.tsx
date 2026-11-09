import { saveCustomer } from "@/lib/actions";
import type { Customer } from "@/lib/types";
import { ActionForm, SubmitButton } from "./forms";
import { Card, Field } from "./ui";
import { AddressSearch } from "./address-search";

export const LEAD_SOURCES = ["Google", "Website", "Online booking", "Referral", "Facebook", "Instagram", "HomeStars", "Repeat customer", "Other"];

export function CustomerForm({ customer, addressSearch = false }: { customer?: Customer; addressSearch?: boolean }) {
  const c = customer;
  return (
    <ActionForm action={saveCustomer} className="space-y-6">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Card title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><input className="input" name="first_name" defaultValue={c?.first_name} autoFocus /></Field>
          <Field label="Last name"><input className="input" name="last_name" defaultValue={c?.last_name} /></Field>
          <Field label="Company (optional)" className="sm:col-span-2"><input className="input" name="company" defaultValue={c?.company} /></Field>
          <Field label="Mobile phone"><input className="input" type="tel" name="phone" defaultValue={c?.phone} /></Field>
          <Field label="Other phone"><input className="input" type="tel" name="alt_phone" defaultValue={c?.alt_phone} /></Field>
          <Field label="Email" className="sm:col-span-2"><input className="input" type="email" name="email" defaultValue={c?.email} /></Field>
        </div>
      </Card>
      {!c && (
        <Card title="Service address">
          <div className="grid gap-4 sm:grid-cols-6">
            {addressSearch && <AddressSearch className="sm:col-span-6" />}
            <Field label="Street" className="sm:col-span-4"><input className="input" name="street" autoComplete="street-address" /></Field>
            <Field label="Unit" className="sm:col-span-2"><input className="input" name="unit" /></Field>
            <Field label="City" className="sm:col-span-3"><input className="input" name="city" defaultValue="Ottawa" /></Field>
            <Field label="Province" className="sm:col-span-1"><input className="input" name="province" defaultValue="ON" /></Field>
            <Field label="Postal code" className="sm:col-span-2"><input className="input" name="postal_code" /></Field>
          </div>
        </Card>
      )}
      <Card title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lead source">
            <input className="input" name="lead_source" list="lead-sources" defaultValue={c?.lead_source} />
            <datalist id="lead-sources">{LEAD_SOURCES.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <Field label="Tags" hint="Comma separated, e.g. VIP, Landlord"><input className="input" name="tags" defaultValue={c?.tags} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="no_review" defaultChecked={!!c?.no_review} className="h-4 w-4 accent-amber-500" />
            Don&apos;t send this customer Google review requests
          </label>
          <Field label="Customer notes" className="sm:col-span-2"><textarea className="input" name="notes" defaultValue={c?.notes} placeholder="Gate code, pets, preferred contact times…" /></Field>
        </div>
      </Card>
      <div className="flex justify-end">
        <SubmitButton>{c ? "Save changes" : "Create customer"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
