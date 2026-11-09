import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listEstimates } from "@/lib/data";
import { customerName, fmtDate, money } from "@/lib/format";
import { Card, Empty, PageHeader, StatusBadge, Tabs } from "@/components/ui";

export const metadata = { title: "Estimates" };

export default async function EstimatesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser(["admin", "dispatcher"]);
  const { status = "" } = await searchParams;
  const all = listEstimates();
  const rows = status ? all.filter((e) => e.status === status) : all;
  const tabs = ["", "draft", "sent", "approved", "declined", "converted"];
  return (
    <>
      <PageHeader title="Estimates" actions={<Link href="/estimates/new" className="btn-primary">+ New estimate</Link>} />
      <Tabs current={status} items={tabs.map((t) => ({ key: t, label: t ? t[0].toUpperCase() + t.slice(1) : "All", href: `/estimates${t ? `?status=${t}` : ""}`, count: t ? all.filter((e) => e.status === t).length : all.length }))} />
      <Card pad={false}>
        {rows.length === 0 ? (
          <Empty>No estimates here.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>#</th><th>Customer</th><th>Title</th><th className="hidden md:table-cell">Created</th><th>Status</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td><Link href={`/estimates/${e.id}`} className="link">{e.number}</Link></td>
                    <td><Link href={`/customers/${e.customer_id}`} className="hover:underline">{customerName({ first_name: e.customer_first, last_name: e.customer_last, company: e.customer_company })}</Link></td>
                    <td><Link href={`/estimates/${e.id}`} className="hover:underline">{e.title || "—"}</Link></td>
                    <td className="hidden md:table-cell text-stone-500">{fmtDate(e.created_at)}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td className="text-right font-semibold tabular-nums">{money(e.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
