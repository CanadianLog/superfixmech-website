import Link from "next/link";
import { requireUser, isOffice } from "@/lib/auth";
import { jobsInRange, listTechs, today, unscheduledJobs, type JobRow } from "@/lib/data";
import { addDays, customerName, fmtDate, fmtTime, minutesOfDay, weekStart } from "@/lib/format";
import { quickSchedule } from "@/lib/actions";
import { Card, PageHeader, StatusBadge } from "@/components/ui";

export const metadata = { title: "Schedule" };

const DAY_START = 7 * 60;
const DAY_END = 20 * 60;
const PX_PER_MIN = 1;

function who(j: JobRow) {
  return customerName({ first_name: j.customer_first, last_name: j.customer_last, company: j.customer_company });
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string; view?: string; tech?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const now = today();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : now;
  const view = sp.view === "day" ? "day" : "week";
  const office = isOffice(user);
  const techFilter = office ? (sp.tech ? Number(sp.tech) : undefined) : user.id;
  const techs = listTechs();

  const from = view === "day" ? date : weekStart(date);
  const days = view === "day" ? 1 : 7;
  const jobs = jobsInRange(`${from}T00:00`, `${addDays(from, days)}T00:00`, techFilter);
  const step = view === "day" ? 1 : 7;
  const qs = (d: string, v = view) => `/schedule?date=${d}&view=${v}${sp.tech ? `&tech=${sp.tech}` : ""}`;

  const title =
    view === "day"
      ? fmtDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : `${fmtDate(from, { year: undefined })} – ${fmtDate(addDays(from, 6))}`;

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={title}
        actions={
          <>
            <div className="flex overflow-hidden rounded-lg border border-stone-300 bg-white text-sm">
              <Link href={qs(date, "day")} className={`px-3 py-2 font-semibold ${view === "day" ? "bg-stone-900 text-white" : "text-stone-700"}`}>Day</Link>
              <Link href={qs(date, "week")} className={`px-3 py-2 font-semibold ${view === "week" ? "bg-stone-900 text-white" : "text-stone-700"}`}>Week</Link>
            </div>
            <Link href={qs(addDays(date, -step))} className="btn-ghost" aria-label="Previous">←</Link>
            <Link href={qs(now)} className="btn-ghost">Today</Link>
            <Link href={qs(addDays(date, step))} className="btn-ghost" aria-label="Next">→</Link>
            {office && <Link href={`/jobs/new`} className="btn-primary">+ New job</Link>}
          </>
        }
      />

      {office && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/schedule?date=${date}&view=${view}`} className={`rounded-full px-3 py-1 ring-1 ${!sp.tech ? "bg-stone-900 text-white ring-stone-900" : "bg-white ring-stone-300"}`}>Everyone</Link>
          {techs.map((t) => (
            <Link key={t.id} href={`/schedule?date=${date}&view=${view}&tech=${t.id}`} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ring-1 ${sp.tech === String(t.id) ? "bg-stone-900 text-white ring-stone-900" : "bg-white ring-stone-300"}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />{t.name}
            </Link>
          ))}
        </div>
      )}

      <div className={`grid gap-6 ${office ? "2xl:grid-cols-[1fr_320px]" : ""}`}>
        {view === "week" ? <WeekView from={from} jobs={jobs} now={now} office={office} qs={qs} /> : <DayView date={date} jobs={jobs} techs={office && !sp.tech ? techs : techs.filter((t) => t.id === techFilter)} />}
        {office && <UnscheduledPanel back={qs(date)} techs={techs} defaultDate={date} />}
      </div>
    </>
  );
}

function WeekView({ from, jobs, now, office, qs }: { from: string; jobs: JobRow[]; now: string; office: boolean; qs: (d: string, v?: string) => string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((d) => {
        const dayJobs = jobs.filter((j) => j.scheduled_start?.startsWith(d));
        return (
          <div key={d} className={`card flex min-h-40 flex-col ${d === now ? "ring-2 ring-amber-400" : ""}`}>
            <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
              <Link href={qs(d, "day")} className="text-sm font-bold hover:underline">
                {fmtDate(d, { weekday: "short", month: "short", day: "numeric", year: undefined })}
              </Link>
              {office && <Link href={`/jobs/new?date=${d}`} className="text-stone-400 hover:text-stone-900" aria-label="Add job this day">+</Link>}
            </div>
            <div className="flex-1 space-y-2 p-2">
              {dayJobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="block rounded-md border-l-4 bg-stone-50 px-2 py-1.5 text-xs hover:bg-amber-50" style={{ borderColor: j.tech_color ?? "#a8a29e" }}>
                  <div className="font-semibold text-stone-900">{fmtTime(j.scheduled_start)}–{fmtTime(j.scheduled_end)}</div>
                  <div className="truncate">{j.title}</div>
                  <div className="truncate text-stone-500">{who(j)}</div>
                  {j.status !== "scheduled" && <div className="mt-1"><StatusBadge status={j.status} /></div>}
                </Link>
              ))}
              {dayJobs.length === 0 && <div className="py-4 text-center text-xs text-stone-300">—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ date, jobs, techs }: { date: string; jobs: JobRow[]; techs: { id: number; name: string; color: string }[] }) {
  const lanes: { id: number | null; name: string; color: string }[] = [...techs];
  if (jobs.some((j) => !j.tech_id)) lanes.push({ id: null, name: "Unassigned", color: "#a8a29e" });
  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i);
  const height = (DAY_END - DAY_START) * PX_PER_MIN;
  return (
    <Card pad={false} className="overflow-x-auto">
      <div className="flex min-w-max">
        <div className="sticky left-0 z-10 w-14 shrink-0 bg-white pt-10">
          <div className="relative" style={{ height }}>
            {hours.map((h) => (
              <div key={h} className="absolute right-2 -translate-y-2 text-xs text-stone-400" style={{ top: (h * 60 - DAY_START) * PX_PER_MIN }}>
                {h % 12 === 0 ? 12 : h % 12}{h < 12 ? "a" : "p"}
              </div>
            ))}
          </div>
        </div>
        {lanes.map((lane) => {
          const laneJobs = jobs.filter((j) => j.tech_id === lane.id);
          return (
            <div key={lane.id ?? "none"} className="w-56 shrink-0 border-l border-stone-100">
              <div className="flex h-10 items-center gap-2 border-b border-stone-100 px-3 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: lane.color }} />
                {lane.name}
                <span className="ml-auto text-xs font-normal text-stone-400">{laneJobs.length}</span>
              </div>
              <div className="relative" style={{ height }}>
                {hours.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-stone-100" style={{ top: (h * 60 - DAY_START) * PX_PER_MIN }} />
                ))}
                {laneJobs.map((j) => {
                  const start = Math.max(minutesOfDay(j.scheduled_start!), DAY_START);
                  const end = Math.min(j.scheduled_end && j.scheduled_end.startsWith(date) ? minutesOfDay(j.scheduled_end) : start + 120, DAY_END);
                  return (
                    <Link
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      className="absolute inset-x-1 overflow-hidden rounded-md border-l-4 bg-white px-2 py-1 text-xs shadow-sm ring-1 ring-stone-200 hover:ring-amber-400"
                      style={{ top: (start - DAY_START) * PX_PER_MIN, height: Math.max((end - start) * PX_PER_MIN, 36), borderColor: lane.color, background: `${lane.color}14` }}
                    >
                      <div className="font-semibold">{fmtTime(j.scheduled_start)}–{fmtTime(j.scheduled_end)} · #{j.number}</div>
                      <div className="truncate">{j.title}</div>
                      <div className="truncate text-stone-500">{who(j)}{j.city ? ` · ${j.city}` : ""}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function UnscheduledPanel({ back, techs, defaultDate }: { back: string; techs: { id: number; name: string }[]; defaultDate: string }) {
  const jobs = unscheduledJobs();
  return (
    <Card title={`Unscheduled (${jobs.length})`} pad={false} className="self-start">
      <ul className="divide-y divide-stone-100">
        {jobs.map((j) => (
          <li key={j.id} className="space-y-2 px-4 py-3">
            <Link href={`/jobs/${j.id}`} className="block text-sm hover:underline">
              <span className="font-semibold">{j.title}</span> <span className="text-xs text-stone-400">#{j.number}</span>
              <div className="text-xs text-stone-500">{who(j)}{j.city ? ` · ${j.city}` : ""}</div>
            </Link>
            <form action={quickSchedule} className="grid grid-cols-2 gap-1.5">
              <input type="hidden" name="id" value={j.id} />
              <input type="hidden" name="back" value={back} />
              <input className="input px-2 py-1 text-xs" type="date" name="date" defaultValue={defaultDate} required aria-label="Date" />
              <input className="input px-2 py-1 text-xs" type="time" name="start_time" defaultValue="09:00" step={900} required aria-label="Start time" />
              <select className="input px-2 py-1 text-xs" name="tech_id" aria-label="Technician" defaultValue={j.tech_id ?? ""}>
                <option value="">Unassigned</option>
                {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="btn-dark btn-sm">Schedule</button>
            </form>
          </li>
        ))}
        {jobs.length === 0 && <li className="px-4 py-6 text-center text-sm text-stone-400">Nothing waiting.</li>}
      </ul>
    </Card>
  );
}
