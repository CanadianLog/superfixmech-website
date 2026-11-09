import Link from "next/link";
import { customerName, fmtSchedule, money } from "@/lib/format";
import type { JobRow } from "@/lib/data";
import { StatusBadge, TechDot } from "./ui";

export function JobList({ jobs, showTech = true }: { jobs: JobRow[]; showTech?: boolean }) {
  return (
    <ul className="divide-y divide-stone-100">
      {jobs.map((j) => (
        <li key={j.id}>
          <Link href={`/jobs/${j.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-amber-50/40">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: j.tech_color ?? "#d6d3d1" }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-stone-900">{j.title || "Job"}</span>
                <span className="text-xs text-stone-400">#{j.number}</span>
                <StatusBadge status={j.status} />
              </div>
              <div className="mt-0.5 truncate text-sm text-stone-600">
                {customerName({ first_name: j.customer_first, last_name: j.customer_last, company: j.customer_company })}
                {j.street && <span className="text-stone-400"> · {j.street}{j.city ? `, ${j.city}` : ""}</span>}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-stone-500">
                <span>{fmtSchedule(j.scheduled_start, j.scheduled_end)}</span>
                {showTech && <TechDot color={j.tech_color} name={j.tech_name} />}
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-stone-700">{money(j.total_cents)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
