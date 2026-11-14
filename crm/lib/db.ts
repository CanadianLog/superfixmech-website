import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { splitTaxInclusive } from "./format";

/**
 * SQLite database (Node's built-in driver, no native dependencies).
 * The file lives at CRM_DB_PATH, or ./data/crm.db by default. Back it up by copying the file.
 */

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('admin','dispatcher','tech')),
  color TEXT NOT NULL DEFAULT '#2563eb',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  alt_phone TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  lead_source TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  street TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT 'ON',
  postal_code TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'unscheduled'
    CHECK (status IN ('unscheduled','scheduled','dispatched','in_progress','completed','canceled')),
  scheduled_start TEXT,           -- local wall-clock 'YYYY-MM-DDTHH:mm' in the business time zone
  scheduled_end TEXT,
  tech_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  appliance TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  serial TEXT NOT NULL DEFAULT '',
  private_notes TEXT NOT NULL DEFAULT '',
  lead_source TEXT NOT NULL DEFAULT '',
  estimate_id INTEGER,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS jobs_schedule ON jobs(scheduled_start);
CREATE INDEX IF NOT EXISTS jobs_customer ON jobs(customer_id);

CREATE TABLE IF NOT EXISTS estimates (
  id INTEGER PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','approved','declined','converted')),
  token TEXT NOT NULL UNIQUE,
  valid_until TEXT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  responded_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','void')),
  token TEXT NOT NULL UNIQUE,
  issued_on TEXT NOT NULL,        -- 'YYYY-MM-DD'
  due_on TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'card',
  reference TEXT NOT NULL DEFAULT '',
  paid_on TEXT NOT NULL,
  recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Line items belong to exactly one job, estimate or invoice.
CREATE TABLE IF NOT EXISTS line_items (
  id INTEGER PRIMARY KEY,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('job','estimate','invoice')),
  parent_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'service' CHECK (kind IN ('service','material','discount')),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity REAL NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  taxable INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS line_items_parent ON line_items(parent_type, parent_id);

CREATE TABLE IF NOT EXISTS pricebook (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'service' CHECK (kind IN ('service','material')),
  category TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  taxable INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1
);

-- Timeline of notes and events, shown on customers and jobs.
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'note',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS activities_customer ON activities(customer_id);
CREATE INDEX IF NOT EXISTS activities_job ON activities(job_id);

-- Outgoing texts and emails (invoices, receipts, review requests). Queued rows are sent by a background worker.
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,                 -- invoice | receipt | review | test
  channel TEXT NOT NULL CHECK (channel IN ('sms','email')),
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','canceled')),
  error TEXT NOT NULL DEFAULT '',
  send_after TEXT NOT NULL,           -- UTC ISO timestamp
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS messages_due ON messages(status, send_after);
CREATE INDEX IF NOT EXISTS messages_job ON messages(job_id);
`;

const DEFAULT_SETTINGS: Record<string, string> = {
  company_name: "SuperFix Mechanical Inc.",
  company_phone: "613-366-7009",
  company_email: "service@superfixmech.ca",
  company_address: "440-7305 Woodbine Ave, Markham, Ontario L3R 3V7",
  company_website: "https://superfixmech.ca",
  tax_name: "HST",
  tax_rate: "13",
  tax_number: "",
  time_zone: "America/Toronto",
  invoice_terms_days: "0",
  invoice_footer: "Thank you for choosing SuperFix Mechanical! All repairs carry our parts and labour warranty.",
  estimate_valid_days: "30",
  booking_api_key: "",
  // QuickBooks Online
  qbo_client_id: "",
  qbo_client_secret: "",
  qbo_env: "production",
  qbo_realm_id: "",
  qbo_company_name: "",
  qbo_access_token: "",
  qbo_access_expires: "",
  qbo_refresh_token: "",
  qbo_oauth_state: "",
  qbo_item_id: "",
  qbo_tax_13: "",
  qbo_tax_5: "",
  qbo_tax_0: "",
  // Texting (Twilio) and email (SMTP)
  twilio_sid: "",
  twilio_token: "",
  twilio_from: "",
  smtp_host: "",
  smtp_port: "465",
  smtp_user: "",
  smtp_pass: "",
  smtp_from_name: "SuperFix Mechanical",
  // Email the owner a copy whenever an invoice or receipt is sent to a customer (blank address = company email)
  notify_email: "",
  notify_invoice: "1",
  notify_receipt: "1",
  // Google address search (Places API)
  google_maps_api_key: "",
  google_place_id: "",
  google_place_confirmed: "",
  reviews_hidden: "[]",
  reviews_manual: "[]",
  reviews_min_rating: "4",
  // Your Google Maps listing id (the cid in your maps link), used to recognise your business in search results
  google_cid: "7860337456778361550",
  reviews_cache: "",
  // Websites allowed to send bookings and show reviews without the API key (comma separated)
  website_origins: "https://superfixmech.ca, https://www.superfixmech.ca",
  // Google review requests
  google_review_url: "",
  review_auto: "1",
  review_delay_minutes: "60",
  review_cooldown_days: "180",
  // Message templates. Placeholders: {first_name} {company} {amount} {invoice_number} {method} {link} {review_link} {phone}
  tpl_invoice_sms: "Hi {first_name}, thank you for choosing {company}! Your invoice #{invoice_number} for {amount} is ready here: {link}",
  tpl_invoice_email: "Hi {first_name},\n\nThank you for choosing {company}. Your invoice #{invoice_number} for {amount} is ready:\n{link}\n\nYou can pay by e-transfer, credit card, cash or cheque. Questions? Call us at {phone}.\n\n{company}",
  tpl_receipt_sms: "Hi {first_name}, we received your {method} payment of {amount} for invoice #{invoice_number}. Thank you! Your receipt: {link}",
  tpl_receipt_email: "Hi {first_name},\n\nThank you! We received your {method} payment of {amount} for invoice #{invoice_number}.\n\nYour receipt: {link}\n\n{company}\n{phone}",
  tpl_review_sms: "Hi {first_name}, thank you for choosing {company}! If you were happy with our service, would you mind leaving a quick Google review? It really helps our small business: {review_link} Reply STOP to opt out.",
  tpl_review_email: "Hi {first_name},\n\nThank you for choosing {company}! If you were happy with our service, would you mind leaving us a quick Google review? It only takes a minute and really helps a small local business:\n{review_link}\n\nThank you,\n{company}",
};

/** Columns added after the first release. Each runs once, only if missing. */
const MIGRATIONS: [table: string, column: string, definition: string][] = [
  ["jobs", "tax_rate", "REAL"],
  ["estimates", "tax_rate", "REAL"],
  ["invoices", "tax_rate", "REAL"],
  ["pricebook", "appliance", "TEXT NOT NULL DEFAULT ''"],
  ["customers", "qbo_id", "TEXT"],
  ["invoices", "qbo_id", "TEXT"],
  ["invoices", "qbo_synced_at", "TEXT"],
  ["payments", "qbo_id", "TEXT"],
  // IDs from the old system (Housecall Pro), so re-importing the same file never creates duplicates.
  ["customers", "external_id", "TEXT"],
  ["jobs", "external_id", "TEXT"],
  ["pricebook", "external_id", "TEXT"],
  ["payments", "token", "TEXT"],
  ["customers", "no_review", "INTEGER NOT NULL DEFAULT 0"],
  // What a line costs you (per unit). Internal only: never shown to customers.
  ["line_items", "cost_cents", "INTEGER NOT NULL DEFAULT 0"],
];

function migrate(db: DatabaseSync) {
  for (const [table, column, def] of MIGRATIONS) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
  }
}

type Globals = typeof globalThis & { __crmDb?: DatabaseSync };

function open(): DatabaseSync {
  const file = process.env.CRM_DB_PATH || path.join(process.cwd(), "data", "crm.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  migrate(db);
  // Clean up records made by the first Housecall Pro imports so customers never see the old system's name:
  // the invoice line becomes the job's description, and the import note/payment reference are cleared.
  db.exec(`
    UPDATE line_items SET name = COALESCE((SELECT NULLIF(NULLIF(j.title, ''), 'Imported job') FROM jobs j WHERE j.id = line_items.parent_id), 'Appliance service')
     WHERE parent_type = 'job' AND name LIKE 'Housecall Pro job #%';
    UPDATE line_items SET name = COALESCE((SELECT NULLIF(NULLIF(j.title, ''), 'Imported job') FROM invoices i JOIN jobs j ON j.id = i.job_id WHERE i.id = line_items.parent_id), 'Appliance service')
     WHERE parent_type = 'invoice' AND name LIKE 'Housecall Pro job #%';
    UPDATE invoices SET notes = COALESCE((SELECT value FROM settings WHERE key = 'invoice_footer'), '') WHERE notes = 'Imported from Housecall Pro';
    UPDATE payments SET reference = '' WHERE reference = 'Paid in Housecall Pro';
  `);
  // One-time: Housecall Pro totals already included 13% HST. Earlier imports recorded them as "No tax";
  // split the HST out so those invoices show Subtotal, HST 13% and the same Total.
  const done = db.prepare("SELECT value FROM settings WHERE key = 'hcp_hst_split_done'").get() as { value: string } | undefined;
  if (!done) {
    const convert = (table: "jobs" | "invoices", parentType: "job" | "invoice") => {
      const where =
        table === "jobs"
          ? "p.external_id IS NOT NULL"
          : "p.qbo_id IS NULL AND p.job_id IN (SELECT id FROM jobs WHERE external_id IS NOT NULL)";
      const rows = db
        .prepare(
          `SELECT p.id, li.id AS line_id, li.quantity, li.unit_price_cents
             FROM ${table} p JOIN line_items li ON li.parent_type = '${parentType}' AND li.parent_id = p.id
            WHERE ${where} AND COALESCE(p.tax_rate, 0) = 0 AND li.taxable = 0
              AND (SELECT COUNT(*) FROM line_items x WHERE x.parent_type = '${parentType}' AND x.parent_id = p.id) = 1`,
        )
        .all() as { id: number; line_id: number; quantity: number; unit_price_cents: number }[];
      for (const r of rows) {
        const total = Math.round(r.quantity * r.unit_price_cents);
        if (total <= 0) continue;
        const { subtotal } = splitTaxInclusive(total, 13);
        db.prepare("UPDATE line_items SET quantity = 1, unit_price_cents = ?, taxable = 1 WHERE id = ?").run(subtotal, r.line_id);
        db.prepare(`UPDATE ${table} SET tax_rate = 13 WHERE id = ?`).run(r.id);
      }
    };
    convert("jobs", "job");
    convert("invoices", "invoice");
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('hcp_hst_split_done', '1')").run();
  }
  // One-time: replace the original placeholder company address with the real one (only if it was never edited).
  db.prepare("UPDATE settings SET value = ? WHERE key = 'company_address' AND value = '200 Bay Street, Ottawa, ON'").run("440-7305 Woodbine Ave, Markham, Ontario L3R 3V7");
  const insert = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insert.run(k, v);
  return db;
}

export function db(): DatabaseSync {
  const g = globalThis as Globals;
  if (!g.__crmDb) g.__crmDb = open();
  return g.__crmDb;
}

type Param = string | number | null | bigint;

// node:sqlite returns null-prototype rows; copy them into plain objects so React can pass them to client components.
export function all<T>(sql: string, ...params: Param[]): T[] {
  return db().prepare(sql).all(...params).map((r) => ({ ...r })) as T[];
}

export function get<T>(sql: string, ...params: Param[]): T | undefined {
  const row = db().prepare(sql).get(...params);
  return row ? ({ ...row } as T) : undefined;
}

export function run(sql: string, ...params: Param[]): { id: number; changes: number } {
  const r = db().prepare(sql).run(...params);
  return { id: Number(r.lastInsertRowid), changes: Number(r.changes) };
}

export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN");
  try {
    const out = fn();
    d.exec("COMMIT");
    return out;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

export function getSettings(): Record<string, string> {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function nextNumber(table: "jobs" | "estimates" | "invoices", start: number): number {
  const row = get<{ n: number | null }>(`SELECT MAX(number) AS n FROM ${table}`);
  return Math.max(row?.n ?? 0, start - 1) + 1;
}
