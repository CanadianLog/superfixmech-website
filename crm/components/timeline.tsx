import { addNote } from "@/lib/actions";
import { fmtStamp } from "@/lib/format";
import type { Activity } from "@/lib/types";
import { SubmitButton } from "./forms";
import { Card } from "./ui";

export function Timeline({ items, tz, customerId, jobId }: { items: Activity[]; tz: string; customerId?: number; jobId?: number }) {
  return (
    <Card title="Notes & activity">
      <form action={addNote} className="mb-4 space-y-2">
        {customerId && <input type="hidden" name="customer_id" value={customerId} />}
        {jobId && <input type="hidden" name="job_id" value={jobId} />}
        <textarea name="body" className="input" placeholder="Add a note…" required />
        <div className="flex justify-end">
          <SubmitButton className="btn-dark btn-sm">Add note</SubmitButton>
        </div>
      </form>
      <ol className="space-y-3">
        {items.map((a) => (
          <li key={a.id} className="flex gap-3 text-sm">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.kind === "note" ? "bg-amber-500" : a.kind === "payment" ? "bg-emerald-500" : a.kind === "portal" ? "bg-sky-500" : "bg-stone-300"}`} />
            <div className="min-w-0">
              <div className={a.kind === "note" ? "whitespace-pre-line text-stone-900" : "text-stone-600"}>{a.body}</div>
              <div className="text-xs text-stone-400">{[a.user_name, fmtStamp(a.created_at, tz)].filter(Boolean).join(" · ")}</div>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-stone-400">Nothing yet.</li>}
      </ol>
    </Card>
  );
}
