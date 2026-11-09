import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { searchCustomers } from "@/lib/data";
import { customerName, money } from "@/lib/format";
import { Card, Empty, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/forms";
import { BulkDeleteBar } from "@/components/bulk-bar";
import { deleteSelected } from "@/lib/actions";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser(["admin", "dispatcher"]);
  const isAdmin = user.role === "admin";
  const { q = "" } = await searchParams;
  const customers = searchCustomers(q);
  return (
    <>
      <PageHeader title="Customers" subtitle={`${customers.length}${customers.length === 200 ? "+" : ""} shown`} actions={<Link href="/customers/new" className="btn-primary">+ New customer</Link>} />
      <form className="mb-4 flex gap-2">
        <input className="input max-w-md" name="q" defaultValue={q} placeholder="Search name, phone, email, address, tag…" />
        <button className="btn-ghost">Search</button>
        {q && <Link href="/customers" className="btn-ghost">Clear</Link>}
      </form>
      <Card pad={false}>
        {customers.length === 0 ? (
          <Empty action={<Link href="/customers/new" className="btn-primary">Add a customer</Link>}>{q ? "No customers match that search." : "No customers yet."}</Empty>
        ) : (
          <ActionForm action={deleteSelected} className="[&>[role]]:m-4">
          {isAdmin && <BulkDeleteBar kind="customers" noun="customers" warning="Their addresses, jobs, estimates, invoices, payments and notes are deleted too." />}
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>{isAdmin && <th className="w-8" />}<th>Name</th><th>Phone</th><th className="hidden md:table-cell">Email</th><th className="hidden lg:table-cell">Source</th><th className="text-right">Jobs</th><th className="text-right">Balance</th></tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    {isAdmin && <td><input type="checkbox" name="ids" value={c.id} aria-label={`Select ${customerName(c)}`} className="h-4 w-4 accent-amber-500" /></td>}
                    <td>
                      <Link href={`/customers/${c.id}`} className="font-semibold text-stone-900 hover:underline">{customerName(c)}</Link>
                      {c.company && (c.first_name || c.last_name) && <div className="text-xs text-stone-500">{c.company}</div>}
                      {c.tags && <div className="mt-1 flex flex-wrap gap-1">{c.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => <span key={t} className="rounded bg-stone-100 px-1.5 text-xs text-stone-600">{t}</span>)}</div>}
                    </td>
                    <td className="whitespace-nowrap">{c.phone && <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>}</td>
                    <td className="hidden md:table-cell">{c.email}</td>
                    <td className="hidden lg:table-cell text-stone-500">{c.lead_source}</td>
                    <td className="text-right tabular-nums">{c.job_count}</td>
                    <td className={`text-right tabular-nums ${c.balance_cents > 0 ? "font-semibold text-rose-700" : "text-stone-400"}`}>{money(c.balance_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
