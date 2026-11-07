import Link from "next/link";
import { requireUser, isOffice } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { addDays, fmtStamp, money } from "@/lib/format";
import { jobsInRange, listEstimates, listInvoices, paymentsBetween, timeZone, today, unscheduledJobs } from "@/lib/data";
import { loadDemoData } from "@/lib/actions";
import { Card, Empty, PageHeader, Stat } from "@/components/ui";
import { JobList } from "@/components/job-list";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const day = today();
  const tz = timeZone();
  const office = isOffice(user);
  const techFilter = office ? undefined : user.id;

  const todays = jobsInRange(`${day}T00:00`, `${addDays(day, 1)}T00:00`, techFilter);
  const upcoming = jobsInRange(`${addDays(day, 1)}T00:00`, `${addDays(day, 8)}T00:00`, techFilter);
  const hour = Number(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  const greeting = `Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}`;

  if (!office) {
    return (
      <>
        <PageHeader title={greeting} subtitle={`You have ${todays.length} job${todays.length === 1 ? "" : "s"} today.`} />
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Today" pad={false}>
            {todays.length ? <JobList jobs={todays} showTech={false} /> : <Empty>Nothing scheduled for you today.</Empty>}
          </Card>
          <Card title="Next 7 days" pad={false}>
            {upcoming.length ? <JobList jobs={upcoming} showTech={false} /> : <Empty>Nothing coming up yet.</Empty>}
          </Card>
        </div>
      </>
    );
  }

  const monthStart = `${day.slice(0, 7)}-01`;
  const collected = paymentsBetween(monthStart, addDays(day, 1)).reduce((s, p) => s + p.amount_cents, 0);
  const unpaid = listInvoices({ status: "unpaid" });
  const unpaidTotal = unpaid.reduce((s, i) => s + i.balance_cents, 0);
  const overdue = unpaid.filter((i) => i.display_status === "overdue").length;
  const openEstimates = listEstimates().filter((e) => e.status === "sent" || e.status === "approved");
  const unscheduled = unscheduledJobs();
  const customers = get<{ n: number }>("SELECT COUNT(*) AS n FROM customers")?.n ?? 0;
  const activity = all<{ id: number; body: string; created_at: string; user_name: string | null; customer_id: number | null; job_id: number | null; first_name: string | null; last_name: string | null }>(
    `SELECT a.id, a.body, a.created_at, a.customer_id, a.job_id, u.name AS user_name, c.first_name, c.last_name
       FROM activities a LEFT JOIN users u ON u.id = a.user_id LEFT JOIN customers c ON c.id = a.customer_id
      ORDER BY a.created_at DESC, a.id DESC LIMIT 12`,
  );

  return (
    <>
      <PageHeader
        title={greeting}
        subtitle={new Intl.DateTimeFormat("en-CA", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(new Date())}
        actions={
          <>
            <Link href="/customers/new" className="btn-ghost">New customer</Link>
            <Link href="/jobs/new" className="btn-primary">+ New job</Link>
          </>
        }
      />

      {sp.denied && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">You don&apos;t have access to that page.</div>}

      {customers === 0 && user.role === "admin" && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 border-amber-300 bg-amber-50 p-5">
          <div>
            <div className="font-semibold">Your CRM is empty</div>
            <p className="text-sm text-stone-600">Add your first customer, or load sample data to look around. Sample data can be deleted customer by customer.</p>
          </div>
          <div className="flex gap-2">
            <form action={loadDemoData}>
              <button className="btn-ghost">Load sample data</button>
            </form>
            <Link href="/customers/new" className="btn-primary">Add a customer</Link>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Jobs today" value={todays.length} hint={`${todays.filter((j) => j.status === "completed").length} completed`} href="/schedule" />
        <Stat label="Unscheduled" value={unscheduled.length} hint="Waiting for a time" href="/jobs?status=unscheduled" />
        <Stat label="Open estimates" value={money(openEstimates.reduce((s, e) => s + e.total_cents, 0))} hint={`${openEstimates.length} sent or approved`} href="/estimates" />
        <Stat label="Unpaid invoices" value={money(unpaidTotal)} hint={overdue ? `${overdue} overdue` : `${unpaid.length} open`} href="/invoices?status=unpaid" />
        <Stat label="Collected this month" value={money(collected)} href="/reports" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Today's schedule" actions={<Link href="/schedule" className="link text-xs">Open schedule →</Link>} pad={false}>
            {todays.length ? <JobList jobs={todays} /> : <Empty>No jobs scheduled today.</Empty>}
          </Card>
          <Card title="Unscheduled jobs" actions={<Link href="/jobs?status=unscheduled" className="link text-xs">See all →</Link>} pad={false}>
            {unscheduled.length ? <JobList jobs={unscheduled.slice(0, 6)} /> : <Empty>Everything is on the calendar.</Empty>}
          </Card>
        </div>
        <Card title="Recent activity" pad={false}>
          {activity.length ? (
            <ul className="divide-y divide-stone-100 text-sm">
              {activity.map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <Link href={a.job_id ? `/jobs/${a.job_id}` : a.customer_id ? `/customers/${a.customer_id}` : "#"} className="hover:underline">
                    {a.body}
                  </Link>
                  <div className="text-xs text-stone-500">
                    {[a.first_name && `${a.first_name} ${a.last_name ?? ""}`.trim(), a.user_name, fmtStamp(a.created_at, tz)].filter(Boolean).join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No activity yet.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
