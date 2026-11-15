import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { saveProspect } from "@/lib/actions";

type P = {
  id?: number;
  company?: string;
  contact_name?: string;
  title?: string;
  phone?: string;
  alt_phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  units?: string;
  source?: string;
  notes?: string;
  follow_up_on?: string | null;
};

/** Add or edit a property manager on the cold-call list. */
export function ProspectForm({ p, cancelHref }: { p?: P; cancelHref: string }) {
  return (
    <ActionForm action={saveProspect} className="space-y-4">
      {p?.id && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company">
          <input className="input" name="company" defaultValue={p?.company} placeholder="e.g. Greenview Property Management" autoFocus={!p?.id} />
        </Field>
        <Field label="Contact name">
          <input className="input" name="contact_name" defaultValue={p?.contact_name} placeholder="e.g. Sarah Lee" />
        </Field>
        <Field label="Their role">
          <input className="input" name="title" defaultValue={p?.title} placeholder="e.g. Property manager, Superintendent" />
        </Field>
        <Field label="How many units / buildings">
          <input className="input" name="units" defaultValue={p?.units} placeholder="e.g. 3 buildings, 240 units" />
        </Field>
        <Field label="Phone">
          <input className="input" name="phone" type="tel" defaultValue={p?.phone} />
        </Field>
        <Field label="Other phone">
          <input className="input" name="alt_phone" type="tel" defaultValue={p?.alt_phone} />
        </Field>
        <Field label="Email">
          <input className="input" name="email" type="email" defaultValue={p?.email} />
        </Field>
        <Field label="Website">
          <input className="input" name="website" defaultValue={p?.website} placeholder="example.com" />
        </Field>
        <Field label="Address">
          <input className="input" name="address" defaultValue={p?.address} />
        </Field>
        <Field label="City">
          <input className="input" name="city" defaultValue={p?.city} />
        </Field>
        <Field label="Where you found them">
          <input className="input" name="source" defaultValue={p?.source} placeholder="e.g. Google Maps, referral, LinkedIn" />
        </Field>
        <Field label="Call them on" hint="Leave blank if you haven't planned a call yet.">
          <input className="input" name="follow_up_on" type="date" defaultValue={p?.follow_up_on ?? ""} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea className="input min-h-24" name="notes" defaultValue={p?.notes} placeholder="Anything useful: buildings they manage, who handles repairs, current appliance company…" />
      </Field>
      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-ghost">
          Cancel
        </Link>
        <SubmitButton>{p?.id ? "Save" : "Add to list"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
