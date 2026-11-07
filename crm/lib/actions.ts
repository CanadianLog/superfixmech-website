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

export type FormState = { error?: string; ok?: string } | undefined;

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
      }));
  } catch {
    return [];
  }
}

function replaceItems(parentType: "job" | "estimate" | "invoice", parentId: number, items: LineItemInput[]) {
  run("DELETE FROM line_items WHERE parent_type = ? AND parent_id = ?", parentType, parentId);
  items.forEach((i, idx) =>
    run(
      `INSERT INTO line_items (parent_type, parent_id, kind, name, description, quantity, unit_price_cents, taxable, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      parentType,
      parentId,
      i.kind,
      i.name,
      i.description,
      i.quantity,
      i.unit_price_cents,
      i.taxable ? 1 : 0,
      idx,
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

/* ---------- customers ---------- */

export async function saveCustomer(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["admin", "dispatcher"]);
  const id = num(fd, "id");
  const fields = ["first_name", "last_name", "company", "email", "phone", "alt_phone", "tags", "lead_source", "notes"] as const;
  const values = fields.map((f) => str(fd, f));
  if (!values[0] && !values[1] && !values[2]) return { error: "Add a name or company." };

  let customerId: number;
  if (id) {
    run(`UPDATE customers SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`, ...values, id);
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
  if (id) {
    tx(() => {
      for (const t of ["job", "estimate", "invoice"] as const) {
        const table = t === "job" ? "jobs" : t === "estimate" ? "estimates" : "invoices";
        run(
          `DELETE FROM line_items WHERE parent_type = ? AND parent_id IN (SELECT id FROM ${table} WHERE customer_id = ?)`,
          t,
          id,
        );
      }
      run("DELETE FROM customers WHERE id = ?", id);
    });
  }
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
  tx(() => {
    run("DELETE FROM line_items WHERE parent_type = 'job' AND parent_id = ?", id);
    run("DELETE FROM jobs WHERE id = ?", id);
  });
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
  tx(() => {
    run(
      "INSERT INTO payments (invoice_id, amount_cents, method, reference, paid_on, recorded_by) VALUES (?, ?, ?, ?, ?, ?)",
      invoiceId,
      amount,
      str(fd, "method") || "card",
      str(fd, "reference"),
      str(fd, "paid_on") || today(),
      user.id,
    );
    if (inv.status === "draft") run("UPDATE invoices SET status = 'sent' WHERE id = ?", invoiceId);
    logActivity({
      customerId: inv.customer_id,
      jobId: inv.job_id,
      userId: user.id,
      kind: "payment",
      body: `Payment of $${(amount / 100).toFixed(2)} (${str(fd, "method") || "card"}) on invoice #${inv.number}`,
    });
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
  revalidatePath("/", "layout");
  return { ok: `Payment recorded.${note}` };
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
  ] as const;
  if (!vals[3]) done("/pricebook");
  if (id) {
    run(
      "UPDATE pricebook SET kind = ?, appliance = ?, category = ?, name = ?, description = ?, unit_price_cents = ?, cost_cents = ?, taxable = ? WHERE id = ?",
      ...vals,
      id,
    );
  } else {
    run(
      "INSERT INTO pricebook (kind, appliance, category, name, description, unit_price_cents, cost_cents, taxable) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
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
