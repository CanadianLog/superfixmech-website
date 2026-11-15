import "server-only";
import { all, get } from "./db";

/** Cold-calling: property managers you're reaching out to. Separate from customers until converted. */

export const PROSPECT_STATUSES = [
  { value: "new", label: "Not called yet", tone: "bg-stone-100 text-stone-700 ring-stone-300" },
  { value: "attempted", label: "Trying to reach", tone: "bg-sky-100 text-sky-900 ring-sky-300" },
  { value: "follow_up", label: "Call back", tone: "bg-amber-100 text-amber-900 ring-amber-300" },
  { value: "interested", label: "Interested", tone: "bg-emerald-100 text-emerald-900 ring-emerald-300" },
  { value: "not_interested", label: "Not interested", tone: "bg-rose-100 text-rose-900 ring-rose-300" },
  { value: "converted", label: "Became a customer", tone: "bg-violet-100 text-violet-900 ring-violet-300" },
] as const;

/** Call outcomes, and the status each one moves the property manager to. */
export const CALL_OUTCOMES = [
  { value: "no_answer", label: "No answer", status: "attempted" },
  { value: "voicemail", label: "Left voicemail", status: "attempted" },
  { value: "gatekeeper", label: "Spoke to someone else", status: "attempted" },
  { value: "call_back", label: "Asked to call back", status: "follow_up" },
  { value: "sent_info", label: "Sent info / email", status: "follow_up" },
  { value: "interested", label: "Interested", status: "interested" },
  { value: "not_interested", label: "Not interested", status: "not_interested" },
  { value: "wrong_number", label: "Wrong number", status: "attempted" },
] as const;

export type Prospect = {
  id: number;
  company: string;
  contact_name: string;
  title: string;
  phone: string;
  alt_phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  units: string;
  source: string;
  notes: string;
  status: string;
  follow_up_on: string | null;
  last_called_at: string | null;
  call_count: number;
  customer_id: number | null;
  created_at: string;
};

export type ProspectCall = { id: number; prospect_id: number; user_name: string | null; outcome: string; notes: string; follow_up_on: string | null; created_at: string };

export const statusLabel = (v: string) => PROSPECT_STATUSES.find((s) => s.value === v)?.label ?? v;
export const statusTone = (v: string) => PROSPECT_STATUSES.find((s) => s.value === v)?.tone ?? "bg-stone-100 text-stone-700 ring-stone-300";
export const outcomeLabel = (v: string) => CALL_OUTCOMES.find((o) => o.value === v)?.label ?? v;

export function listProspects(opts: { view?: string; q?: string; today: string }): Prospect[] {
  const where: string[] = [];
  const params: string[] = [];
  if (opts.view === "due") {
    where.push("status NOT IN ('not_interested','converted') AND follow_up_on IS NOT NULL AND follow_up_on <= ?");
    params.push(opts.today);
  } else if (opts.view && opts.view !== "all" && opts.view !== "open") {
    where.push("status = ?");
    params.push(opts.view);
  } else if (opts.view !== "all") {
    where.push("status NOT IN ('not_interested','converted')");
  }
  if (opts.q?.trim()) {
    const like = `%${opts.q.trim()}%`;
    where.push("(company LIKE ? OR contact_name LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ? OR address LIKE ? OR notes LIKE ?)");
    params.push(like, like, like, like, like, like, like);
  }
  return all<Prospect>(
    `SELECT * FROM prospects ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY CASE WHEN follow_up_on IS NULL THEN 1 ELSE 0 END, follow_up_on, CASE status WHEN 'new' THEN 0 ELSE 1 END, company
     LIMIT 500`,
    ...params,
  );
}

export function prospectCounts(today: string) {
  const r = get<{ due: number; open: number; interested: number; total: number }>(
    `SELECT
       SUM(CASE WHEN status NOT IN ('not_interested','converted') AND follow_up_on IS NOT NULL AND follow_up_on <= ? THEN 1 ELSE 0 END) AS due,
       SUM(CASE WHEN status NOT IN ('not_interested','converted') THEN 1 ELSE 0 END) AS open,
       SUM(CASE WHEN status = 'interested' THEN 1 ELSE 0 END) AS interested,
       COUNT(*) AS total
     FROM prospects`,
    today,
  );
  return { due: r?.due ?? 0, open: r?.open ?? 0, interested: r?.interested ?? 0, total: r?.total ?? 0 };
}

export function getProspect(id: number): Prospect | undefined {
  return get<Prospect>("SELECT * FROM prospects WHERE id = ?", id);
}

export function prospectCalls(id: number): ProspectCall[] {
  return all<ProspectCall>(
    `SELECT c.*, u.name AS user_name FROM prospect_calls c LEFT JOIN users u ON u.id = c.user_id
     WHERE c.prospect_id = ? ORDER BY c.created_at DESC, c.id DESC`,
    id,
  );
}
