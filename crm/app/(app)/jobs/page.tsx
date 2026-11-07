import Link from "next/link";
import { requireUser, isOffice } from "@/lib/auth";
import { listJobs } from "@/lib/data";
import { Card, Empty, PageHeader, Tabs } from "@/components/ui";
import { JobList } from "@/components/job-list";

export const metadata = { title: "Jobs" };

const TABS = [
  ["open", "Open"],
  ["unscheduled", "Unscheduled"],
  ["scheduled", "Scheduled"],
  ["in_progress", "In progress"],
  ["completed", "Completed"],
  ["canceled", "Canceled"],
  ["all", "All"],
] as const;

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const user = await requireUser();
  const { status = "open", q = "" } = await searchParams;
  const techId = isOffice(user) ? undefined : user.id;
  const jobs = listJobs({ status: status === "all" ? undefined : status, q, techId });
  return (
    <>
      <PageHeader title={isOffice(user) ? "Jobs" : "My jobs"} actions={isOffice(user) && <Link href="/jobs/new" className="btn-primary">+ New job</Link>} />
      <Tabs current={status} items={TABS.map(([key, label]) => ({ key, label, href: `/jobs?status=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}` }))} />
      <form className="mb-4 flex gap-2">
        <input type="hidden" name="status" value={status} />
        <input className="input max-w-md" name="q" defaultValue={q} placeholder="Search job #, title, customer, street…" />
        <button className="btn-ghost">Search</button>
      </form>
      <Card pad={false}>{jobs.length ? <JobList jobs={jobs} /> : <Empty>No jobs here.</Empty>}</Card>
    </>
  );
}
