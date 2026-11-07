import "server-only";
import { all, get, nextNumber, run, tx } from "./db";
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

function table(text: string): { headers: string[]; rows: Row[] } {
  const [head = [], ...body] = parseCSV(text);
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
  return { headers, rows };
}

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

function findCustomer(opts: { externalId?: string; email?: string; phone?: string; first?: string; last?: string; company?: string }): number | undefined {
  if (opts.externalId) {
    const r = get<{ id: number }>("SELECT id FROM customers WHERE external_id = ?", opts.externalId);
    if (r) return r.id;
  }
  if (opts.email) {
    const r = get<{ id: number }>("SELECT id FROM customers WHERE email = ? COLLATE NOCASE AND email != ''", opts.email);
    if (r) return r.id;
  }
  const d = digits(opts.phone ?? "");
  if (d.length >= 7) {
    const r = get<{ id: number }>(
      "SELECT id FROM customers WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,'-',''),' ',''),'(',''),')',''),'.',''),'+','') LIKE ?",
      `%${d}`,
    );
    if (r) return r.id;
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
  return undefined;
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
      const [f, l] = first || last ? [first, last] : fullName ? [fullName.split(" ")[0], fullName.split(" ").slice(1).join(" ")] : ["", ""];
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
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(.*)$/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return { date: `${y}-${pad(Number(m[1]))}-${pad(Number(m[2]))}`, time: parseTime(m[4]) };
  }
  m = s.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})(.*)$/i);
  if (m && MONTHS.includes(m[1].toLowerCase())) {
    return { date: `${m[3]}-${pad(MONTHS.indexOf(m[1].toLowerCase()) + 1)}-${pad(Number(m[2]))}`, time: parseTime(m[4]) };
  }
  return {};
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

export function importJobs(text: string, tz: string): ImportReport {
  const { rows } = table(text);
  const report: ImportReport = { created: 0, updated: 0, skipped: 0, warnings: [] };
  const users = all<{ id: number; name: string }>("SELECT id, name FROM users");
  const unknownTechs = new Set<string>();

  tx(() => {
    for (const r of rows) {
      const invoiceNo = r.get("Invoice", "Invoice #", "Invoice Number", "Job #", "Job Number");
      const hcpId = r.get("HCP Id", "Job ID", "ID");
      const externalId = hcpId || (invoiceNo ? `invoice:${invoiceNo}` : "");
      if (externalId && get("SELECT id FROM jobs WHERE external_id = ?", externalId)) {
        report.skipped++;
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
      let customerId = findCustomer({ email, phone, first, last, company });
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
      const addressId = ensureAddress(customerId, {
        street: r.get("Street", "Street Line 1", "Address Line 1") || r.get("Address").split(",")[0]?.trim() || "",
        unit: r.get("Street Line 2", "Address Line 2"),
        city: r.get("City"),
        province: r.get("State", "Province"),
        postal: r.get("Zip", "Postal Code", "Zip Code"),
      });

      // Schedule & status
      const when = parseDateTime(r.get("Date", "Scheduled Date", "Scheduled Start", "Start"), tz);
      const window = r.get("Window", "Arrival Window");
      const startTime = when.time ?? (window ? parseTime(window) : undefined) ?? "09:00";
      const endParsed = parseDateTime(r.get("End Time", "Scheduled End", "End"), tz);
      const endTime = endParsed.time ?? (window.includes("-") ? parseTime(window.split("-")[1]) : undefined);
      const start = when.date ? `${when.date}T${startTime}` : null;
      let end = when.date && endTime ? `${when.date}T${endTime}` : null;
      if (start && (!end || end <= start)) {
        const [h, m] = startTime.split(":").map(Number);
        const t = Math.min(h * 60 + m + 120, 23 * 60 + 59);
        end = `${when.date}T${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
      }
      const status = mapStatus(r.get("Job Status", "Status", "Work Status"), r.get("Finished", "Completed", "Completed At"), !!start);

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
      const amount = toCents(r.get("Amount", "Total", "Job Amount", "Invoice Total"));
      const taxCents = toCents(r.get("Tax", "Tax Amount"));
      const subtotal = toCents(r.get("Subtotal")) || Math.max(0, amount - taxCents);
      const taxable = toCents(r.get("Taxable Amount")) || (taxCents > 0 ? subtotal : 0);
      const rate = parseRate(r.get("Tax rate", "Tax Rate"), taxCents, taxable);
      const paid = toCents(r.get("Paid Amount", "Amount Paid", "Paid"));
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
      const completedIso = status === "completed" ? `${(parseDateTime(r.get("Finished", "Completed At"), tz).date ?? when.date ?? new Date().toISOString().slice(0, 10))}T17:00:00.000Z` : null;
      const createdIso = (() => {
        const c = parseDateTime(r.get("Created At", "Created"), tz);
        return c.date ? `${c.date}T${c.time ?? "12:00"}:00.000Z` : new Date().toISOString();
      })();

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
        run(
          `INSERT INTO line_items (parent_type, parent_id, kind, name, description, quantity, unit_price_cents, taxable, sort)
           VALUES ('job', ?, 'service', ?, ?, 1, ?, ?, 0)`,
          jobId,
          `Housecall Pro job #${invoiceNo || number}`,
          lineText,
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
           VALUES (?, ?, ?, 'sent', ?, ?, ?, 'Imported from Housecall Pro', ?)`,
          nextNumber("invoices", 2001),
          customerId,
          jobId,
          randomToken(),
          issued,
          issued,
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
            "INSERT INTO payments (invoice_id, amount_cents, method, reference, paid_on) VALUES (?, ?, 'other', 'Paid in Housecall Pro', ?)",
            invId,
            paid,
            issued,
          );
        }
      }
      report.created++;
    }
  });
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
