import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { today } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { listProspects, prospectCounts, PROSPECT_STATUSES, statusLabel, statusTone } from "@/lib/prospects";
import { importProspects } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Empty, PageHeader, Tabs } from "@/components/ui";

export const metadata = { title: "Cold calls" };

function followUpText(date: string | null, now: string) {
  if (!date) return { text: "—", tone: "text-stone-400" };
  if (date < now) return { text: `Overdue · ${fmtDate(date, { year: undefined })}`, tone: "font-semibold text-rose-700" };
  if (date === now) return { text: "Today", tone: "font-semibold text-amber-700" };
  return { text: fmtDate(date, { year: undefined }), tone: "text-stone-700" };
}

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string; import?: string }> }) {
  await requireUser(["admin", "dispatcher"]);
  const { view = "open", q = "", import: showImport } = await searchParams;
  const now = today();
  const rows = listProspects({ view, q, today: now });
  const counts = prospectCounts(now);
  const href = (v: string) => `/prospects?view=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <PageHeader
        title="Cold calls"
        subtitle="Property managers you're reaching out to. They stay off your customer list until they sign on."
        actions={
          <>
            <Link href="/prospects?import=1" className="btn-ghost">
              Import list
            </Link>
            <Link href="/prospects/new" className="btn-primary">
              + Add property manager
            </Link>
          </>
        }
      />

      {showImport && (
        <Card title="Import a list of property managers" className="mb-6" actions={<Link href="/prospects" className="text-sm text-stone-500 hover:text-stone-900">Close</Link>}>
          <ActionForm action={importProspects} className="space-y-3">
            <p className="text-sm text-stone-600">
              Upload a spreadsheet saved as <b>CSV</b>. The first row should have column names. We look for: Company, Contact (or First Name and Last Name), Title, Phone, Email, Website, Address, City, Units, Notes. Anyone already on your list
              (same phone or email) is skipped.
            </p>
            <input type="file" name="file" accept=".csv,text/csv" className="block text-sm" required />
            <SubmitButton pendingText="Importing…">Import</SubmitButton>
          </ActionForm>
        </Card>
      )}

      <Tabs
        current={view}
        items={[
          { key: "due", label: "Due today", href: href("due"), count: counts.due },
          { key: "open", label: "Active", href: href("open"), count: counts.open },
          ...PROSPECT_STATUSES.map((s) => ({ key: s.value, label: s.label, href: href(s.value) })),
          { key: "all", label: "All", href: href("all"), count: counts.total },
        ]}
      />
      <form className="mb-4 flex gap-2">
        <input type="hidden" name="view" value={view} />
        <input className="input max-w-md" name="q" defaultValue={q} placeholder="Search company, name, phone, city, notes…" />
        <button className="btn-ghost">Search</button>
        {q && (
          <Link href={`/prospects?view=${view}`} className="btn-ghost">
            Clear
          </Link>
        )}
      </form>

      <Card pad={false}>
        {rows.length === 0 ? (
          <Empty action={<Link href="/prospects/new" className="btn-primary">Add a property manager</Link>}>
            {q ? "Nobody matches that search." : view === "due" ? "No calls due today. Nice work." : "Nobody here yet."}
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Property manager</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Last call</th>
                  <th>Call next</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const f = followUpText(p.status === "not_interested" || p.status === "converted" ? null : p.follow_up_on, now);
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/prospects/${p.id}`} className="font-semibold text-stone-900 hover:underline">
                          {p.company || p.contact_name}
                        </Link>
                        <div className="text-xs text-stone-500">
                          {[p.company && p.contact_name, p.title, p.units, p.city].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        {p.phone && (
                          <a href={`tel:${p.phone}`} className="hover:underline">
                            {p.phone}
                          </a>
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusTone(p.status)}`}>{statusLabel(p.status)}</span>
                      </td>
                      <td className="hidden whitespace-nowrap text-stone-600 md:table-cell">
                        {p.last_called_at ? fmtDate(p.last_called_at.slice(0, 10), { year: undefined }) : "Never"}
                        {p.call_count > 0 && <span className="text-xs text-stone-400"> · {p.call_count} call{p.call_count === 1 ? "" : "s"}</span>}
                      </td>
                      <td className={`whitespace-nowrap ${f.tone}`}>{f.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
