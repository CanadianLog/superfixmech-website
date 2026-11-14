import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { listEstimates, listInvoices, paymentsBetween, profitBetween, spendBySupplier, today, totalsFor } from "@/lib/data";
import { addDays, fmtDate, money } from "@/lib/format";
import { Card, PageHeader, Stat, Tabs } from "@/components/ui";

export const metadata = { title: "Reports" };

function range(period: string, now: string): [string, string, string] {
  const y = Number(now.slice(0, 4));
  const m = Number(now.slice(5, 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (period) {
    case "last_month": {
      const ly = m === 1 ? y - 1 : y;
      const lm = m === 1 ? 12 : m - 1;
      return [`${ly}-${pad(lm)}-01`, `${y}-${pad(m)}-01`, "Last month"];
    }
    case "30d":
      return [addDays(now, -29), addDays(now, 1), "Last 30 days"];
    case "year":
      return [`${y}-01-01`, addDays(now, 1), `${y} so far`];
    default:
      return [`${y}-${pad(m)}-01`, addDays(now, 1), "This month"];
  }
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireUser(["admin", "dispatcher"]);
  const { period = "month" } = await searchParams;
  const now = today();
  const [from, to, label] = range(period, now);

  const payments = paymentsBetween(from, to);
  const profit = profitBetween(from, to);
  const suppliers = spendBySupplier(from, to);
  const supplierTotal = suppliers.reduce((s, r) => s + r.cost, 0);
  const collected = payments.reduce((s, p) => s + p.amount_cents, 0);
  const byMethod = new Map<string, number>();
  for (const p of payments) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount_cents);

  const invoices = listInvoices().filter((i) => i.issued_on >= from && i.issued_on < to && i.display_status !== "void" && i.display_status !== "draft");
  const invoiced = invoices.reduce((s, i) => s + i.total_cents, 0);

  const completed = all<{ id: number; tech_name: string | null; tech_color: string | null; lead_source: string }>(
    `SELECT j.id, u.name AS tech_name, u.color AS tech_color, j.lead_source FROM jobs j LEFT JOIN users u ON u.id = j.tech_id
      WHERE j.status = 'completed' AND COALESCE(substr(j.scheduled_start, 1, 10), substr(j.completed_at, 1, 10)) >= ? AND COALESCE(substr(j.scheduled_start, 1, 10), substr(j.completed_at, 1, 10)) < ?`,
    from,
    to,
  ).map((j) => ({ ...j, total: totalsFor("job", j.id).total }));
  const jobRevenue = completed.reduce((s, j) => s + j.total, 0);
  const avgTicket = completed.length ? Math.round(jobRevenue / completed.length) : 0;

  const byTech = new Map<string, { color: string; jobs: number; total: number }>();
  for (const j of completed) {
    const k = j.tech_name ?? "Unassigned";
    const cur = byTech.get(k) ?? { color: j.tech_color ?? "#a8a29e", jobs: 0, total: 0 };
    byTech.set(k, { ...cur, jobs: cur.jobs + 1, total: cur.total + j.total });
  }

  const newJobs = all<{ lead_source: string; n: number }>(
    "SELECT COALESCE(NULLIF(lead_source, ''), 'Unknown') AS lead_source, COUNT(*) AS n FROM jobs WHERE substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) < ? GROUP BY 1 ORDER BY n DESC",
    from,
    to,
  );
  const totalNew = newJobs.reduce((s, r) => s + r.n, 0);

  const ests = listEstimates().filter((e) => e.created_at.slice(0, 10) >= from && e.created_at.slice(0, 10) < to);
  const decided = ests.filter((e) => ["approved", "declined", "converted"].includes(e.status));
  const won = decided.filter((e) => e.status !== "declined");
  const winRate = decided.length ? Math.round((won.length / decided.length) * 100) : null;

  // Last 12 months of collected payments.
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(`${now.slice(0, 7)}-01T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - (11 - i));
    return d.toISOString().slice(0, 7);
  });
  const monthly = new Map(all<{ m: string; total: number }>("SELECT substr(paid_on, 1, 7) AS m, SUM(amount_cents) AS total FROM payments WHERE paid_on >= ? GROUP BY 1", `${months[0]}-01`).map((r) => [r.m, r.total]));
  const maxMonth = Math.max(1, ...months.map((m) => monthly.get(m) ?? 0));

  const bar = (value: number, max: number, color = "#f4c542") => (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full" style={{ width: `${Math.round((value / Math.max(max, 1)) * 100)}%`, background: color }} /></div>
  );

  return (
    <>
      <PageHeader title="Reports" subtitle={`${label}: ${fmtDate(from)} – ${fmtDate(addDays(to, -1))}`} />
      <Tabs
        current={period}
        items={[["month", "This month"], ["last_month", "Last month"], ["30d", "Last 30 days"], ["year", "Year to date"]].map(([k, l]) => ({ key: k, label: l, href: `/reports?period=${k}` }))}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Collected" value={money(collected)} hint={`${payments.length} payments`} />
        <Stat label="Invoiced" value={money(invoiced)} hint={`${invoices.length} invoices`} />
        <Stat label="Jobs completed" value={completed.length} />
        <Stat label="Average ticket" value={money(avgTicket)} />
        {user.role === "admin" && <Stat label="Profit (before HST)" value={money(profit.profit)} hint={`Sales ${money(profit.sales)} − materials ${money(profit.cost)}`} />}
        <Stat label="Estimate win rate" value={winRate === null ? "—" : `${winRate}%`} hint={`${won.length} of ${decided.length} decided`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Collected by month (last 12)">
          <div className="flex h-48 items-end gap-2">
            {months.map((m) => {
              const v = monthly.get(m) ?? 0;
              return (
                <div key={m} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${m}: ${money(v)}`}>
                  <div className="w-full rounded-t-md bg-brand" style={{ height: `${Math.max(2, (v / maxMonth) * 100)}%`, opacity: v ? 1 : 0.25 }} />
                  <div className="text-[10px] text-stone-500">{fmtDate(`${m}-01`, { month: "short", day: undefined, year: undefined })}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Revenue by technician (completed jobs)">
          {byTech.size ? (
            <ul className="space-y-3 text-sm">
              {[...byTech.entries()].sort((a, b) => b[1].total - a[1].total).map(([name, v]) => (
                <li key={name}>
                  <div className="mb-1 flex justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: v.color }} />{name} <span className="text-stone-400">· {v.jobs} jobs</span></span><span className="font-semibold tabular-nums">{money(v.total)}</span></div>
                  {bar(v.total, jobRevenue, v.color)}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-stone-400">No completed jobs in this period.</p>}
        </Card>

        <Card title="New jobs by lead source">
          {newJobs.length ? (
            <ul className="space-y-3 text-sm">
              {newJobs.map((r) => (
                <li key={r.lead_source}>
                  <div className="mb-1 flex justify-between"><span>{r.lead_source}</span><span className="font-semibold tabular-nums">{r.n} <span className="font-normal text-stone-400">({Math.round((r.n / totalNew) * 100)}%)</span></span></div>
                  {bar(r.n, totalNew)}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-stone-400">No new jobs in this period.</p>}
        </Card>

        {user.role === "admin" && (
          <Card title="Materials bought, by supplier">
            {suppliers.length ? (
              <ul className="space-y-3 text-sm">
                {suppliers.map((r) => (
                  <li key={r.supplier}>
                    <div className="mb-1 flex justify-between">
                      <span className={r.supplier === "Not recorded" ? "text-stone-400" : ""}>
                        {r.supplier} <span className="text-stone-400">· {r.lines} item{r.lines === 1 ? "" : "s"}</span>
                      </span>
                      <span className="font-semibold tabular-nums">{money(r.cost)}</span>
                    </div>
                    {bar(r.cost, supplierTotal, "#78716c")}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400">No material costs recorded on invoices in this period.</p>
            )}
          </Card>
        )}

        <Card title="Payments by method">
          {byMethod.size ? (
            <ul className="space-y-3 text-sm">
              {[...byMethod.entries()].sort((a, b) => b[1] - a[1]).map(([m, v]) => (
                <li key={m}>
                  <div className="mb-1 flex justify-between capitalize"><span>{m}</span><span className="font-semibold tabular-nums">{money(v)}</span></div>
                  {bar(v, collected, "#16a34a")}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-stone-400">No payments in this period.</p>}
          <p className="mt-4 text-xs text-stone-400"><Link href="/invoices?status=unpaid" className="link">See unpaid invoices →</Link></p>
        </Card>
      </div>
    </>
  );
}
