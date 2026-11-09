"use client";

/** Header checkbox that ticks every row checkbox with the given name in the same form. */
export function SelectAll({ name }: { name: string }) {
  return (
    <input
      type="checkbox"
      aria-label="Select all"
      className="h-4 w-4 accent-amber-500"
      onChange={(e) => {
        e.currentTarget.form?.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name="${name}"]`).forEach((cb) => (cb.checked = e.currentTarget.checked));
      }}
    />
  );
}
