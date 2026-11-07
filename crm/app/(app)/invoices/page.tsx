import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listInvoices } from "@/lib/data";
import { customerName, fmtDate, money } from "@/lib/format";
import { Card, Empty, PageHeader, StatusBadge, Tabs } from "@/components/ui";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser(["admin", "dispatcher"]);
  const { status = "" } = await searchParams;
  const all = listInvoices();
  const unpaid = all.filter((i) => ["open", "partial", "overdue"].includes(i.display_status));
  const rows = status === "unpaid" ? unpaid : status ? all.filter((i) => i.display_status === status) : all;
  const tabs: [string, string, number][] = [
    ["", "All", all.length],
    ["unpaid", "Unpaid", unpaid.length],
    ["overdue", "Overdue", all.filter((i) => i.display_status === "overdue").length],
    ["draft", "Draft", all.filter((i) => i.display_status === "draft").length],
    ["paid", "Paid", all.filter((i) => i.display_status === "paid").length],
    ["void", "Void", all.filter((i) => i.display_status === "void").length],
  ];
  const outstanding = unpaid.reduce((s, i) => s + i.balance_cents, 0);
  return (
    <>
      <PageHeader title="Invoices" subtitle={`${money(outstanding)} outstanding across ${unpaid.length} invoice${unpaid.length === 1 ? "" : "s"}`} />
      <Tabs current={status} items={tabs.map(([k, label, count]) => ({ key: k, label, count, href: `/invoices${k ? `?status=${k}` : ""}` }))} />
      <Card pad={false}>
        {rows.length === 0 ? (
          <Empty>No invoices here. Invoices are created from completed jobs or from a customer&apos;s page.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>#</th><th>Customer</th><th className="hidden md:table-cell">Issued</th><th className="hidden md:table-cell">Due</th><th>Status</th><th className="text-right">Total</th><th className="text-right">Balance</th></tr></thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id}>
                    <td><Link href={`/invoices/${i.id}`} className="link">{i.number}</Link></td>
                    <td><Link href={`/customers/${i.customer_id}`} className="hover:underline">{customerName({ first_name: i.customer_first, last_name: i.customer_last, company: i.customer_company })}</Link>{i.job_number && <div className="text-xs text-stone-400">Job #{i.job_number}</div>}</td>
                    <td className="hidden md:table-cell text-stone-500">{fmtDate(i.issued_on)}</td>
                    <td className="hidden md:table-cell text-stone-500">{fmtDate(i.due_on)}</td>
                    <td><StatusBadge status={i.display_status} /></td>
                    <td className="text-right tabular-nums">{money(i.total_cents)}</td>
                    <td className={`text-right font-semibold tabular-nums ${i.balance_cents > 0 && i.display_status !== "void" ? "text-rose-700" : "text-stone-400"}`}>{money(i.display_status === "void" ? 0 : i.balance_cents)}</td>
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
