import { ConfirmButton } from "./forms";
import { SelectAll } from "./select-all";

/** "Select all" + "Delete selected" strip for list pages (admins only). */
export function BulkDeleteBar({ kind, noun, warning, children }: { kind: string; noun: string; warning: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 bg-stone-50 px-4 py-2.5 text-sm">
      <label className="flex items-center gap-2 text-stone-600">
        <SelectAll name="ids" /> Select all
      </label>
      {children}
      <input type="hidden" name="kind" value={kind} />
      <span className="ml-auto" />
      <ConfirmButton name="op" value="delete" className="btn-danger btn-sm" message={`Delete the selected ${noun}? ${warning} This can't be undone.`}>
        Delete selected
      </ConfirmButton>
    </div>
  );
}
