import "server-only";
import { all, get, getSettings } from "./db";
import { computeTotals, todayIn } from "./format";
import type {
  Activity,
  Address,
  Customer,
  Estimate,
  Invoice,
  InvoiceDisplayStatus,
  Job,
  LineItem,
  Payment,
  PricebookItem,
  Totals,
  User,
} from "./types";

export function taxRate(): number {
  return parseFloat(getSettings().tax_rate || "0") || 0;
}

export function timeZone(): string {
  return getSettings().time_zone || "America/Toronto";
}

export function today(): string {
  return todayIn(timeZone());
}

/* ---------------- users ---------------- */

export function listUsers(includeInactive = false): User[] {
  return all<User>(
    `SELECT id, name, email, phone, role, color, active, created_at FROM users
     ${includeInactive ? "" : "WHERE active = 1"} ORDER BY active DESC, name`,
  );
}

export function listTechs(): User[] {
  // Anyone can be assigned work; technicians first.
  return all<User>(
    `SELECT id, name, email, phone, role, color, active, created_at FROM users
     WHERE active = 1 ORDER BY role = 'tech' DESC, name`,
  );
}

/* ---------------- customers ---------------- */

export type CustomerRow = Customer & { job_count: number; balance_cents: number; last_job: string | null };

export function searchCustomers(q: string, limit = 200): CustomerRow[] {
  const like = `%${q.trim()}%`;
  const rows = all<Customer & { job_count: number; last_job: string | null }>(
    `SELECT c.*,
            (SELECT COUNT(*) FROM jobs j WHERE j.customer_id = c.id) AS job_count,
            (SELECT MAX(COALESCE(j.scheduled_start, j.created_at)) FROM jobs j WHERE j.customer_id = c.id) AS last_job
       FROM customers c
      WHERE ? = '' OR (c.first_name || ' ' || c.last_name) LIKE ? OR c.company LIKE ? OR c.email LIKE ?
            OR REPLACE(REPLACE(REPLACE(c.phone,'-',''),' ',''),'(','') LIKE ? OR c.tags LIKE ?
            OR EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = c.id AND (a.street LIKE ? OR a.city LIKE ? OR a.postal_code LIKE ?))
      ORDER BY c.created_at DESC
      LIMIT ?`,
    q.trim(),
    like,
    like,
    like,
    `%${q.replace(/[^0-9]/g, "") || q.trim()}%`,
    like,
    like,
    like,
    like,
    limit,
  );
  const balances = customerBalances();
  return rows.map((r) => ({ ...r, balance_cents: balances.get(r.id) ?? 0 }));
}

export function getCustomer(id: number): Customer | undefined {
  return get<Customer>("SELECT * FROM customers WHERE id = ?", id);
}

export function customerAddresses(customerId: number): Address[] {
  return all<Address>("SELECT * FROM addresses WHERE customer_id = ? ORDER BY id", customerId);
}

export function getAddress(id: number | null): Address | undefined {
  if (!id) return undefined;
  return get<Address>("SELECT * FROM addresses WHERE id = ?", id);
}

/* ---------------- line items & totals ---------------- */

export function lineItems(parentType: LineItem["parent_type"], parentId: number): LineItem[] {
  return all<LineItem>(
    "SELECT * FROM line_items WHERE parent_type = ? AND parent_id = ? ORDER BY sort, id",
    parentType,
    parentId,
  );
}

const PARENT_TABLE = { job: "jobs", estimate: "estimates", invoice: "invoices" } as const;

/** The tax rate chosen on a job/estimate/invoice, or the company default when none was picked. */
export function rateFor(parentType: LineItem["parent_type"], parentId: number): number {
  const row = get<{ tax_rate: number | null }>(`SELECT tax_rate FROM ${PARENT_TABLE[parentType]} WHERE id = ?`, parentId);
  return row?.tax_rate ?? taxRate();
}

export function totalsFor(parentType: LineItem["parent_type"], parentId: number): Totals {
  return computeTotals(
    lineItems(parentType, parentId).map((i) => ({ ...i, taxable: !!i.taxable })),
    rateFor(parentType, parentId),
  );
}

/* ---------------- jobs ---------------- */

export type JobRow = Job & {
  customer_first: string;
  customer_last: string;
  customer_company: string;
  customer_phone: string;
  tech_name: string | null;
  tech_color: string | null;
  street: string | null;
  city: string | null;
  total_cents: number;
};

const JOB_SELECT = `
  SELECT j.*, c.first_name AS customer_first, c.last_name AS customer_last, c.company AS customer_company,
         c.phone AS customer_phone, u.name AS tech_name, u.color AS tech_color, a.street, a.city
    FROM jobs j
    JOIN customers c ON c.id = j.customer_id
    LEFT JOIN users u ON u.id = j.tech_id
    LEFT JOIN addresses a ON a.id = j.address_id`;

function withTotals(rows: Omit<JobRow, "total_cents">[]): JobRow[] {
  return rows.map((r) => ({ ...r, total_cents: totalsFor("job", r.id).total }));
}

export function listJobs(opts: {
  status?: string;
  techId?: number;
  customerId?: number;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
}): JobRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.status === "open") where.push("j.status NOT IN ('completed','canceled')");
  else if (opts.status) {
    where.push("j.status = ?");
    params.push(opts.status);
  }
  if (opts.techId) {
    where.push("j.tech_id = ?");
    params.push(opts.techId);
  }
  if (opts.customerId) {
    where.push("j.customer_id = ?");
    params.push(opts.customerId);
  }
  if (opts.from) {
    where.push("j.scheduled_start >= ?");
    params.push(opts.from);
  }
  if (opts.to) {
    where.push("j.scheduled_start < ?");
    params.push(opts.to);
  }
  if (opts.q?.trim()) {
    const like = `%${opts.q.trim()}%`;
    where.push(
      "(j.title LIKE ? OR j.description LIKE ? OR (c.first_name || ' ' || c.last_name) LIKE ? OR c.company LIKE ? OR CAST(j.number AS TEXT) = ? OR a.street LIKE ?)",
    );
    params.push(like, like, like, like, opts.q.trim().replace(/^#/, ""), like);
  }
  const sql = `${JOB_SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY CASE WHEN j.scheduled_start IS NULL THEN 0 ELSE 1 END, j.scheduled_start DESC, j.id DESC
    LIMIT ${opts.limit ?? 300}`;
  return withTotals(all(sql, ...params));
}

export function jobsInRange(from: string, to: string, techId?: number): JobRow[] {
  const params: (string | number)[] = [from, to];
  let extra = "";
  if (techId) {
    extra = " AND j.tech_id = ?";
    params.push(techId);
  }
  return withTotals(
    all(
      `${JOB_SELECT} WHERE j.scheduled_start >= ? AND j.scheduled_start < ? AND j.status != 'canceled'${extra}
       ORDER BY j.scheduled_start`,
      ...params,
    ),
  );
}

export function unscheduledJobs(): JobRow[] {
  return withTotals(all(`${JOB_SELECT} WHERE j.status = 'unscheduled' ORDER BY j.created_at`));
}

export function getJob(id: number): JobRow | undefined {
  const row = get<Omit<JobRow, "total_cents">>(`${JOB_SELECT} WHERE j.id = ?`, id);
  return row ? withTotals([row])[0] : undefined;
}

/* ---------------- estimates ---------------- */

export type EstimateRow = Estimate & {
  customer_first: string;
  customer_last: string;
  customer_company: string;
  total_cents: number;
};

const EST_SELECT = `
  SELECT e.*, c.first_name AS customer_first, c.last_name AS customer_last, c.company AS customer_company
    FROM estimates e JOIN customers c ON c.id = e.customer_id`;

export function listEstimates(opts: { status?: string; customerId?: number } = {}): EstimateRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.status) {
    where.push("e.status = ?");
    params.push(opts.status);
  }
  if (opts.customerId) {
    where.push("e.customer_id = ?");
    params.push(opts.customerId);
  }
  const rows = all<Omit<EstimateRow, "total_cents">>(
    `${EST_SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY e.id DESC LIMIT 300`,
    ...params,
  );
  return rows.map((r) => ({ ...r, total_cents: totalsFor("estimate", r.id).total }));
}

export function getEstimate(id: number): EstimateRow | undefined {
  const r = get<Omit<EstimateRow, "total_cents">>(`${EST_SELECT} WHERE e.id = ?`, id);
  return r ? { ...r, total_cents: totalsFor("estimate", r.id).total } : undefined;
}

/* ---------------- invoices ---------------- */

export type InvoiceRow = Invoice & {
  customer_first: string;
  customer_last: string;
  customer_company: string;
  customer_email: string;
  job_number: number | null;
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
  display_status: InvoiceDisplayStatus;
};

const INV_SELECT = `
  SELECT i.*, c.first_name AS customer_first, c.last_name AS customer_last, c.company AS customer_company,
         c.email AS customer_email, j.number AS job_number,
         COALESCE((SELECT SUM(p.amount_cents) FROM payments p WHERE p.invoice_id = i.id), 0) AS paid_cents
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    LEFT JOIN jobs j ON j.id = i.job_id`;

function decorateInvoice(r: Omit<InvoiceRow, "total_cents" | "balance_cents" | "display_status">, now: string): InvoiceRow {
  const total = totalsFor("invoice", r.id).total;
  const balance = total - r.paid_cents;
  let display: InvoiceDisplayStatus;
  if (r.status === "void") display = "void";
  else if (total > 0 && balance <= 0) display = "paid";
  else if (r.status === "draft") display = "draft";
  else if (r.due_on < now) display = "overdue";
  else if (r.paid_cents > 0) display = "partial";
  else display = "open";
  return { ...r, total_cents: total, balance_cents: balance, display_status: display };
}

export function listInvoices(opts: { status?: string; customerId?: number; jobId?: number } = {}): InvoiceRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.customerId) {
    where.push("i.customer_id = ?");
    params.push(opts.customerId);
  }
  if (opts.jobId) {
    where.push("i.job_id = ?");
    params.push(opts.jobId);
  }
  const now = today();
  const rows = all<Omit<InvoiceRow, "total_cents" | "balance_cents" | "display_status">>(
    `${INV_SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY i.id DESC LIMIT 500`,
    ...params,
  ).map((r) => decorateInvoice(r, now));
  if (opts.status === "unpaid") return rows.filter((r) => ["open", "partial", "overdue"].includes(r.display_status));
  return opts.status ? rows.filter((r) => r.display_status === opts.status) : rows;
}

export function getInvoice(id: number): InvoiceRow | undefined {
  const r = get<Omit<InvoiceRow, "total_cents" | "balance_cents" | "display_status">>(`${INV_SELECT} WHERE i.id = ?`, id);
  return r ? decorateInvoice(r, today()) : undefined;
}

export function invoicePayments(invoiceId: number): Payment[] {
  return all<Payment>("SELECT * FROM payments WHERE invoice_id = ? ORDER BY paid_on, id", invoiceId);
}

function customerBalances(): Map<number, number> {
  const out = new Map<number, number>();
  for (const inv of listInvoices()) {
    if (inv.display_status === "void" || inv.display_status === "draft") continue;
    out.set(inv.customer_id, (out.get(inv.customer_id) ?? 0) + Math.max(0, inv.balance_cents));
  }
  return out;
}

export function customerBalance(customerId: number): number {
  return listInvoices({ customerId })
    .filter((i) => i.display_status !== "void" && i.display_status !== "draft")
    .reduce((s, i) => s + Math.max(0, i.balance_cents), 0);
}

/* ---------------- price book ---------------- */

export function listPricebook(includeInactive = false): PricebookItem[] {
  return all<PricebookItem>(
    `SELECT * FROM pricebook ${includeInactive ? "" : "WHERE active = 1"}
     ORDER BY CASE WHEN appliance = '' THEN 1 ELSE 0 END, appliance, kind DESC, category, name`,
  );
}

/* ---------------- activity ---------------- */

export function activitiesFor(opts: { customerId?: number; jobId?: number }): Activity[] {
  if (opts.jobId)
    return all<Activity>(
      `SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.job_id = ? ORDER BY a.created_at DESC, a.id DESC`,
      opts.jobId,
    );
  return all<Activity>(
    `SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.customer_id = ? ORDER BY a.created_at DESC, a.id DESC LIMIT 100`,
    opts.customerId ?? 0,
  );
}

/* ---------------- reports ---------------- */

export function paymentsBetween(from: string, to: string): { day: string; amount_cents: number; method: string }[] {
  return all(
    "SELECT paid_on AS day, amount_cents, method FROM payments WHERE paid_on >= ? AND paid_on < ? ORDER BY paid_on",
    from,
    to,
  );
}

/**
 * Profit on invoices issued in [from, to): sales before tax minus your material costs (internal only).
 * Drafts and void invoices are left out.
 */
export function profitBetween(from: string, to: string): { sales: number; cost: number; profit: number; invoices: number } {
  const rows = all<{ sales: number | null; cost: number | null; n: number }>(
    `SELECT
       SUM(CASE WHEN li.kind = 'discount' THEN -ABS(ROUND(li.quantity * li.unit_price_cents)) ELSE ROUND(li.quantity * li.unit_price_cents) END) AS sales,
       SUM(CASE WHEN li.kind = 'discount' THEN 0 ELSE ROUND(li.quantity * li.cost_cents) END) AS cost,
       COUNT(DISTINCT i.id) AS n
     FROM invoices i
     JOIN line_items li ON li.parent_type = 'invoice' AND li.parent_id = i.id
     WHERE i.status = 'sent' AND i.issued_on >= ? AND i.issued_on < ?`,
    from,
    to,
  )[0];
  const sales = Math.round(rows?.sales ?? 0);
  const cost = Math.round(rows?.cost ?? 0);
  return { sales, cost, profit: sales - cost, invoices: rows?.n ?? 0 };
}
