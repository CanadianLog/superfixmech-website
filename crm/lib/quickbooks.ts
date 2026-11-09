import "server-only";
import { all, get, getSettings, run } from "./db";
import { customerName, lineTotal } from "./format";
import { getInvoice, lineItems, rateFor } from "./data";
import type { Address, Customer } from "./types";

/**
 * QuickBooks Online integration (OAuth 2.0 + Accounting API).
 * The CRM pushes customers, invoices and payments to QuickBooks; it never deletes anything there.
 * Credentials come from an app you create at developer.intuit.com (see the Settings page).
 */

const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";
const SCOPE = "com.intuit.quickbooks.accounting";
const MINOR_VERSION = "75";

function setSetting(key: string, value: string) {
  run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value);
}

export function qboConfig() {
  const s = getSettings();
  return {
    clientId: process.env.QBO_CLIENT_ID || s.qbo_client_id,
    clientSecret: process.env.QBO_CLIENT_SECRET || s.qbo_client_secret,
    fromEnv: !!process.env.QBO_CLIENT_ID,
    env: (process.env.QBO_ENV || s.qbo_env || "production") as "production" | "sandbox",
    realmId: s.qbo_realm_id,
    companyName: s.qbo_company_name,
    connected: !!(s.qbo_realm_id && s.qbo_refresh_token),
    itemId: s.qbo_item_id,
    taxCodes: { 13: s.qbo_tax_13, 5: s.qbo_tax_5, 0: s.qbo_tax_0 } as Record<number, string>,
  };
}

export class QboError extends Error {}

function apiBase(env: string) {
  return env === "sandbox" ? "https://sandbox-quickbooks.api.intuit.com" : "https://quickbooks.api.intuit.com";
}

function basicAuth() {
  const c = qboConfig();
  if (!c.clientId || !c.clientSecret) throw new QboError("Add your QuickBooks Client ID and Client Secret in Settings first.");
  return `Basic ${Buffer.from(`${c.clientId}:${c.clientSecret}`).toString("base64")}`;
}

export function authorizeUrl(state: string, redirectUri: string): string {
  const c = qboConfig();
  const p = new URLSearchParams({ client_id: c.clientId, response_type: "code", scope: SCOPE, redirect_uri: redirectUri, state });
  return `${AUTH_URL}?${p}`;
}

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number };

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: basicAuth(), Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Partial<TokenResponse> & { error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new QboError(`QuickBooks sign-in failed: ${json.error_description || json.error || res.statusText}`);
  }
  return json as TokenResponse;
}

function saveTokens(t: TokenResponse) {
  setSetting("qbo_access_token", t.access_token);
  setSetting("qbo_refresh_token", t.refresh_token);
  setSetting("qbo_access_expires", String(Date.now() + (t.expires_in - 120) * 1000));
}

export async function exchangeCode(code: string, redirectUri: string, realmId: string) {
  saveTokens(await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri }));
  setSetting("qbo_realm_id", realmId);
  try {
    const info = await api<{ CompanyInfo: { CompanyName: string } }>("GET", `companyinfo/${realmId}`);
    setSetting("qbo_company_name", info.CompanyInfo.CompanyName);
  } catch {
    setSetting("qbo_company_name", "");
  }
}

async function accessToken(): Promise<string> {
  const s = getSettings();
  if (!s.qbo_refresh_token) throw new QboError("QuickBooks isn't connected. Connect it in Settings.");
  if (s.qbo_access_token && Number(s.qbo_access_expires) > Date.now()) return s.qbo_access_token;
  try {
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: s.qbo_refresh_token });
    saveTokens(t);
    return t.access_token;
  } catch (e) {
    throw new QboError(`${(e as Error).message}. Reconnect QuickBooks in Settings.`);
  }
}

export async function disconnect() {
  const s = getSettings();
  if (s.qbo_refresh_token) {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: { Authorization: basicAuth(), Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ token: s.qbo_refresh_token }),
    }).catch(() => undefined);
  }
  for (const k of ["qbo_access_token", "qbo_refresh_token", "qbo_access_expires", "qbo_realm_id", "qbo_company_name"]) setSetting(k, "");
}

type Fault = { Fault?: { Error?: { Message?: string; Detail?: string }[] } };

async function api<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const c = qboConfig();
  const token = await accessToken();
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${apiBase(c.env)}/v3/company/${c.realmId}/${path}${sep}minorversion=${MINOR_VERSION}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as T & Fault;
  if (!res.ok || json.Fault) {
    const err = json.Fault?.Error?.[0];
    throw new QboError(`QuickBooks: ${err?.Detail || err?.Message || `${res.status} ${res.statusText}`}`);
  }
  return json;
}

async function query<T>(sql: string, entity: string): Promise<T[]> {
  const r = await api<{ QueryResponse: Record<string, T[]> }>("GET", `query?query=${encodeURIComponent(sql)}`);
  return r.QueryResponse?.[entity] ?? [];
}

const q = (v: string) => v.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

/* ---------- lists used for setup ---------- */

export async function listTaxCodes() {
  return query<{ Id: string; Name: string; Description?: string }>("select * from TaxCode where Active = true maxresults 200", "TaxCode");
}

export async function listItems() {
  const items = await query<{ Id: string; Name: string; Type: string }>("select * from Item where Active = true maxresults 500", "Item");
  return items.filter((i) => i.Type !== "Category");
}

/* ---------- sync ---------- */

async function ensureCustomer(customerId: number): Promise<string> {
  const c = get<Customer>("SELECT * FROM customers WHERE id = ?", customerId);
  if (!c) throw new QboError("Customer not found.");
  if (c.qbo_id) return c.qbo_id;
  const displayName = customerName(c).slice(0, 100);
  const existing = await query<{ Id: string }>(`select Id from Customer where DisplayName = '${q(displayName)}'`, "Customer");
  let id = existing[0]?.Id;
  if (!id) {
    const addr = get<Address>("SELECT * FROM addresses WHERE customer_id = ? ORDER BY id LIMIT 1", customerId);
    const created = await api<{ Customer: { Id: string } }>("POST", "customer", {
      DisplayName: displayName,
      GivenName: c.first_name.slice(0, 100) || undefined,
      FamilyName: c.last_name.slice(0, 100) || undefined,
      CompanyName: c.company.slice(0, 100) || undefined,
      PrimaryEmailAddr: c.email ? { Address: c.email } : undefined,
      PrimaryPhone: c.phone ? { FreeFormNumber: c.phone } : undefined,
      BillAddr: addr
        ? { Line1: [addr.unit, addr.street].filter(Boolean).join(" - "), City: addr.city, CountrySubDivisionCode: addr.province, PostalCode: addr.postal_code, Country: "Canada" }
        : undefined,
    });
    id = created.Customer.Id;
  }
  run("UPDATE customers SET qbo_id = ? WHERE id = ?", id, customerId);
  return id;
}

function money2(cents: number) {
  return Math.round(cents) / 100;
}

/** Creates or updates the invoice in QuickBooks, then sends any payments not yet there. */
export async function syncInvoice(invoiceId: number): Promise<string> {
  const c = qboConfig();
  if (!c.connected) throw new QboError("QuickBooks isn't connected.");
  if (!c.itemId) throw new QboError("Pick the QuickBooks product/service to post line items to (Settings → QuickBooks).");
  const inv = getInvoice(invoiceId);
  if (!inv) throw new QboError("Invoice not found.");
  if (inv.status === "void") throw new QboError("Void invoices aren't sent to QuickBooks.");

  const rate = rateFor("invoice", invoiceId);
  const taxCode = c.taxCodes[rate];
  const exemptCode = c.taxCodes[0];
  if (!taxCode) throw new QboError(`Map the ${rate}% tax to a QuickBooks tax code in Settings first.`);
  if (!exemptCode) throw new QboError("Map “No tax” to a QuickBooks tax code (usually Exempt or Zero-rated) in Settings first.");

  const customerRef = await ensureCustomer(inv.customer_id);
  const lines = lineItems("invoice", invoiceId).map((li) => {
    const amount = lineTotal(li);
    const qty = li.kind === "discount" ? 1 : li.quantity;
    return {
      DetailType: "SalesItemLineDetail",
      Amount: money2(amount),
      Description: [li.name, li.description].filter(Boolean).join(" — ").slice(0, 4000),
      SalesItemLineDetail: {
        ItemRef: { value: c.itemId },
        Qty: qty,
        UnitPrice: li.kind === "discount" ? money2(amount) : money2(li.unit_price_cents),
        TaxCodeRef: { value: li.taxable && rate > 0 ? taxCode : exemptCode },
      },
    };
  });
  if (lines.length === 0) throw new QboError("Add at least one line item before sending to QuickBooks.");

  const body: Record<string, unknown> = {
    CustomerRef: { value: customerRef },
    DocNumber: String(inv.number),
    TxnDate: inv.issued_on,
    DueDate: inv.due_on,
    GlobalTaxCalculation: "TaxExcluded",
    Line: lines,
    CustomerMemo: inv.notes ? { value: inv.notes.slice(0, 1000) } : undefined,
    BillEmail: inv.customer_email ? { Address: inv.customer_email } : undefined,
  };

  let qboId = inv.qbo_id;
  if (qboId) {
    const current = await api<{ Invoice: { SyncToken: string } }>("GET", `invoice/${qboId}`);
    await api("POST", "invoice", { ...body, Id: qboId, SyncToken: current.Invoice.SyncToken });
  } else {
    const created = await api<{ Invoice: { Id: string } }>("POST", "invoice", body);
    qboId = created.Invoice.Id;
    run("UPDATE invoices SET qbo_id = ? WHERE id = ?", qboId, invoiceId);
  }

  await syncPayments(invoiceId, customerRef, qboId);
  run("UPDATE invoices SET qbo_synced_at = ? WHERE id = ?", new Date().toISOString(), invoiceId);
  return qboId;
}

async function syncPayments(invoiceId: number, customerRef: string, invoiceQboId: string) {
  const pending = all<{ id: number; amount_cents: number; method: string; reference: string; paid_on: string }>(
    "SELECT id, amount_cents, method, reference, paid_on FROM payments WHERE invoice_id = ? AND qbo_id IS NULL ORDER BY id",
    invoiceId,
  );
  for (const p of pending) {
    const created = await api<{ Payment: { Id: string } }>("POST", "payment", {
      CustomerRef: { value: customerRef },
      TotalAmt: money2(p.amount_cents),
      TxnDate: p.paid_on,
      PaymentRefNum: p.reference.slice(0, 21) || undefined,
      PrivateNote: `Recorded in CRM (${p.method})`,
      Line: [{ Amount: money2(p.amount_cents), LinkedTxn: [{ TxnId: invoiceQboId, TxnType: "Invoice" }] }],
    });
    run("UPDATE payments SET qbo_id = ? WHERE id = ?", created.Payment.Id, p.id);
  }
}

export async function voidInvoice(invoiceId: number) {
  const inv = get<{ qbo_id: string | null }>("SELECT qbo_id FROM invoices WHERE id = ?", invoiceId);
  if (!inv?.qbo_id || !qboConfig().connected) return;
  const current = await api<{ Invoice: { SyncToken: string } }>("GET", `invoice/${inv.qbo_id}`);
  await api("POST", "invoice?operation=void", { Id: inv.qbo_id, SyncToken: current.Invoice.SyncToken });
}
