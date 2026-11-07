import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

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
`;

const DEFAULT_SETTINGS: Record<string, string> = {
  company_name: "SuperFix Mechanical Inc.",
  company_phone: "613-366-7009",
  company_email: "service@superfixmech.ca",
  company_address: "200 Bay Street, Ottawa, ON",
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
