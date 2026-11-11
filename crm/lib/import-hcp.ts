import "server-only";
import { all, get, getSettings, nextNumber, run, tx } from "./db";
import { parseCSV } from "./csv";
import { randomToken } from "./auth";
import { APPLIANCE_TYPES, toCents } from "./format";

/**
 * Imports the CSV exports from Housecall Pro (customers, jobs, price book).
 * Columns are matched by name, so the order doesn't matter and missing columns are fine.
 * Every record remembers its Housecall Pro ID, so importing the same file twice skips what's already there.
 */

export type ImportReport = { created: number; updated: number; skipped: number; warnings: string[] };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

type Row = { get: (...names: string[]) => string; raw: string[] };

function table(text: string): { headers: string[]; rawHeaders: string[]; rows: Row[] } {
  const [head = [], ...body] = parseCSV(text);
  const rawHeaders = head.map((h) => h.trim());
  const headers = head.map(norm);
  const rows = body.map((raw) => ({
    raw,
    get: (...names: string[]) => {
      for (const n of names) {
        const i = headers.indexOf(norm(n));
        if (i >= 0 && raw[i]?.trim()) return raw[i].trim();
      }
      return "";
    },
  }));
  return { headers, rawHeaders, rows };
}

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

function findCustomer(opts: { externalId?: string; email?: string; phone?: string; first?: string; last?: string; company?: string; fullName?: string }): number | undefined {
  if (opts.externalId) {
    const r = get<{ id: number }>("SELECT id FROM customers WHERE external_id = ?", opts.externalId);
    if (r) return r.id;
  }
  // A shared email or phone (families, landlords) only counts as the same customer when the names don't disagree.
  const sameName = (c: { first_name: string; last_name: string }) => {
    const mine = `${opts.first ?? ""} ${opts.last ?? ""}`.trim().toLowerCase();
    const theirs = `${c.first_name} ${c.last_name}`.trim().toLowerCase();
    return !mine || !theirs || mine === theirs;
  };
  if (opts.email) {
    const rows = all<{ id: number; first_name: string; last_name: string }>(
      "SELECT id, first_name, last_name FROM customers WHERE email = ? COLLATE NOCASE AND email != '' ORDER BY id",
      opts.email,
    );
    const hit = rows.find(sameName);
    if (hit) return hit.id;
  }
  const d = digits(opts.phone ?? "");
  if (d.length >= 7) {
    const rows = all<{ id: number; first_name: string; last_name: string }>(
      "SELECT id, first_name, last_name FROM customers WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,'-',''),' ',''),'(',''),')',''),'.',''),'+','') LIKE ? ORDER BY id",
      `%${d}`,
    );
    const hit = rows.find(sameName);
    if (hit) return hit.id;
  }
  if (opts.first || opts.last) {
    const r = get<{ id: number }>(
      "SELECT id FROM customers WHERE first_name = ? COLLATE NOCASE AND last_name = ? COLLATE NOCASE",
      opts.first ?? "",
      opts.last ?? "",
    );
    if (r) return r.id;
  } else if (opts.company) {
    const r = get<{ id: number }>("SELECT id FROM customers WHERE company = ? COLLATE NOCASE AND first_name = '' AND last_name = ''", opts.company);
    if (r) return r.id;
  }
  // Job exports only carry the customer's display name: match "First Last" or the company name.
  const full = opts.fullName?.trim();
  if (full) {
    const r = get<{ id: number }>(
      `SELECT id FROM customers
        WHERE TRIM(first_name || ' ' || last_name) = ? COLLATE NOCASE
           OR (company != '' AND company = ? COLLATE NOCASE)
        ORDER BY id LIMIT 1`,
      full,
      full,
    );
    if (r) return r.id;
  }
  return undefined;
}

/** Splits a one-line address like "12 Main St, Unit 4, Ottawa, ON K1A 0A1" into parts. */
export function splitAddress(full: string): { street: string; unit: string; city: string; province: string; postal: string } {
  const parts = full.split(",").map((p) => p.trim()).filter(Boolean);
  const out = { street: "", unit: "", city: "", province: "", postal: "" };
  if (!parts.length) return out;
  const postalRe = /([A-Za-z]\d[A-Za-z])\s?(\d[A-Za-z]\d)/;
  // Last part usually holds province and postal code ("ON K1A 0A1"), sometimes followed by "Canada".
  if (parts.length > 1 && /^(canada|ca)$/i.test(parts[parts.length - 1])) parts.pop();
  const last = parts[parts.length - 1] ?? "";
  const pm = last.match(postalRe);
  const prov = last.replace(postalRe, "").trim().replace(/^(ontario)$/i, "ON").replace(/^(quebec|québec)$/i, "QC");
  if (parts.length >= 3 && (pm || /^[A-Za-z]{2}$/.test(prov))) {
    out.postal = pm ? `${pm[1]} ${pm[2]}`.toUpperCase() : "";
    out.province = /^[A-Za-z]{2}$/.test(prov) ? prov.toUpperCase() : "ON";
    parts.pop();
    out.city = parts.pop() ?? "";
  } else if (parts.length === 2) {
    out.city = parts.pop() ?? "";
  }
  // What's left is the street, plus maybe a unit ("Unit 4", "#4", "Apt 2", or a short number).
  if (parts.length >= 2) {
    const unitIdx = parts.findIndex((p) => /^(unit|apt|suite|ste|#)\s*\w+|^\d{1,4}[a-z]?$/i.test(p));
    if (unitIdx >= 0) out.unit = parts.splice(unitIdx, 1)[0];
  }
  out.street = parts.join(", ");
  return out;
}

function ensureAddress(customerId: number, a: { street: string; unit?: string; city?: string; province?: string; postal?: string; notes?: string }): number | null {
  if (!a.street) return null;
  const existing = get<{ id: number }>("SELECT id FROM addresses WHERE customer_id = ? AND street = ? COLLATE NOCASE", customerId, a.street);
  if (existing) return existing.id;
  return run(
    "INSERT INTO addresses (customer_id, street, unit, city, province, postal_code, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
    customerId,
    a.street,
    a.unit ?? "",
    a.city ?? "",
    (a.province || "ON").slice(0, 20),
    (a.postal ?? "").toUpperCase(),
    a.notes ?? "",
  ).id;
}

/* ---------------- customers ---------------- */

export function importCustomers(text: string): ImportReport {
  const { headers, rows } = table(text);
  const report: ImportReport = { created: 0, updated: 0, skipped: 0, warnings: [] };

  // Housecall Pro repeats a block of address columns for each address a customer has.
  const groups: Record<string, number>[] = [];
  headers.forEach((h, i) => {
    if (/streetline1$/.test(h) || h === "street" || h === "streetaddress") groups.push({ street: i });
    const g = groups[groups.length - 1];
    if (!g) return;
    if (/streetline2$/.test(h) || h === "unit" || h === "apt") g.unit ??= i;
    else if (/city$/.test(h)) g.city ??= i;
    else if (/(state|province)$/.test(h)) g.province ??= i;
    else if (/(postalcode|zip|zipcode)$/.test(h)) g.postal ??= i;
    else if (/^address\d*notes$/.test(h)) g.notes ??= i;
  });

  tx(() => {
    for (const r of rows) {
      const first = r.get("First Name");
      const last = r.get("Last Name");
      const company = r.get("Company");
      const fullName = r.get("Customer", "Name", "Display Name");
      const [f, l] = first || last ? [first, last] : company ? ["", ""] : fullName ? [fullName.split(" ")[0], fullName.split(" ").slice(1).join(" ")] : ["", ""];
      if (!f && !l && !company) {
        report.skipped++;
        continue;
      }
      const data = {
        first_name: f,
        last_name: l,
        company,
        email: r.get("Email", "Email Address"),
        phone: r.get("Mobile Number", "Mobile Phone", "Phone", "Phone Number", "Cell"),
        alt_phone: r.get("Home Number", "Home Phone", "Work Number", "Work Phone"),
        tags: r.get("Tags", "Customer Tags"),
        lead_source: r.get("Lead Source", "Source"),
        notes: r.get("Notes", "Customer Notes"),
      };
      const externalId = r.get("ID", "HCP Id", "Customer ID");
      const existing = findCustomer({ externalId, email: data.email, phone: data.phone, first: f, last: l, company });

      let id: number;
      if (existing) {
        // Only fill in blanks; never overwrite what's already in the CRM.
        const cur = get<Record<string, string>>("SELECT * FROM customers WHERE id = ?", existing)!;
        const sets = Object.entries(data).filter(([k, v]) => v && !cur[k]);
        if (sets.length) run(`UPDATE customers SET ${sets.map(([k]) => `${k} = ?`).join(", ")} WHERE id = ?`, ...sets.map(([, v]) => v), existing);
        if (externalId && !cur.external_id) run("UPDATE customers SET external_id = ? WHERE id = ?", externalId, existing);
        id = existing;
        report.updated++;
      } else {
        id = run(
          `INSERT INTO customers (first_name, last_name, company, email, phone, alt_phone, tags, lead_source, notes, external_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ...Object.values(data),
          externalId || null,
        ).id;
        run("INSERT INTO activities (customer_id, kind, body) VALUES (?, 'event', 'Imported from Housecall Pro')", id);
        report.created++;
      }
      for (const g of groups) {
        const v = (k: string) => (g[k] !== undefined ? (r.raw[g[k]] ?? "").trim() : "");
        ensureAddress(id, { street: v("street"), unit: v("unit"), city: v("city"), province: v("province"), postal: v("postal"), notes: v("notes") });
      }
    }
  });
  return report;
}

/* ---------------- jobs ---------------- */

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (n: number) => String(n).padStart(2, "0");

function parseTime(s: string): string | undefined {
  const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i);
  if (!m) return undefined;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ap = m[3]?.toLowerCase()[0];
  if (!m[2] && !ap) return undefined; // a bare number isn't a time
  if (ap === "p" && h < 12) h += 12;
  if (ap === "a" && h === 12) h = 0;
  if (h > 23 || min > 59) return undefined;
  return `${pad(h)}:${pad(min)}`;
}

/** Accepts ISO dates, M/D/YYYY (as Housecall Pro exports), and "Nov 7, 2026 10:00 AM" styles. */
export function parseDateTime(input: string, tz: string): { date?: string; time?: string } {
  const s = input.trim();
  if (!s) return {};
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?(.*)$/);
  if (m) {
    if (m[4] && /Z|[+-]\d{2}:?\d{2}/.test(m[6])) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const p = Object.fromEntries(
          new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
            .formatToParts(d)
            .map((x) => [x.type, x.value]),
        );
        return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
      }
    }
    return { date: `${m[1]}-${m[2]}-${m[3]}`, time: m[4] ? `${m[4]}:${m[5]}` : undefined };
  }
  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})(.*)$/); // 2025/11/07
  if (m) return valid(Number(m[1]), Number(m[2]), Number(m[3]), m[4]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(.*)$/); // 11/07/2025 (US), or 25/11/2025 when the first number can't be a month
  if (m) {
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    const a = Number(m[1]);
    const b = Number(m[2]);
    return a > 12 ? valid(y, b, a, m[4]) : valid(y, a, b, m[4]);
  }
  m = s.match(/^(\d{1,2})[\s-]([a-z]{3})[a-z]*\.?[\s-,]+(\d{4})(.*)$/i); // 7 Nov 2025, 07-Nov-2025
  if (m && MONTHS.includes(m[2].toLowerCase())) return valid(Number(m[3]), MONTHS.indexOf(m[2].toLowerCase()) + 1, Number(m[1]), m[4]);
  m = s.match(/^(\d{5})(\.\d+)?$/); // Excel serial date (e.g. 45968)
  if (m && Number(m[1]) > 30000 && Number(m[1]) < 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400_000);
    return valid(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), m[2] ? `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : "");
  }
  m = s.match(/([a-z]{3})[a-z]*\.?[\s-]+(\d{1,2})(?:st|nd|rd|th)?,?[\s-]+(\d{4})(.*)$/i); // Nov 7, 2025 / Friday, November 7, 2025 2:30 PM
  if (m && MONTHS.includes(m[1].toLowerCase())) return valid(Number(m[3]), MONTHS.indexOf(m[1].toLowerCase()) + 1, Number(m[2]), m[4]);
  return {};
}

function valid(y: number, mo: number, d: number, rest: string): { date?: string; time?: string } {
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return {};
  return { date: `${y}-${pad(mo)}-${pad(d)}`, time: parseTime(rest ?? "") };
}

/**
 * Finds a date in any column whose name looks like a date (used when none of the usual names match).
 * Columns whose name matches `prefer` are tried first.
 */
function dateFinder(rawHeaders: string[]) {
  const looksLikeDate = /(date|time|when|day|scheduled|schedule|start|end|completed|complete|finished|finish|created|closed|paid|at$)/i;
  const cols = rawHeaders.map((h, i) => ({ h, i })).filter(({ h }) => looksLikeDate.test(h.replace(/[^a-z]/gi, "")));
  return (r: Row, prefer: RegExp, tz: string, onlyPreferred = false) => {
    const ordered = onlyPreferred ? cols.filter(({ h }) => prefer.test(h)) : [...cols.filter(({ h }) => prefer.test(h)), ...cols.filter(({ h }) => !prefer.test(h))];
    for (const { i } of ordered) {
      const got = parseDateTime(r.raw[i] ?? "", tz);
      if (got.date) return got;
    }
    return {};
  };
}

function mapStatus(status: string, finished: string, hasDate: boolean): string {
  const s = status.toLowerCase();
  if (s.includes("cancel")) return "canceled";
  if (s.includes("complete") || s.includes("finish") || s.includes("paid") || (finished && !/^(no|false|0)$/i.test(finished))) return "completed";
  if (s.includes("progress") || s.includes("started")) return "in_progress";
  if (s.includes("unscheduled") || s.includes("needs scheduling")) return "unscheduled";
  return hasDate ? "scheduled" : "unscheduled";
}

function parseRate(rateText: string, taxCents: number, taxableCents: number): number {
  let rate = parseFloat(rateText.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(rate) && rate > 0 && rate < 1) rate *= 100;
  if (!Number.isFinite(rate) || rate <= 0) rate = taxCents > 0 && taxableCents > 0 ? (taxCents / taxableCents) * 100 : 0;
  // Snap to the CRM's tax choices when it's clearly one of them.
  for (const r of [13, 5, 0]) if (Math.abs(rate - r) < 0.6) return r;
  return Math.round(rate * 100) / 100;
}

/**
 * Works out what a Housecall Pro job was worth and how much was paid, from whichever columns
 * the export has: a paid amount, an amount due/balance, or a payment/invoice status saying "paid".
 */
function moneyFrom(r: Row) {
  const amount = toCents(r.get("Amount", "Total", "Total Amount", "Job Amount", "Job Total", "Invoice Total", "Invoice Amount", "Grand Total", "Total Price"));
  const taxCents = toCents(r.get("Tax", "Tax Amount", "Total Tax"));
  const subtotal = toCents(r.get("Subtotal", "Sub Total", "Sub-total")) || Math.max(0, amount - taxCents);
  const taxable = toCents(r.get("Taxable Amount")) || (taxCents > 0 ? subtotal : 0);
  const rate = parseRate(r.get("Tax rate", "Tax Rate", "Tax %"), taxCents, taxable);
  const total = amount || subtotal + taxCents;

  // Only trust plain money values (a date in a "Due" column must not be read as an amount).
  const isMoney = (v: string) => /^\(?-?\$?\s*-?[\d,]+(\.\d{1,2})?\)?$/.test(v.trim());
  const moneyCol = (...names: string[]) => names.map((n) => r.get(n)).find((v) => v && isMoney(v)) ?? "";
  const paidText = moneyCol("Paid Amount", "Amount Paid", "Total Paid", "Paid", "Payments", "Payment Amount", "Collected", "Amount Collected");
  const dueText = moneyCol("Due", "Amount Due", "Due Amount", "Balance", "Balance Due", "Outstanding", "Outstanding Balance", "Open Balance", "Remaining Balance");
  const statusText = `${r.get("Payment", "Payment Status", "Invoice Status", "Paid?", "Paid Status")} ${r.get("Job Status", "Status")}`.toLowerCase();

  let paid = 0;
  if (paidText && isMoney(paidText) && toCents(paidText) > 0) paid = toCents(paidText);
  else if (dueText && isMoney(dueText)) paid = Math.max(0, total - toCents(dueText));
  else if (/\b(paid in full|fully paid|paid)\b/.test(statusText) && !/\b(unpaid|not paid|partial|partially)\b/.test(statusText)) paid = total;
  else if (/^(yes|true|y|1)$/i.test(r.get("Paid?", "Paid", "Is Paid"))) paid = total;
  return { amount: total, taxCents, subtotal, taxable, rate, paid: Math.min(paid, total || paid) };
}

export function importJobs(text: string, tz: string): ImportReport {
  const { rows, rawHeaders } = table(text);
  const findDate = dateFinder(rawHeaders);
  let undated = 0;

  /** Every date a row offers, by meaning. Each falls back to a column whose name suggests it. */
  const datesOf = (r: Row) => {
    let sched = parseDateTime(r.get("Date", "Job Date", "Scheduled Date", "Scheduled For", "Schedule Date", "Scheduled Start", "Scheduled Start Date", "Job Scheduled Start", "Start Date", "Appointment Date", "Start", "Job scheduled start date", "Scheduled start date"), tz);
    if (!sched.date) sched = findDate(r, /sched|start|appoint|job ?date|^date$/i, tz, true);
    const end = parseDateTime(r.get("End Time", "Scheduled End", "End", "Job scheduled end date", "Scheduled end date"), tz);
    let created = parseDateTime(r.get("Created At", "Created", "Created Date", "Created On", "Date Created", "Job created date", "Job Created At"), tz);
    if (!created.date) created = findDate(r, /creat/i, tz, true);
    const done =
      parseDateTime(r.get("Finished", "Finished At", "Completed", "Completed At", "Completed Date", "Completed On", "Completion Date", "Job Completed", "Job Completed At", "Job completed date", "Job finished date"), tz).date ??
      findDate(r, /complet|finish|closed/i, tz, true).date ??
      sched.date ??
      created.date ??
      findDate(r, /./, tz).date;
    return { sched, end, created, done };
  };

  /** The address, from separate columns or one combined "Address" column. */
  const addressOf = (r: Row) => {
    const street = r.get("Street", "Street Line 1", "Address Line 1");
    if (street) {
      return { street, unit: r.get("Street Line 2", "Address Line 2"), city: r.get("City"), province: r.get("State", "Province"), postal: r.get("Zip", "Postal Code", "Zip Code") };
    }
    return splitAddress(r.get("Address", "Service Address", "Job Address"));
  };
  const report: ImportReport = { created: 0, updated: 0, skipped: 0, warnings: [] };
  const users = all<{ id: number; name: string }>("SELECT id, name FROM users");
  const unknownTechs = new Set<string>();

  tx(() => {
    for (const r of rows) {
      const invoiceNo = r.get("Invoice", "Invoice #", "Invoice Number", "Job #", "Job Number");
      const hcpId = r.get("HCP Id", "Job ID", "ID");
      const externalId = hcpId || (invoiceNo ? `invoice:${invoiceNo}` : "");
      const existingJob = externalId ? get<{ id: number }>("SELECT id FROM jobs WHERE external_id = ?", externalId) : undefined;
      if (existingJob) {
        // Already imported: only bring payments up to date (fixes invoices imported as unpaid).
        const m = moneyFrom(r);
        let inv = get<{ id: number; issued_on: string; created_at: string }>(
          "SELECT id, issued_on, created_at FROM invoices WHERE job_id = ? AND status != 'void' ORDER BY id LIMIT 1",
          existingJob.id,
        );
        // If the first import couldn't read the dates, it dated things on the import day; correct them now.
        const d = datesOf(r);
        const realDate = d.done;
        let fixedDate = false;
        if (inv && realDate && inv.issued_on !== realDate && inv.issued_on === inv.created_at.slice(0, 10)) {
          run("UPDATE invoices SET issued_on = ?, due_on = ? WHERE id = ?", realDate, realDate, inv.id);
          run("UPDATE payments SET paid_on = ? WHERE invoice_id = ? AND recorded_by IS NULL", realDate, inv.id);
          inv = { ...inv, issued_on: realDate };
          fixedDate = true;
        }
        const job = get<{ status: string; scheduled_start: string | null; completed_at: string | null; created_at: string; address_id: number | null }>(
          "SELECT status, scheduled_start, completed_at, created_at, address_id FROM jobs WHERE id = ?",
          existingJob.id,
        )!;
        const importDay = job.created_at.slice(0, 10);
        if (!job.scheduled_start && d.sched.date) {
          const st = d.sched.time ?? "09:00";
          const [hh, mm] = st.split(":").map(Number);
          const t = Math.min(hh * 60 + mm + 120, 23 * 60 + 59);
          run(
            "UPDATE jobs SET scheduled_start = ?, scheduled_end = ?, status = CASE WHEN status = 'unscheduled' THEN 'scheduled' ELSE status END WHERE id = ?",
            `${d.sched.date}T${st}`,
            `${d.sched.date}T${pad(Math.floor(t / 60))}:${pad(t % 60)}`,
            existingJob.id,
          );
          fixedDate = true;
        }
        if (job.status === "completed" && realDate && (!job.completed_at || job.completed_at.slice(0, 10) === importDay)) {
          run("UPDATE jobs SET completed_at = ? WHERE id = ?", `${realDate}T17:00:00.000Z`, existingJob.id);
          fixedDate = true;
        }
        if (d.created.date && importDay !== d.created.date) {
          run("UPDATE jobs SET created_at = ? WHERE id = ? AND substr(created_at, 1, 10) = ?", `${d.created.date}T${d.created.time ?? "12:00"}:00.000Z`, existingJob.id, importDay);
        }
        // Fill in a city/postal code the first import left blank.
        if (job.address_id) {
          const a = addressOf(r);
          if (a.city) {
            const changed = run(
              "UPDATE addresses SET city = ?, province = ?, postal_code = ?, unit = CASE WHEN unit = '' THEN ? ELSE unit END WHERE id = ? AND city = ''",
              a.city,
              a.province || "ON",
              a.postal.toUpperCase(),
              a.unit,
              job.address_id,
            ).changes;
            if (changed) fixedDate = true;
          }
        }
        const alreadyPaid = inv ? get<{ s: number }>("SELECT COALESCE(SUM(amount_cents), 0) AS s FROM payments WHERE invoice_id = ?", inv.id)!.s : 0;
        if (inv && m.paid > alreadyPaid) {
          run(
            "INSERT INTO payments (invoice_id, amount_cents, method, reference, paid_on, token) VALUES (?, ?, 'other', '', ?, ?)",
            inv.id,
            m.paid - alreadyPaid,
            inv.issued_on,
            randomToken(),
          );
          run("UPDATE invoices SET status = 'sent' WHERE id = ? AND status = 'draft'", inv.id);
          report.updated++;
        } else if (fixedDate) report.updated++;
        else report.skipped++;
        continue;
      }

      // Customer
      const fullName = r.get("Customer", "Customer Name");
      let first = r.get("First Name");
      let last = r.get("Last Name");
      if (!first && !last && fullName) [first, last] = [fullName.split(" ")[0], fullName.split(" ").slice(1).join(" ")];
      const company = r.get("Company");
      const email = r.get("Email");
      const phone = r.get("Mobile Phone", "Mobile Number", "Phone", "Home Phone");
      if (!first && !last && !company && !email && !phone) {
        report.skipped++;
        continue;
      }
      let customerId = findCustomer({ email, phone, first, last, company, fullName });
      if (!customerId) {
        customerId = run(
          "INSERT INTO customers (first_name, last_name, company, email, phone, alt_phone, tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
          first,
          last,
          company,
          email,
          phone,
          r.get("Home Phone"),
          r.get("Customer Tags", "Customer Tag"),
        ).id;
      }
      const addressId = ensureAddress(customerId, addressOf(r));

      // Schedule & status
      const dates = datesOf(r);
      const when = dates.sched;
      const window = r.get("Window", "Arrival Window");
      const startTime = when.time ?? (window ? parseTime(window) : undefined) ?? "09:00";
      const endParsed = dates.end;
      const endTime = endParsed.time ?? (window.includes("-") ? parseTime(window.split("-")[1]) : undefined);
      const start = when.date ? `${when.date}T${startTime}` : null;
      let end = when.date && endTime ? `${when.date}T${endTime}` : null;
      if (start && (!end || end <= start)) {
        const [h, m] = startTime.split(":").map(Number);
        const t = Math.min(h * 60 + m + 120, 23 * 60 + 59);
        end = `${when.date}T${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
      }
      const status = mapStatus(r.get("Job Status", "Status", "Work Status"), r.get("Finished", "Finished At", "Completed", "Completed At", "Completed Date", "Completed On", "Completion Date", "Job Completed", "Job Completed At"), !!start);

      // Technician
      const employees = r.get("Employee", "Employees", "Assigned Employees", "Assigned To");
      let techId: number | null = null;
      for (const name of employees.split(/[,;&]/).map((x) => x.trim()).filter(Boolean)) {
        const u = users.find((x) => x.name.toLowerCase() === name.toLowerCase()) ?? users.find((x) => x.name.toLowerCase().startsWith(name.toLowerCase().split(" ")[0]));
        if (u) {
          techId = u.id;
          break;
        }
        unknownTechs.add(name);
      }

      // Money
      const { taxCents, subtotal, rate, paid } = moneyFrom(r);
      const lineText = r.get("Line Items");
      const description = r.get("Description", "Job Description");

      let number = parseInt(invoiceNo.replace(/\D/g, ""), 10);
      if (!Number.isFinite(number) || number <= 0 || get("SELECT id FROM jobs WHERE number = ?", number)) number = nextNumber("jobs", 1001);

      const title = (description.split(/\r?\n/)[0] || lineText.split(/[\r\n;]/)[0] || "Imported job").slice(0, 120);
      const privateNotes = [
        r.get("Notes", "Job Notes"),
        employees && !techId ? `Housecall Pro employee: ${employees}` : "",
        r.get("Job Tags") ? `Tags: ${r.get("Job Tags")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const doneDate = dates.done;
      if (!doneDate) undated++;
      const completedIso = status === "completed" ? `${doneDate ?? new Date().toISOString().slice(0, 10)}T17:00:00.000Z` : null;
      const createdIso = dates.created.date ? `${dates.created.date}T${dates.created.time ?? "12:00"}:00.000Z` : new Date().toISOString();

      const jobId = run(
        `INSERT INTO jobs (number, customer_id, address_id, title, description, status, scheduled_start, scheduled_end, tech_id,
                           private_notes, lead_source, tax_rate, completed_at, created_at, external_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        number,
        customerId,
        addressId,
        title,
        description,
        status,
        start,
        end,
        techId,
        privateNotes,
        r.get("Lead Source", "Online Booking Source") || "Housecall Pro",
        rate,
        completedIso,
        createdIso,
        externalId || null,
      ).id;

      if (subtotal > 0) {
        // The invoice line describes the work (Housecall Pro's export has no per-item breakdown).
        const descLines = description.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
        const lineName = (descLines[0] || lineText.split(/[\r\n;]/)[0] || "Appliance service").trim().slice(0, 200);
        const lineDesc = [...descLines.slice(1), lineText && lineText !== lineName ? lineText : ""].filter(Boolean).join("\n").slice(0, 2000);
        run(
          `INSERT INTO line_items (parent_type, parent_id, kind, name, description, quantity, unit_price_cents, taxable, sort)
           VALUES ('job', ?, 'service', ?, ?, 1, ?, ?, 0)`,
          jobId,
          lineName,
          lineDesc,
          subtotal,
          taxCents > 0 ? 1 : 0,
        );
      }
      run(
        "INSERT INTO activities (customer_id, job_id, kind, body, created_at) VALUES (?, ?, 'event', ?, ?)",
        customerId,
        jobId,
        "Imported from Housecall Pro",
        createdIso,
      );

      // Completed jobs with money get an invoice and their payments, so balances carry over.
      if (status === "completed" && subtotal > 0) {
        const issued = (completedIso ?? createdIso).slice(0, 10);
        const invId = run(
          `INSERT INTO invoices (number, customer_id, job_id, status, token, issued_on, due_on, notes, tax_rate)
           VALUES (?, ?, ?, 'sent', ?, ?, ?, ?, ?)`,
          nextNumber("invoices", 2001),
          customerId,
          jobId,
          randomToken(),
          issued,
          issued,
          getSettings().invoice_footer || "",
          rate,
        ).id;
        run(
          `INSERT INTO line_items (parent_type, parent_id, kind, name, description, quantity, unit_price_cents, taxable, sort)
           SELECT 'invoice', ?, kind, name, description, quantity, unit_price_cents, taxable, sort FROM line_items WHERE parent_type = 'job' AND parent_id = ?`,
          invId,
          jobId,
        );
        if (paid > 0) {
          run(
            "INSERT INTO payments (invoice_id, amount_cents, method, reference, paid_on, token) VALUES (?, ?, 'other', '', ?, ?)",
            invId,
            paid,
            issued,
            randomToken(),
          );
        }
      }
      report.created++;
    }
  });
  if (undated) {
    report.warnings.push(
      `${undated} job${undated === 1 ? "" : "s"} had no date this import could read, so ${undated === 1 ? "it was" : "they were"} dated today. Columns in your file: ${rawHeaders.join(" | ")}. Copy this message into your chat with Claude so the date column can be matched.`,
    );
  }
  if (unknownTechs.size) {
    report.warnings.push(
      `These Housecall Pro employees aren't on your Team yet, so their jobs were left unassigned (their names are in each job's private notes): ${[...unknownTechs].slice(0, 10).join(", ")}. Add them on the Team page first and import again to assign them.`,
    );
  }
  return report;
}

/* ---------------- price book ---------------- */

const APPLIANCE_KEYWORDS: [RegExp, string][] = [
  [/dishwasher/i, "Dishwasher"],
  [/range\s*hood|hood\s*fan|vent\s*hood/i, "Range hood"],
  [/micro\s*wave|otr/i, "Microwave"],
  [/ice\s*maker/i, "Ice maker"],
  [/wine/i, "Wine cooler"],
  [/freezer/i, "Freezer"],
  [/fridge|refrigerator/i, "Refrigerator"],
  [/dryer/i, "Dryer"],
  [/washer|washing/i, "Washer"],
  [/cooktop|stove\s*top/i, "Cooktop"],
  [/oven/i, "Oven"],
  [/\brange\b|stove/i, "Range"],
  [/disposal/i, "Garbage disposal"],
];

function detectAppliance(...texts: string[]): string {
  const t = texts.join(" ");
  const explicit = APPLIANCE_TYPES.find((a) => texts.some((x) => x.trim().toLowerCase() === a.toLowerCase()));
  if (explicit) return explicit;
  return APPLIANCE_KEYWORDS.find(([re]) => re.test(t))?.[1] ?? "";
}

export function importPricebook(text: string): ImportReport {
  const { rows } = table(text);
  const report: ImportReport = { created: 0, updated: 0, skipped: 0, warnings: [] };
  tx(() => {
    for (const r of rows) {
      const name = r.get("Name", "Item Name", "Service Name", "Material Name", "Title");
      if (!name) {
        report.skipped++;
        continue;
      }
      const category = r.get("Category", "Category Name", "Subcategory");
      const typeText = r.get("Type", "Item Type", "Kind").toLowerCase();
      const kind = typeText.includes("material") || typeText.includes("part") || r.get("Part Number", "Part #", "SKU") ? "material" : "service";
      const partNo = r.get("Part Number", "Part #", "SKU");
      const description = [r.get("Description"), partNo && `Part # ${partNo}`].filter(Boolean).join("\n");
      const price = toCents(r.get("Price", "Unit Price", "Retail Price", "Sale Price"));
      const cost = toCents(r.get("Cost", "Unit Cost", "Material Cost"));
      const taxableText = r.get("Taxable", "Tax");
      const taxable = taxableText ? !/^(no|false|0|n)$/i.test(taxableText) : true;
      const appliance = detectAppliance(r.get("Appliance"), category, r.get("Industry"), name);
      const externalId = r.get("ID", "UUID", "Item ID") || `${kind}:${category}:${name}`;

      const existing = get<{ id: number }>("SELECT id FROM pricebook WHERE external_id = ?", externalId);
      if (existing) {
        run(
          "UPDATE pricebook SET kind = ?, appliance = ?, category = ?, name = ?, description = ?, unit_price_cents = ?, cost_cents = ?, taxable = ? WHERE id = ?",
          kind,
          appliance,
          category,
          name,
          description,
          price,
          cost,
          taxable ? 1 : 0,
          existing.id,
        );
        report.updated++;
      } else {
        run(
          "INSERT INTO pricebook (kind, appliance, category, name, description, unit_price_cents, cost_cents, taxable, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          kind,
          appliance,
          category,
          name,
          description,
          price,
          cost,
          taxable ? 1 : 0,
          externalId,
        );
        report.created++;
      }
    }
  });
  return report;
}
