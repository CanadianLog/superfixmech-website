"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { all, get, getSettings, nextNumber, run, tx } from "./db";
import {
  createSession,
  destroySession,
  hasUsers,
  hashPassword,
  isOffice,
  randomToken,
  requireUser,
  verifyPassword,
} from "./auth";
import { addDays, toCents } from "./format";
import { getJob, lineItems, today, timeZone } from "./data";
import type { JobStatus, LineItemInput, User } from "./types";
import { JOB_STATUSES } from "./types";
import { seedDemoData } from "./seed";
import * as qbo from "./quickbooks";
import * as msg from "./messaging";
import { appOrigin } from "./origin";

/* ---------- helpers ---------- */

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function done(path: string): never {
  revalidatePath("/", "layout");
  redirect(path);
}

/** Tax rate picked in the line-item editor; null keeps the company default. */
function taxRateField(fd: FormData): number | null {
  const v = str(fd, "tax_rate");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

/** links: fallback buttons that open the phone's own text/email app with the message pre-written. */
export type FormState = { error?: string; ok?: string; links?: { label: string; href: string }[] } | undefined;

function logActivity(opts: { customerId?: number | null; jobId?: number | null; userId?: number | null; kind?: string; body: string }) {
  run(
    "INSERT INTO activities (customer_id, job_id, user_id, kind, body) VALUES (?, ?, ?, ?, ?)",
    opts.customerId ?? null,
    opts.jobId ?? null,
    opts.userId ?? null,
    opts.kind ?? "event",
    opts.body,
  );
}

function parseItems(fd: FormData): LineItemInput[] {
  try {
    const raw = JSON.parse(str(fd, "items") || "[]") as LineItemInput[];
    return raw
      .filter((i) => i && String(i.name ?? "").trim())
      .map((i) => ({
        kind: (["service", "material", "discount"].includes(i.kind) ? i.kind : "service") as LineItemInput["kind"],
        name: String(i.name).trim().slice(0, 200),
        description: String(i.description ?? "").slice(0, 2000),
        quantity: Number.isFinite(Number(i.quantity)) ? Number(i.quantity) : 1,
        unit_price_cents: Math.round(Number(i.unit_price_cents) || 0),
        taxable: !!i.taxable,
        cost_cents: Math.max(0, Math.round(Number(i.cost_cents) || 0)),
        supplier: String(i.supplier ?? "").trim().slice(0, 100),
      }));
  } catch {
    return [];
  }
}

function replaceItems(parentType: "job" | "estimate" | "invoice", parentId: number, items: LineItemInput[]) {
  run("DELETE FROM line_items WHERE parent_type = ? AND parent_id = ?", parentType, parentId);
  items.forEach((i, idx) =>
    run(
      `INSERT INTO line_items (parent_type, parent_id, kind, name, description, quantity, unit_price_cents, taxable, sort, cost_cents, supplier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      parentType,
      parentId,
      i.kind,
      i.name,
      i.description,
      i.quantity,
      i.unit_price_cents,
      i.taxable ? 1 : 0,
      idx,
      i.cost_cents ?? 0,
      i.supplier ?? "",
    ),
  );
}

function copyItems(fromType: "job" | "estimate" | "invoice", fromId: number, toType: "job" | "estimate" | "invoice", toId: number) {
  replaceItems(
    toType,
    toId,
    lineItems(fromType, fromId).map((i) => ({ ...i, taxable: !!i.taxable })),
  );
}

function canTouchJob(user: User, jobId: number) {
  if (isOffice(user)) return true;
  const j = get<{ tech_id: number | null }>("SELECT tech_id FROM jobs WHERE id = ?", jobId);
  return j?.tech_id === user.id;
}

/* ---------- auth ---------- */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const user = get<{ id: number; password_hash: string; active: number }>(
    "SELECT id, password_hash, active FROM users WHERE email = ?",
    email,
  );
  if (!user || !user.active || !verifyPassword(str(fd, "password"), user.password_hash)) {
    return { error: "That email and password don't match." };
  }
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function setupAdmin(_: FormState, fd: FormData): Promise<FormState> {
  if (hasUsers()) redirect("/login");
  const name = str(fd, "name");
  const email = str(fd, "email");
  const password = str(fd, "password");
  if (!name || !email.includes("@")) return { error: "Enter your name and a valid email." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  const { id } = run(
    "INSERT INTO users (name, email, password_hash, role, color) VALUES (?, ?, ?, 'admin', '#ca8a04')",
    name,
    email,
    hashPassword(password),
  );
  if (str(fd, "company")) run("UPDATE settings SET value = ? WHERE key = 'company_name'", str(fd, "company"));
  await createSession(id);
  redirect("/");
}

/* ---------- deleting records (admin only) ---------- */

function removeCustomers(ids: number[]) {
  for (const id of ids) {
    for (const t of ["job", "estimate", "invoice"] as const) {
      const table = t === "job" ? "jobs" : t === "estimate" ? "estimates" : "invoices";
      run(`DELETE FROM line_items WHERE parent_type = ? AND parent_id IN (SELECT id FROM ${table} WHERE customer_id = ?)`, t, id);
    }
    run("DELETE FROM customers WHERE id = ?", id); // addresses, jobs, estimates, invoices, payments and notes go with it
  }
}

function removeJobs(ids: number[]) {
  for (const id of ids) {
    run("DELETE FROM line_items WHERE parent_type = 'job' AND parent_id = ?", id);
    run("DELETE FROM jobs WHERE id = ?", id); // invoices for the job are kept
  }
}

function removeInvoices(ids: number[]) {
  for (const id of ids) {
    run("DELETE FROM line_items WHERE parent_type = 'invoice' AND parent_id = ?", id);
    run("DELETE FROM invoices WHERE id = ?", id); // its payments go with it
  }
}

function idList(fd: FormData, key = "ids"): number[] {
  return fd
    .getAll(key)
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
}

/** Bulk delete from a list page. `kind` says which list. */
export async function deleteSelected(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const ids = idList(fd);
  const kind = str(fd, "kind");
  if (!ids.length) return { error: "Tick the ones you want to delete first." };
  if (kind === "customers") tx(() => removeCustomers(ids));
  else if (kind === "jobs") tx(() => removeJobs(ids));
  else if (kind === "invoices") tx(() => removeInvoices(ids));
  else return { error: "Unknown list." };
  revalidatePath("/", "layout");
  const noun = kind === "customers" ? "customer" : kind === "jobs" ? "job" : "invoice";
  return { ok: `Deleted ${ids.length} ${noun}${ids.length === 1 ? "" : "s"}.` };
}

export async function deleteInvoice(fd: FormData) {
  await requireUser(["admin"]);
  const id = num(fd, "id");
  if (id) tx(() => removeInvoices([id]));
  done("/invoices");
}

export async function deletePricebookItem(fd: FormData) {
  await requireUser(["admin", "dispatcher"]);
  run("DELETE FROM pricebook WHERE id = ?", num(fd, "id"));
  done("/pricebook");
}

/* ---------- customers ---------- */

export async function saveCustomer(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id");
  const fields = ["first_name", "last_name", "company", "email", "phone", "alt_phone", "tags", "lead_source", "notes"] as const;
  const values = fields.map((f) => str(fd, f));
  if (!values[0] && !values[1] && !values[2]) return { error: "Add a name or company." };

  let customerId: number;
  if (id) {
    run(`UPDATE customers SET ${fields.map((f) => `${f} = ?`).join(", ")}, no_review = ? WHERE id = ?`, ...values, fd.get("no_review") ? 1 : 0, id);
    customerId = id;
  } else {
    customerId = tx(() => {
      const { id: newId } = run(
        `INSERT INTO customers (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`,
        ...values,
      );
      if (str(fd, "street")) {
        run(
          "INSERT INTO addresses (customer_id, street, unit, city, province, postal_code) VALUES (?, ?, ?, ?, ?, ?)",
          newId,
          str(fd, "street"),
          str(fd, "unit"),
          str(fd, "city"),
          str(fd, "province") || "ON",
          str(fd, "postal_code").toUpperCase(),
        );
      }
      logActivity({ customerId: newId, userId: user.id, body: "Customer created" });
      return newId;
    });
  }
  done(`/customers/${customerId}`);
}

export async function deleteCustomer(fd: FormData) {
  await requireUser(["admin"]);
  const id = num(fd, "id");
  if (id) tx(() => removeCustomers([id]));
  done("/customers");
}

export async function saveAddress(fd: FormData) {
  await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id");
  const customerId = num(fd, "customer_id");
  const vals = [str(fd, "street"), str(fd, "unit"), str(fd, "city"), str(fd, "province") || "ON", str(fd, "postal_code").toUpperCase(), str(fd, "notes")];
  if (id) {
    run("UPDATE addresses SET street = ?, unit = ?, city = ?, province = ?, postal_code = ?, notes = ? WHERE id = ?", ...vals, id);
  } else if (customerId && vals[0]) {
    run(
      "INSERT INTO addresses (customer_id, street, unit, city, province, postal_code, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      customerId,
      ...vals,
    );
  }
  done(`/customers/${customerId}`);
}

export async function deleteAddress(fd: FormData) {
  await requireUser(["admin", "dispatcher"]);
  run("DELETE FROM addresses WHERE id = ?", num(fd, "id"));
  done(`/customers/${num(fd, "customer_id")}`);
}

export async function addNote(fd: FormData) {
  const user = await requireUser();
  const body = str(fd, "body");
  const jobId = num(fd, "job_id");
  let customerId = num(fd, "customer_id");
  if (jobId) {
    if (!canTouchJob(user, jobId)) redirect("/");
    customerId = get<{ customer_id: number }>("SELECT customer_id FROM jobs WHERE id = ?", jobId)?.customer_id ?? customerId;
  }
  if (body) logActivity({ customerId, jobId, userId: user.id, kind: "note", body });
  done(jobId ? `/jobs/${jobId}` : `/customers/${customerId}`);
}

/* ---------- jobs ---------- */

function scheduleFields(fd: FormData) {
  const date = str(fd, "date");
  const start = str(fd, "start_time");
  const end = str(fd, "end_time");
  if (!date || !start) return { start: null, end: null };
  const s = `${date}T${start}`;
  let e = end ? `${date}T${end}` : null;
  if (e && e <= s) e = null;
  if (!e) {
    const [h, m] = start.split(":").map(Number);
    const total = Math.min(h * 60 + m + 120, 23 * 60 + 59);
    e = `${date}T${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  return { start: s, end: e };
}

export async function saveJob(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id");
  const customerId = num(fd, "customer_id");
  if (!customerId) return { error: "Pick a customer." };
  const title = str(fd, "title");
  if (!title) return { error: "Give the job a short title, like “Fridge not cooling”." };
  const { start, end } = scheduleFields(fd);
  const techId = num(fd, "tech_id");
  const fields = {
    customer_id: customerId,
    address_id: num(fd, "address_id"),
    title,
    description: str(fd, "description"),
    scheduled_start: start,
    scheduled_end: end,
    tech_id: techId,
    appliance: str(fd, "appliance"),
    brand: str(fd, "brand"),
    model: str(fd, "model"),
    serial: str(fd, "serial"),
    private_notes: str(fd, "private_notes"),
    lead_source: str(fd, "lead_source"),
    tax_rate: taxRateField(fd),
  };
  const items = parseItems(fd);

  let jobId: number;
  if (id) {
    const existing = get<{ status: JobStatus; scheduled_start: string | null; tech_id: number | null }>(
      "SELECT status, scheduled_start, tech_id FROM jobs WHERE id = ?",
      id,
    );
    let status = existing?.status ?? "unscheduled";
    if (status === "unscheduled" && start) status = "scheduled";
    if (status === "scheduled" && !start) status = "unscheduled";
    tx(() => {
      run(
        `UPDATE jobs SET ${Object.keys(fields).map((k) => `${k} = ?`).join(", ")}, status = ? WHERE id = ?`,
        ...Object.values(fields),
        status,
        id,
      );
      replaceItems("job", id, items);
      if (existing && (existing.scheduled_start !== start || existing.tech_id !== techId)) {
        logActivity({ customerId, jobId: id, userId: user.id, body: start ? `Scheduled for ${start.replace("T", " ")}` : "Schedule cleared" });
      }
    });
    jobId = id;
  } else {
    jobId = tx(() => {
      const number = nextNumber("jobs", 1001);
      const { id: newId } = run(
        `INSERT INTO jobs (number, ${Object.keys(fields).join(", ")}, status) VALUES (?, ${Object.keys(fields).map(() => "?").join(", ")}, ?)`,
        number,
        ...Object.values(fields),
        start ? "scheduled" : "unscheduled",
      );
      replaceItems("job", newId, items);
      logActivity({ customerId, jobId: newId, userId: user.id, body: `Job #${number} created` });
      return newId;
    });
  }
  done(`/jobs/${jobId}`);
}

export async function setJobStatus(fd: FormData) {
  const user = await requireUser();
  const id = num(fd, "id")!;
  const status = str(fd, "status") as JobStatus;
  if (!JOB_STATUSES.includes(status) || !canTouchJob(user, id)) redirect(`/jobs/${id}`);
  const job = getJob(id);
  if (!job) redirect("/jobs");
  const now = new Date().toISOString();
  run(
    `UPDATE jobs SET status = ?,
       started_at = CASE WHEN ? = 'in_progress' AND started_at IS NULL THEN ? ELSE started_at END,
       completed_at = CASE WHEN ? = 'completed' THEN ? WHEN ? != 'completed' THEN NULL ELSE completed_at END
     WHERE id = ?`,
    status,
    status,
    now,
    status,
    now,
    status,
    id,
  );
  const labels: Record<string, string> = {
    dispatched: "Technician on the way",
    in_progress: "Job started",
    completed: "Job finished",
    canceled: "Job canceled",
    scheduled: "Job marked scheduled",
    unscheduled: "Job moved to unscheduled",
  };
  logActivity({ customerId: job.customer_id, jobId: id, userId: user.id, body: labels[status] ?? status });
  done(`/jobs/${id}`);
}

export async function saveJobItems(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = num(fd, "id")!;
  if (!canTouchJob(user, id)) return { error: "You can only edit jobs assigned to you." };
  tx(() => {
    replaceItems("job", id, parseItems(fd));
    run("UPDATE jobs SET tax_rate = ? WHERE id = ?", taxRateField(fd), id);
    // A draft invoice with no payments follows the job's line items, so finishing then editing stays consistent.
    const draft = get<{ id: number }>(
      "SELECT id FROM invoices WHERE job_id = ? AND status = 'draft' AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.invoice_id = invoices.id)",
      id,
    );
    if (draft) {
      copyItems("job", id, "invoice", draft.id);
      run("UPDATE invoices SET tax_rate = ? WHERE id = ?", taxRateField(fd), draft.id);
    }
  });
  revalidatePath(`/jobs/${id}`);
  return { ok: "Line items saved." };
}

export async function saveTechNotes(fd: FormData) {
  const user = await requireUser();
  const id = num(fd, "id")!;
  if (canTouchJob(user, id)) {
    run(
      "UPDATE jobs SET appliance = ?, brand = ?, model = ?, serial = ?, private_notes = ? WHERE id = ?",
      str(fd, "appliance"),
      str(fd, "brand"),
      str(fd, "model"),
      str(fd, "serial"),
      str(fd, "private_notes"),
      id,
    );
  }
  done(`/jobs/${id}`);
}

/** Quick reschedule from the dispatch board. */
export async function quickSchedule(fd: FormData) {
  await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id")!;
  const { start, end } = scheduleFields(fd);
  const techId = num(fd, "tech_id");
  run(
    `UPDATE jobs SET scheduled_start = ?, scheduled_end = ?, tech_id = ?,
       status = CASE WHEN status = 'unscheduled' AND ? IS NOT NULL THEN 'scheduled' ELSE status END
     WHERE id = ?`,
    start,
    end,
    techId,
    start,
    id,
  );
  done(str(fd, "back") || "/schedule");
}

export async function deleteJob(fd: FormData) {
  await requireUser(["admin"]);
  const id = num(fd, "id");
  if (id) tx(() => removeJobs([id]));
  done("/jobs");
}

/* ---------- estimates ---------- */

export async function saveEstimate(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id");
  const customerId = num(fd, "customer_id");
  if (!customerId) return { error: "Pick a customer." };
  const items = parseItems(fd);
  const fields = [customerId, num(fd, "address_id"), str(fd, "title"), str(fd, "message"), str(fd, "valid_until") || null, taxRateField(fd)];
  let estId: number;
  if (id) {
    tx(() => {
      run("UPDATE estimates SET customer_id = ?, address_id = ?, title = ?, message = ?, valid_until = ?, tax_rate = ? WHERE id = ?", ...fields, id);
      replaceItems("estimate", id, items);
    });
    estId = id;
  } else {
    estId = tx(() => {
      const number = nextNumber("estimates", 5001);
      const validDays = parseInt(getSettings().estimate_valid_days || "30", 10);
      if (!fields[4]) fields[4] = addDays(today(), validDays);
      const { id: newId } = run(
        "INSERT INTO estimates (number, customer_id, address_id, title, message, valid_until, tax_rate, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        number,
        ...fields,
        randomToken(),
      );
      replaceItems("estimate", newId, items);
      logActivity({ customerId, userId: user.id, body: `Estimate #${number} created` });
      return newId;
    });
  }
  done(`/estimates/${estId}`);
}

export async function setEstimateStatus(fd: FormData) {
  const user = await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id")!;
  const status = str(fd, "status");
  if (!["draft", "sent", "approved", "declined"].includes(status)) redirect(`/estimates/${id}`);
  const est = get<{ customer_id: number; number: number }>("SELECT customer_id, number FROM estimates WHERE id = ?", id);
  run(
    "UPDATE estimates SET status = ?, responded_at = CASE WHEN ? IN ('approved','declined') THEN ? ELSE responded_at END WHERE id = ?",
    status,
    status,
    new Date().toISOString(),
    id,
  );
  logActivity({ customerId: est?.customer_id, userId: user.id, body: `Estimate #${est?.number} marked ${status}` });
  done(`/estimates/${id}`);
}

export async function convertEstimateToJob(fd: FormData) {
  const user = await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id")!;
  const est = get<{ customer_id: number; address_id: number | null; title: string; message: string; number: number; job_id: number | null; tax_rate: number | null }>(
    "SELECT customer_id, address_id, title, message, number, job_id, tax_rate FROM estimates WHERE id = ?",
    id,
  );
  if (!est) redirect("/estimates");
  if (est.job_id) redirect(`/jobs/${est.job_id}`);
  const jobId = tx(() => {
    const number = nextNumber("jobs", 1001);
    const { id: jid } = run(
      "INSERT INTO jobs (number, customer_id, address_id, title, description, estimate_id, status, tax_rate) VALUES (?, ?, ?, ?, ?, ?, 'unscheduled', ?)",
      number,
      est.customer_id,
      est.address_id,
      est.title || `Work from estimate #${est.number}`,
      est.message,
      id,
      est.tax_rate,
    );
    copyItems("estimate", id, "job", jid);
    run("UPDATE estimates SET status = 'converted', job_id = ? WHERE id = ?", jid, id);
    logActivity({ customerId: est.customer_id, jobId: jid, userId: user.id, body: `Job #${number} created from estimate #${est.number}` });
    return jid;
  });
  done(`/jobs/${jobId}`);
}

export async function deleteEstimate(fd: FormData) {
  await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id");
  tx(() => {
    run("DELETE FROM line_items WHERE parent_type = 'estimate' AND parent_id = ?", id);
    run("DELETE FROM estimates WHERE id = ?", id);
  });
  done("/estimates");
}

/* ---------- invoices ---------- */

export async function createInvoiceFromJob(fd: FormData) {
  const user = await requireUser();
  const jobId = num(fd, "job_id")!;
  if (!canTouchJob(user, jobId)) redirect(`/jobs/${jobId}`);
  const existing = get<{ id: number }>("SELECT id FROM invoices WHERE job_id = ? AND status != 'void' ORDER BY id DESC", jobId);
  if (existing) redirect(`/invoices/${existing.id}`);
  const job = getJob(jobId);
  if (!job) redirect("/jobs");
  const s = getSettings();
  const issued = today();
  const invId = tx(() => {
    const number = nextNumber("invoices", 2001);
    const { id } = run(
      "INSERT INTO invoices (number, customer_id, job_id, status, token, issued_on, due_on, notes, tax_rate) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?)",
      number,
      job.customer_id,
      jobId,
      randomToken(),
      issued,
      addDays(issued, parseInt(s.invoice_terms_days || "0", 10)),
      s.invoice_footer || "",
      job.tax_rate,
    );
    copyItems("job", jobId, "invoice", id);
    logActivity({ customerId: job.customer_id, jobId, userId: user.id, body: `Invoice #${number} created` });
    return id;
  });
  done(`/invoices/${invId}`);
}

export async function createBlankInvoice(fd: FormData) {
  const user = await requireUser(["admin", "dispatcher"]);
  const customerId = num(fd, "customer_id");
  if (!customerId) redirect("/invoices");
  const s = getSettings();
  const issued = today();
  const invId = tx(() => {
    const number = nextNumber("invoices", 2001);
    const { id } = run(
      "INSERT INTO invoices (number, customer_id, status, token, issued_on, due_on, notes) VALUES (?, ?, 'draft', ?, ?, ?, ?)",
      number,
      customerId,
      randomToken(),
      issued,
      addDays(issued, parseInt(s.invoice_terms_days || "0", 10)),
      s.invoice_footer || "",
    );
    logActivity({ customerId, userId: user.id, body: `Invoice #${number} created` });
    return id;
  });
  done(`/invoices/${invId}`);
}

export async function saveInvoice(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id")!;
  const issued = str(fd, "issued_on") || today();
  const due = str(fd, "due_on") || issued;
  tx(() => {
    run("UPDATE invoices SET issued_on = ?, due_on = ?, notes = ?, tax_rate = ? WHERE id = ?", issued, due, str(fd, "notes"), taxRateField(fd), id);
    replaceItems("invoice", id, parseItems(fd));
  });
  revalidatePath(`/invoices/${id}`);
  return { ok: "Invoice saved." };
}

export async function setInvoiceStatus(fd: FormData) {
  const user = await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id")!;
  const status = str(fd, "status");
  if (["draft", "sent", "void"].includes(status)) {
    if (status === "void") {
      try {
        await qbo.voidInvoice(id);
      } catch (e) {
        logActivity({ userId: user.id, body: `Could not void invoice in QuickBooks: ${(e as Error).message}` });
      }
    }
    run("UPDATE invoices SET status = ? WHERE id = ?", status, id);
    const inv = get<{ customer_id: number; number: number; job_id: number | null }>("SELECT customer_id, number, job_id FROM invoices WHERE id = ?", id);
    logActivity({ customerId: inv?.customer_id, jobId: inv?.job_id, userId: user.id, body: `Invoice #${inv?.number} marked ${status}` });
  }
  done(`/invoices/${id}`);
}

export async function recordPayment(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const invoiceId = num(fd, "invoice_id")!;
  const inv = get<{ customer_id: number; number: number; job_id: number | null; status: string }>(
    "SELECT customer_id, number, job_id, status FROM invoices WHERE id = ?",
    invoiceId,
  );
  if (!inv) return { error: "Invoice not found." };
  if (!isOffice(user) && !(inv.job_id && canTouchJob(user, inv.job_id))) return { error: "Not allowed." };
  if (inv.status === "void") return { error: "This invoice is void." };
  const amount = toCents(str(fd, "amount"));
  if (amount <= 0) return { error: "Enter an amount greater than zero." };
  const method = str(fd, "method");
  if (!method) return { error: "How did the customer pay? Pick e-Transfer, credit card, cash or cheque." };
  const paymentToken = randomToken();
  const paymentId = tx(() => {
    const { id: pid } = run(
      "INSERT INTO payments (invoice_id, amount_cents, method, reference, paid_on, recorded_by, token) VALUES (?, ?, ?, ?, ?, ?, ?)",
      invoiceId,
      amount,
      method,
      str(fd, "reference"),
      str(fd, "paid_on") || today(),
      user.id,
      paymentToken,
    );
    if (inv.status === "draft") run("UPDATE invoices SET status = 'sent' WHERE id = ?", invoiceId);
    logActivity({
      customerId: inv.customer_id,
      jobId: inv.job_id,
      userId: user.id,
      kind: "payment",
      body: `Payment of $${(amount / 100).toFixed(2)} (${msg.METHOD_LABEL[method] ?? method}) on invoice #${inv.number}`,
    });
    return pid;
  });
  let note = "";
  const synced = get<{ qbo_id: string | null }>("SELECT qbo_id FROM invoices WHERE id = ?", invoiceId);
  if (synced?.qbo_id && qbo.qboConfig().connected) {
    try {
      await qbo.syncInvoice(invoiceId);
      note = " Sent to QuickBooks.";
    } catch (e) {
      note = ` Not sent to QuickBooks: ${(e as Error).message}`;
    }
  }
  // Receipt
  const channels = (["sms", "email"] as const).filter((c) => fd.get(`receipt_${c}`));
  let receiptNote = "";
  let links: { label: string; href: string }[] = [];
  if (channels.length) {
    const r = await sendDocument({ kind: "receipt", invoiceId, paymentId, channels, byName: user.name });
    receiptNote = r.note;
    links = r.links;
  }
  revalidatePath("/", "layout");
  return { ok: `Payment recorded.${receiptNote}${note}`, links };
}

export async function deletePayment(fd: FormData) {
  await requireUser(["admin"]);
  run("DELETE FROM payments WHERE id = ?", num(fd, "id"));
  done(`/invoices/${num(fd, "invoice_id")}`);
}

/* ---------- price book ---------- */

export async function savePricebookItem(fd: FormData) {
  await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id");
  const vals = [
    str(fd, "kind") === "material" ? "material" : "service",
    str(fd, "appliance"),
    str(fd, "category"),
    str(fd, "name"),
    str(fd, "description"),
    toCents(str(fd, "price")),
    toCents(str(fd, "cost")),
    fd.get("taxable") ? 1 : 0,
    str(fd, "supplier").slice(0, 100),
  ] as const;
  if (!vals[3]) done("/pricebook");
  if (id) {
    run(
      "UPDATE pricebook SET kind = ?, appliance = ?, category = ?, name = ?, description = ?, unit_price_cents = ?, cost_cents = ?, taxable = ?, supplier = ? WHERE id = ?",
      ...vals,
      id,
    );
  } else {
    run(
      "INSERT INTO pricebook (kind, appliance, category, name, description, unit_price_cents, cost_cents, taxable, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ...vals,
    );
  }
  done(`/pricebook${vals[1] ? `?appliance=${encodeURIComponent(vals[1])}` : ""}`);
}

export async function togglePricebookItem(fd: FormData) {
  await requireUser(["admin", "dispatcher"]);
  run("UPDATE pricebook SET active = 1 - active WHERE id = ?", num(fd, "id"));
  done("/pricebook");
}

/* ---------- team ---------- */

export async function saveUser(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser(["admin"]);
  const id = num(fd, "id");
  const name = str(fd, "name");
  const email = str(fd, "email");
  const role = str(fd, "role");
  const password = str(fd, "password");
  if (!name || !email.includes("@")) return { error: "Name and a valid email are required." };
  if (!["admin", "dispatcher", "tech"].includes(role)) return { error: "Pick a role." };
  if (id === me.id && role !== "admin") return { error: "You can't remove your own admin role." };
  const clash = get<{ id: number }>("SELECT id FROM users WHERE email = ? AND id != ?", email, id ?? 0);
  if (clash) return { error: "Another team member already uses that email." };
  if (id) {
    run("UPDATE users SET name = ?, email = ?, phone = ?, role = ?, color = ? WHERE id = ?", name, email, str(fd, "phone"), role, str(fd, "color") || "#2563eb", id);
    if (password) {
      if (password.length < 8) return { error: "Passwords need at least 8 characters." };
      run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(password), id);
      run("DELETE FROM sessions WHERE user_id = ? AND user_id != ?", id, me.id);
    }
  } else {
    if (password.length < 8) return { error: "Set a starting password of at least 8 characters." };
    run(
      "INSERT INTO users (name, email, phone, role, color, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
      name,
      email,
      str(fd, "phone"),
      role,
      str(fd, "color") || "#2563eb",
      hashPassword(password),
    );
  }
  revalidatePath("/team");
  return { ok: id ? "Saved." : `${name} added. Share their email and starting password with them.` };
}

export async function toggleUserActive(fd: FormData) {
  const me = await requireUser(["admin"]);
  const id = num(fd, "id");
  if (id && id !== me.id) {
    run("UPDATE users SET active = 1 - active WHERE id = ?", id);
    run("DELETE FROM sessions WHERE user_id = ?", id);
  }
  done("/team");
}

export async function changeOwnPassword(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const row = get<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", me.id);
  if (!row || !verifyPassword(str(fd, "current"), row.password_hash)) return { error: "Current password is wrong." };
  const next = str(fd, "next");
  if (next.length < 8) return { error: "Use at least 8 characters." };
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(next), me.id);
  return { ok: "Password changed." };
}

/* ---------- settings ---------- */

const EDITABLE_SETTINGS = [
  "company_name",
  "company_phone",
  "company_email",
  "company_address",
  "company_website",
  "tax_name",
  "tax_rate",
  "tax_number",
  "time_zone",
  "invoice_terms_days",
  "invoice_footer",
  "estimate_valid_days",
];

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const tz = str(fd, "time_zone");
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
  } catch {
    return { error: `“${tz}” isn't a valid time zone. Try America/Toronto.` };
  }
  for (const key of EDITABLE_SETTINGS) {
    if (fd.has(key)) run("UPDATE settings SET value = ? WHERE key = ?", str(fd, key), key);
  }
  revalidatePath("/", "layout");
  return { ok: "Settings saved." };
}

export async function rotateBookingKey() {
  await requireUser(["admin"]);
  run("UPDATE settings SET value = ? WHERE key = 'booking_api_key'", randomToken(18));
  done("/settings");
}

export async function loadDemoData() {
  const me = await requireUser(["admin"]);
  const count = get<{ n: number }>("SELECT COUNT(*) AS n FROM customers")?.n ?? 0;
  if (count === 0) seedDemoData(me.id, timeZone());
  done("/");
}

/* ---------- customer portal (no login; access by unguessable token) ---------- */

export async function respondToEstimate(fd: FormData) {
  const token = str(fd, "token");
  const decision = str(fd, "decision");
  const est = get<{ id: number; customer_id: number; number: number; status: string }>(
    "SELECT id, customer_id, number, status FROM estimates WHERE token = ?",
    token,
  );
  if (!est || !["approved", "declined"].includes(decision) || !["sent", "draft"].includes(est.status)) {
    redirect(`/p/e/${token}`);
  }
  run("UPDATE estimates SET status = ?, responded_at = ? WHERE id = ?", decision, new Date().toISOString(), est.id);
  const sig = str(fd, "signature");
  logActivity({
    customerId: est.customer_id,
    kind: "portal",
    body: `Customer ${decision} estimate #${est.number} online${sig ? ` (signed: ${sig})` : ""}`,
  });
  revalidatePath("/", "layout");
  redirect(`/p/e/${token}?done=1`);
}

/* ---------- QuickBooks ---------- */

export async function saveQboKeys(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const id = str(fd, "qbo_client_id");
  const secret = str(fd, "qbo_client_secret");
  const env = str(fd, "qbo_env") === "sandbox" ? "sandbox" : "production";
  if (!id) return { error: "Paste the Client ID from your Intuit developer app." };
  run("UPDATE settings SET value = ? WHERE key = 'qbo_client_id'", id);
  if (secret) run("UPDATE settings SET value = ? WHERE key = 'qbo_client_secret'", secret);
  run("UPDATE settings SET value = ? WHERE key = 'qbo_env'", env);
  revalidatePath("/settings");
  return { ok: "Saved. Now click “Connect to QuickBooks”." };
}

export async function saveQboMapping(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  for (const k of ["qbo_item_id", "qbo_tax_13", "qbo_tax_5", "qbo_tax_0"]) run("UPDATE settings SET value = ? WHERE key = ?", str(fd, k), k);
  revalidatePath("/settings");
  return { ok: "QuickBooks mapping saved." };
}

export async function disconnectQbo() {
  await requireUser(["admin"]);
  await qbo.disconnect();
  done("/settings#quickbooks");
}

export async function syncInvoiceToQbo(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id")!;
  try {
    await qbo.syncInvoice(id);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const inv = get<{ customer_id: number; job_id: number | null; number: number }>("SELECT customer_id, job_id, number FROM invoices WHERE id = ?", id);
  logActivity({ customerId: inv?.customer_id, jobId: inv?.job_id, userId: user.id, body: `Invoice #${inv?.number} sent to QuickBooks` });
  revalidatePath(`/invoices/${id}`);
  return { ok: "Sent to QuickBooks." };
}

export async function syncAllToQbo(): Promise<FormState> {
  await requireUser(["admin"]);
  const pending = get<{ n: number }>("SELECT COUNT(*) AS n FROM invoices WHERE status = 'sent' AND (qbo_id IS NULL OR id IN (SELECT invoice_id FROM payments WHERE qbo_id IS NULL))")?.n ?? 0;
  if (!pending) return { ok: "Everything is already in QuickBooks." };
  const ids = all<{ id: number }>(
    "SELECT id FROM invoices WHERE status = 'sent' AND (qbo_id IS NULL OR id IN (SELECT invoice_id FROM payments WHERE qbo_id IS NULL)) ORDER BY id LIMIT 100",
  ).map((r) => r.id);
  // One at a time on purpose: QuickBooks rate-limits bursts.
  let ok = 0;
  const errors: string[] = [];
  for (const id of ids) {
    try {
      await qbo.syncInvoice(id);
      ok++;
    } catch (e) {
      errors.push(`#${get<{ number: number }>("SELECT number FROM invoices WHERE id = ?", id)?.number}: ${(e as Error).message}`);
      if (errors.length >= 3) break;
    }
  }
  revalidatePath("/", "layout");
  return errors.length ? { error: `Sent ${ok}. Problems: ${errors.join(" · ")}` } : { ok: `Sent ${ok} invoice${ok === 1 ? "" : "s"} to QuickBooks.` };
}

/* ---------- Housecall Pro import ---------- */

export async function importHousecallPro(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const { importCustomers, importJobs, importPricebook } = await import("./import-hcp");
  const files: [string, string][] = [
    ["pricebook", "Parts & services"],
    ["customers", "Customers"],
    ["jobs", "Jobs"],
  ];
  const lines: string[] = [];
  const warnings: string[] = [];
  let any = false;
  for (const [key, label] of files) {
    const file = fd.get(key);
    if (!(file instanceof File) || file.size === 0) continue;
    any = true;
    if (/\.(xlsx?|numbers)$/i.test(file.name)) {
      return { error: `${file.name} is an Excel file. Open it in Excel or Google Sheets, choose File → Save As (or Download) → CSV, and upload the .csv instead.` };
    }
    let text: string;
    if (/\.zip$/i.test(file.name)) {
      // Housecall Pro emails the customer list as a .zip; use the CSV inside it.
      const { firstCsvInZip } = await import("./unzip");
      const found = firstCsvInZip(Buffer.from(await file.arrayBuffer()));
      if (!found) return { error: `Couldn't find a CSV file inside ${file.name}. Unzip it and upload the .csv instead.` };
      text = found.text;
    } else {
      text = await file.text();
    }
    try {
      const r =
        key === "customers" ? importCustomers(text) : key === "jobs" ? importJobs(text, timeZone(), !!fd.get("includes_hst")) : importPricebook(text);
      lines.push(`${label}: ${r.created} added, ${r.updated} matched/updated, ${r.skipped} skipped`);
      warnings.push(...r.warnings);
    } catch (e) {
      return { error: `Couldn't import ${file.name}: ${(e as Error).message}. Nothing from that file was saved.` };
    }
  }
  if (!any) return { error: "Choose at least one CSV file to import." };
  revalidatePath("/", "layout");
  return { ok: ["Import finished.", ...lines, ...warnings.map((w) => `⚠ ${w}`)].join("\n") };
}

/* ---------- job finished, invoices, receipts, review requests ---------- */

/** Builds and sends an invoice or receipt by text and/or email; falls back to pre-written links. */
async function sendDocument(opts: {
  kind: "invoice" | "receipt";
  invoiceId: number;
  paymentId?: number;
  channels: readonly ("sms" | "email")[];
  byName?: string;
}): Promise<{ note: string; links: { label: string; href: string }[]; error?: string }> {
  const s = getSettings();
  const inv = get<{ id: number; number: number; token: string; customer_id: number; job_id: number | null }>(
    "SELECT id, number, token, customer_id, job_id FROM invoices WHERE id = ?",
    opts.invoiceId,
  );
  if (!inv) return { note: "", links: [], error: "Invoice not found." };
  const c = get<{ id: number; first_name: string; last_name: string; company: string; email: string; phone: string }>(
    "SELECT * FROM customers WHERE id = ?",
    inv.customer_id,
  )!;
  const origin = await appOrigin();
  const { getInvoice } = await import("./data");
  const full = getInvoice(inv.id)!;
  let vars: Record<string, string> = { ...msg.baseVars(c), invoice_number: String(inv.number) };
  if (opts.kind === "invoice") {
    vars = { ...vars, amount: msg.amountVar(Math.max(0, full.balance_cents) || full.total_cents), link: `${origin}/p/i/${inv.token}` };
  } else {
    const p = get<{ amount_cents: number; method: string; token: string | null }>("SELECT amount_cents, method, token FROM payments WHERE id = ?", opts.paymentId ?? 0);
    if (!p) return { note: "", links: [], error: "Payment not found." };
    vars = { ...vars, amount: msg.amountVar(p.amount_cents), method: msg.METHOD_LABEL[p.method] ?? p.method, link: `${origin}/p/r/${p.token}` };
  }
  const subject = opts.kind === "invoice" ? `Invoice #${inv.number} from ${s.company_name}` : `Receipt for invoice #${inv.number} – ${s.company_name}`;
  const smsBody = msg.fill(opts.kind === "invoice" ? s.tpl_invoice_sms : s.tpl_receipt_sms, vars);
  const emailBody = msg.fill(opts.kind === "invoice" ? s.tpl_invoice_email : s.tpl_receipt_email, vars);

  const sent: string[] = [];
  const problems: string[] = [];
  const links: { label: string; href: string }[] = [];
  const word = opts.kind === "invoice" ? "invoice" : "receipt";

  for (const ch of opts.channels) {
    if (ch === "sms") {
      if (!c.phone) {
        problems.push("no mobile number on file");
        continue;
      }
      if (msg.smsConfigured(s)) {
        const r = await msg.queueMessage({ kind: opts.kind, channel: "sms", recipient: c.phone, body: smsBody, customerId: c.id, jobId: inv.job_id, invoiceId: inv.id });
        if (r.ok) sent.push(`texted to ${c.phone}`);
        else problems.push(`text failed: ${r.error}`);
      } else {
        const to = msg.toE164(c.phone) ?? c.phone;
        links.push({ label: `Text ${word} from my phone`, href: `sms:${to}?&body=${encodeURIComponent(smsBody)}` });
      }
    } else {
      if (!c.email) {
        problems.push("no email on file");
        continue;
      }
      if (msg.emailConfigured(s)) {
        const r = await msg.queueMessage({ kind: opts.kind, channel: "email", recipient: c.email, subject, body: emailBody, customerId: c.id, jobId: inv.job_id, invoiceId: inv.id });
        if (r.ok) sent.push(`emailed to ${c.email}`);
        else problems.push(`email failed: ${r.error}`);
      } else {
        links.push({ label: `Email ${word} from my email app`, href: `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}` });
      }
    }
  }
  // Let the owner know (by email) that this went out, and who sent it.
  if (sent.length || links.length) {
    const on = opts.kind === "invoice" ? s.notify_invoice === "1" : s.notify_receipt === "1";
    const to = s.notify_email || s.company_email;
    if (on && to && msg.emailConfigured(s)) {
      const who = c.first_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company || "customer";
      const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company || "Customer";
      const how = [
        ...sent,
        ...links.map((l) => (l.href.startsWith("sms:") ? `text opened on ${opts.byName ?? "a team member"}'s phone` : `email opened in ${opts.byName ?? "a team member"}'s email app`)),
      ];
      const lines =
        opts.kind === "invoice"
          ? [
              `Invoice #${inv.number} was sent to ${fullName}.`,
              "",
              `Total: ${msg.amountVar(full.total_cents)}`,
              `Balance due: ${msg.amountVar(Math.max(0, full.balance_cents))}`,
            ]
          : [`A receipt for invoice #${inv.number} was sent to ${fullName}.`, "", `Payment: ${vars.amount} by ${vars.method}`, `Balance remaining: ${msg.amountVar(Math.max(0, full.balance_cents))}`];
      const body = [
        ...lines,
        `How: ${how.join("; ")}`,
        opts.byName ? `Sent by: ${opts.byName}` : "",
        links.length ? "(Texts and emails opened on a phone can't be confirmed as sent by the CRM.)" : "",
        "",
        `Open in the CRM: ${origin}/invoices/${inv.id}`,
        `What the customer sees: ${vars.link}`,
      ]
        .filter((x) => x !== "")
        .join("\n");
      await msg
        .queueMessage({
          kind: "notice",
          channel: "email",
          recipient: to,
          subject: opts.kind === "invoice" ? `Invoice #${inv.number} sent to ${who} – ${msg.amountVar(full.total_cents)}` : `Receipt sent to ${who} – ${vars.amount} (${vars.method})`,
          body,
          customerId: c.id,
          jobId: inv.job_id,
          invoiceId: inv.id,
        })
        .catch(() => undefined);
    }
  }

  const label = opts.kind === "invoice" ? "Invoice" : "Receipt";
  const parts = [
    sent.length ? ` ${label} ${sent.join(" and ")}.` : "",
    problems.length ? ` ${label} not sent: ${problems.join("; ")}.` : "",
    links.length ? ` Tap below to send it yourself (automatic sending isn't set up yet).` : "",
  ];
  return { note: parts.join(""), links };
}

export async function finishJob(fd: FormData) {
  const user = await requireUser();
  const id = num(fd, "id")!;
  if (!canTouchJob(user, id)) redirect(`/jobs/${id}`);
  const job = getJob(id);
  if (!job) redirect("/jobs");
  const s = getSettings();
  const now = new Date().toISOString();
  tx(() => {
    run(
      "UPDATE jobs SET status = 'completed', completed_at = ?, started_at = COALESCE(started_at, ?) WHERE id = ?",
      now,
      now,
      id,
    );
    logActivity({ customerId: job.customer_id, jobId: id, userId: user.id, body: "Job finished" });
    // Make sure there's an invoice ready to send.
    if (!get("SELECT id FROM invoices WHERE job_id = ? AND status != 'void'", id)) {
      const issued = today();
      const number = nextNumber("invoices", 2001);
      const { id: invId } = run(
        "INSERT INTO invoices (number, customer_id, job_id, status, token, issued_on, due_on, notes, tax_rate) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?)",
        number,
        job.customer_id,
        id,
        randomToken(),
        issued,
        addDays(issued, parseInt(s.invoice_terms_days || "0", 10)),
        s.invoice_footer || "",
        job.tax_rate,
      );
      copyItems("job", id, "invoice", invId);
      logActivity({ customerId: job.customer_id, jobId: id, userId: user.id, body: `Invoice #${number} created` });
    }
  });
  const review = msg.scheduleReviewRequest(id);
  if (review) logActivity({ customerId: job.customer_id, jobId: id, kind: "event", body: review });
  revalidatePath("/", "layout");
  redirect(`/jobs/${id}#checkout`);
}

export async function sendInvoice(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const invoiceId = num(fd, "invoice_id")!;
  const inv = get<{ job_id: number | null; status: string; customer_id: number; number: number }>(
    "SELECT job_id, status, customer_id, number FROM invoices WHERE id = ?",
    invoiceId,
  );
  if (!inv) return { error: "Invoice not found." };
  if (!isOffice(user) && !(inv.job_id && canTouchJob(user, inv.job_id))) return { error: "Not allowed." };
  if (inv.status === "void") return { error: "This invoice is void." };
  const channels = (["sms", "email"] as const).filter((c) => fd.get(c));
  if (!channels.length) return { error: "Choose text, email or both." };
  const r = await sendDocument({ kind: "invoice", invoiceId, channels, byName: user.name });
  if (r.error) return { error: r.error };
  if (inv.status === "draft") run("UPDATE invoices SET status = 'sent' WHERE id = ?", invoiceId);
  logActivity({ customerId: inv.customer_id, jobId: inv.job_id, userId: user.id, body: `Invoice #${inv.number} marked sent` });
  revalidatePath("/", "layout");
  return { ok: r.note.trim() || "Invoice ready to send.", links: r.links };
}

export async function sendReviewNow(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const jobId = num(fd, "job_id")!;
  if (!canTouchJob(user, jobId)) return { error: "Not allowed." };
  const s = getSettings();
  if (!s.google_review_url) return { error: "Add your Google review link in Settings → Google reviews first." };
  const job = get<{ customer_id: number }>("SELECT customer_id FROM jobs WHERE id = ?", jobId);
  const c = job && get<{ id: number; first_name: string; last_name: string; company: string; email: string; phone: string }>("SELECT * FROM customers WHERE id = ?", job.customer_id);
  if (!c) return { error: "Customer not found." };
  run("UPDATE messages SET status = 'canceled' WHERE job_id = ? AND kind = 'review' AND status = 'queued'", jobId);
  const body = msg.fill(s.tpl_review_sms, msg.baseVars(c));
  if (c.phone && msg.toE164(c.phone)) {
    if (msg.smsConfigured(s)) {
      const r = await msg.queueMessage({ kind: "review", channel: "sms", recipient: c.phone, body, customerId: c.id, jobId });
      revalidatePath(`/jobs/${jobId}`);
      return r.ok ? { ok: `Review request texted to ${c.phone}.` } : { error: `Text failed: ${r.error}` };
    }
    run(
      "INSERT INTO messages (kind, channel, customer_id, job_id, recipient, body, status, send_after, sent_at) VALUES ('review','sms',?,?,?,?, 'sent', ?, ?)",
      c.id,
      jobId,
      c.phone,
      body,
      new Date().toISOString(),
      new Date().toISOString(),
    );
    revalidatePath(`/jobs/${jobId}`);
    return { ok: "Tap below to text the review request from your phone.", links: [{ label: "Text review request", href: `sms:${msg.toE164(c.phone)}?&body=${encodeURIComponent(body)}` }] };
  }
  if (c.email) {
    const emailBody = msg.fill(s.tpl_review_email, msg.baseVars(c));
    const subject = `How did we do? – ${s.company_name}`;
    if (msg.emailConfigured(s)) {
      const r = await msg.queueMessage({ kind: "review", channel: "email", recipient: c.email, subject, body: emailBody, customerId: c.id, jobId });
      revalidatePath(`/jobs/${jobId}`);
      return r.ok ? { ok: `Review request emailed to ${c.email}.` } : { error: `Email failed: ${r.error}` };
    }
    return { ok: "Tap below to email the review request.", links: [{ label: "Email review request", href: `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}` }] };
  }
  return { error: "This customer has no mobile number or email on file." };
}

export async function cancelReview(fd: FormData) {
  const user = await requireUser();
  const jobId = num(fd, "job_id")!;
  if (canTouchJob(user, jobId)) run("UPDATE messages SET status = 'canceled' WHERE job_id = ? AND kind = 'review' AND status = 'queued'", jobId);
  done(`/jobs/${jobId}#checkout`);
}

const MESSAGING_SETTINGS = ["twilio_sid", "twilio_from", "smtp_host", "smtp_port", "smtp_user", "smtp_from_name"];
const SECRET_SETTINGS = ["twilio_token", "smtp_pass"];
const REVIEW_SETTINGS = ["google_review_url", "review_delay_minutes", "review_cooldown_days", "tpl_review_sms", "tpl_review_email", "tpl_invoice_sms", "tpl_invoice_email", "tpl_receipt_sms", "tpl_receipt_email"];

export async function saveMessagingSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  for (const k of MESSAGING_SETTINGS) if (fd.has(k)) run("UPDATE settings SET value = ? WHERE key = ?", str(fd, k), k);
  for (const k of SECRET_SETTINGS) if (str(fd, k)) run("UPDATE settings SET value = ? WHERE key = ?", str(fd, k), k);
  if (fd.has("notify_present")) {
    const notifyEmail = str(fd, "notify_email");
    if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) return { error: "That notification email address doesn't look right." };
    run("UPDATE settings SET value = ? WHERE key = 'notify_email'", notifyEmail);
    run("UPDATE settings SET value = ? WHERE key = 'notify_invoice'", fd.get("notify_invoice") ? "1" : "0");
    run("UPDATE settings SET value = ? WHERE key = 'notify_receipt'", fd.get("notify_receipt") ? "1" : "0");
  }
  if (str(fd, "twilio_from") && !msg.toE164(str(fd, "twilio_from"))) return { error: "The Twilio number should look like +16135551234." };
  if (str(fd, "twilio_from")) run("UPDATE settings SET value = ? WHERE key = 'twilio_from'", msg.toE164(str(fd, "twilio_from"))!);
  revalidatePath("/settings");
  return { ok: "Saved. Use “Send a test” to check it works." };
}

export async function saveReviewSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const url = str(fd, "google_review_url");
  if (url && !/^https:\/\//.test(url)) return { error: "The review link should start with https://" };
  for (const k of REVIEW_SETTINGS) if (fd.has(k)) run("UPDATE settings SET value = ? WHERE key = ?", str(fd, k), k);
  run("UPDATE settings SET value = ? WHERE key = 'review_auto'", fd.get("review_auto") ? "1" : "0");
  revalidatePath("/settings");
  return { ok: "Saved." };
}

export async function sendTestMessage(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser(["admin"]);
  const channel = str(fd, "channel") === "email" ? "email" : "sms";
  const to = str(fd, "to");
  if (!to) return { error: channel === "sms" ? "Enter your mobile number." : "Enter your email address." };
  const s = getSettings();
  if (channel === "sms" && !msg.smsConfigured(s)) return { error: "Save your Twilio details first." };
  if (channel === "email" && !msg.emailConfigured(s)) return { error: "Save your email details first." };
  const r = await msg.queueMessage({
    kind: "test",
    channel,
    recipient: to,
    subject: `Test from ${s.company_name} CRM`,
    body: `This is a test message from your ${s.company_name} CRM, sent by ${me.name}. If you got this, it works!`,
  });
  return r.ok ? { ok: `Test ${channel === "sms" ? "text" : "email"} sent to ${to}.` } : { error: r.error };
}

export async function sendReceipt(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const paymentId = num(fd, "payment_id")!;
  const p = get<{ invoice_id: number; token: string | null }>("SELECT invoice_id, token FROM payments WHERE id = ?", paymentId);
  if (!p) return { error: "Payment not found." };
  const inv = get<{ job_id: number | null }>("SELECT job_id FROM invoices WHERE id = ?", p.invoice_id);
  if (!isOffice(user) && !(inv?.job_id && canTouchJob(user, inv.job_id))) return { error: "Not allowed." };
  if (!p.token) run("UPDATE payments SET token = ? WHERE id = ?", randomToken(), paymentId);
  const channels = (["sms", "email"] as const).filter((c) => fd.get(c));
  if (!channels.length) return { error: "Choose text, email or both." };
  const r = await sendDocument({ kind: "receipt", invoiceId: p.invoice_id, paymentId, channels, byName: user.name });
  if (r.error) return { error: r.error };
  revalidatePath("/", "layout");
  return { ok: r.note.trim() || "Receipt ready to send.", links: r.links };
}

/** Records the remaining balance as paid on each selected invoice (used to tidy up after an import). */
export async function markInvoicesPaid(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["admin", "dispatcher"]);
  const ids = fd.getAll("ids").map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
  if (!ids.length) return { error: "Tick the invoices you want to mark as paid." };
  const method = str(fd, "method") || "other";
  const { getInvoice } = await import("./data");
  let count = 0;
  tx(() => {
    for (const id of ids) {
      const inv = getInvoice(id);
      if (!inv || inv.status === "void" || inv.balance_cents <= 0) continue;
      run(
        "INSERT INTO payments (invoice_id, amount_cents, method, reference, paid_on, recorded_by, token) VALUES (?, ?, ?, 'Marked paid', ?, ?, ?)",
        id,
        inv.balance_cents,
        method,
        str(fd, "date_mode") === "today" ? today() : inv.issued_on,
        user.id,
        randomToken(),
      );
      run("UPDATE invoices SET status = 'sent' WHERE id = ? AND status = 'draft'", id);
      logActivity({ customerId: inv.customer_id, jobId: inv.job_id, userId: user.id, kind: "payment", body: `Invoice #${inv.number} marked paid` });
      count++;
    }
  });
  revalidatePath("/", "layout");
  return count ? { ok: `Marked ${count} invoice${count === 1 ? "" : "s"} as paid.` } : { error: "None of the selected invoices had a balance to pay." };
}

export async function saveAddressSearchKey(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const key = str(fd, "google_maps_api_key");
  if (!key) return { error: "Paste your Google API key." };
  run("UPDATE settings SET value = ? WHERE key = 'google_maps_api_key'", key);
  const { autocomplete } = await import("./places");
  try {
    await autocomplete("200 Bay Street Ottawa", "settings-check");
  } catch (e) {
    revalidatePath("/settings");
    return { error: `Saved, but Google rejected a test search: ${(e as Error).message.replace(/\.$/, "")}. Check that Places API (New) is enabled for this key.` };
  }
  revalidatePath("/", "layout");
  return { ok: "Saved and tested. Address search is on." };
}

/* ---------- website: allowed addresses and Google reviews ---------- */

export async function saveWebsiteOrigins(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const list = str(fd, "website_origins")
    .split(/[\s,]+/)
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const bad = list.filter((o) => !/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(o));
  if (bad.length) return { error: `These don't look like website addresses: ${bad.join(", ")}. Use the form https://superfixmech.ca` };
  run("UPDATE settings SET value = ? WHERE key = 'website_origins'", list.join(", "));
  revalidatePath("/settings");
  return { ok: "Saved." };
}

export async function linkGoogleBusiness(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const placeId = str(fd, "place_id");
  if (!/^[\w-]{10,300}$/.test(placeId)) return { error: "Pick a business." };
  const set = (k: string, v: string) => run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", k, v);
  set("google_place_id", placeId);
  set("google_place_confirmed", "1");
  set("reviews_cache", "");
  const { getPublicReviews } = await import("./reviews");
  try {
    const r = await getPublicReviews(true);
    revalidatePath("/settings");
    return { ok: r ? `Linked to “${r.name}”: ${r.rating ?? "–"}★ from ${r.count} reviews. Your website will show these.` : "Linked." };
  } catch (e) {
    set("google_place_confirmed", "");
    revalidatePath("/settings");
    return { error: `Couldn't load that business from Google: ${(e as Error).message}` };
  }
}

export async function unlinkGoogleBusiness() {
  await requireUser(["admin"]);
  for (const k of ["google_place_id", "google_place_confirmed", "reviews_cache"]) run("UPDATE settings SET value = '' WHERE key = ?", k);
  done("/settings#website");
}

export async function refreshGoogleReviews(): Promise<FormState> {
  await requireUser(["admin"]);
  const { getPublicReviews } = await import("./reviews");
  try {
    const r = await getPublicReviews(true);
    if (!r) return { error: "Choose your Google business first." };
    revalidatePath("/settings");
    return { ok: `Updated: ${r.rating ?? "–"}★ from ${r.count} reviews.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/* ---------- choosing which reviews the website shows ---------- */

function writeJsonSetting(key: string, value: unknown) {
  run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, JSON.stringify(value));
}

export async function saveReviewSelection(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const { getGoogleReviews, manualReviews } = await import("./reviews");
  const shown = new Set(fd.getAll("show").map(String));
  const all = [...manualReviews(), ...((await getGoogleReviews().catch(() => null))?.reviews ?? [])];
  writeJsonSetting("reviews_hidden", all.filter((r) => !shown.has(r.id)).map((r) => r.id));
  const min = str(fd, "reviews_min_rating");
  if (["1", "2", "3", "4", "5"].includes(min)) run("UPDATE settings SET value = ? WHERE key = 'reviews_min_rating'", min);
  revalidatePath("/settings");
  return { ok: "Saved. Your website shows the ticked reviews (it can take up to 30 minutes for visitors' browsers to catch up)." };
}

export async function addManualReview(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(["admin"]);
  const author = str(fd, "author").slice(0, 80);
  const text = str(fd, "text").slice(0, 2000);
  const rating = Math.min(5, Math.max(1, Number(str(fd, "rating")) || 5));
  if (!author || !text) return { error: "Add the reviewer's name and what they wrote." };
  const { manualReviews } = await import("./reviews");
  const list = manualReviews();
  list.push({ id: `m${randomToken(6)}`, source: "manual", author, authorUrl: "", photo: "", rating, text, when: str(fd, "when").slice(0, 40) });
  writeJsonSetting("reviews_manual", list);
  revalidatePath("/settings");
  return { ok: `Added ${author}'s review. It shows first on your website.` };
}

export async function removeManualReview(fd: FormData) {
  await requireUser(["admin"]);
  const { manualReviews } = await import("./reviews");
  writeJsonSetting("reviews_manual", manualReviews().filter((r) => r.id !== str(fd, "id")));
  done("/settings#reviews-shown");
}

/** Invoices list: one form, two buttons (mark paid / delete). */
export async function invoicesBulk(state: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "op") === "delete") {
    fd.set("kind", "invoices");
    return deleteSelected(state, fd);
  }
  return markInvoicesPaid(state, fd);
}
