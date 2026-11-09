import Link from "next/link";
import { searchCustomers } from "@/lib/data";
import { customerName } from "@/lib/format";
import { Card, Empty } from "./ui";

/** Step one of creating a job/estimate: pick (or create) the customer. */
export function CustomerChooser({ q, basePath }: { q: string; basePath: string }) {
  const results = searchCustomers(q, 25);
  return (
    <div className="mx-auto max-w-2xl">
      <form className="mb-4 flex gap-2">
        <input className="input" name="q" defaultValue={q} placeholder="Search customers by name, phone, address…" autoFocus />
        <button className="btn-ghost">Search</button>
      </form>
      <Card pad={false}>
        {results.length ? (
          <ul className="divide-y divide-stone-100">
            {results.map((c) => (
              <li key={c.id}>
                <Link href={`${basePath}?customer=${c.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/40">
                  <div>
                    <div className="font-semibold">{customerName(c)}</div>
                    <div className="text-xs text-stone-500">{[c.phone, c.email].filter(Boolean).join(" · ")}</div>
                  </div>
                  <span className="text-sm text-stone-400">Select →</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No customers found.</Empty>
        )}
      </Card>
      <p className="mt-4 text-center text-sm text-stone-500">
        New customer? <Link href="/customers/new" className="link">Create them first</Link>, then add the job from their page.
      </p>
    </div>
  );
}
