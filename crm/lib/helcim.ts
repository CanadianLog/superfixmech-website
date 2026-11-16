import "server-only";
import { createHash } from "node:crypto";
import { get, getSettings, run } from "./db";
import { getCustomer, getInvoice, getAddress, lineItems, rateFor } from "./data";
import { computeTotals, customerName, lineTotal, taxLabel } from "./format";

/**
 * Card payments through Helcim (HelcimPay.js).
 *
 * 1. The server asks Helcim for a checkout session for the invoice balance and keeps the secret token.
 * 2. The browser shows Helcim's secure card window (card numbers never touch the CRM).
 * 3. When Helcim says "approved", the browser hands the result back; the server checks it against the
 *    secret token and with Helcim's API, then records the payment on the invoice.
 *
 * Helcim also gets a matching invoice (same number, line items and tax) and customer record.
 */

const API = process.env.HELCIM_API_BASE || "https://api.helcim.com/v2";

export function helcimConfigured(s = getSettings()) {
  return !!s.helcim_api_token;
}
export function helcimOnline(s = getSettings()) {
  return helcimConfigured(s) && s.helcim_online === "1";
}

async function helcim<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const s = getSettings();
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: { accept: "application/json", "content-type": "application/json", "api-token": s.helcim_api_token },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  }).catch((e: Error) => {
    throw new Error(`Couldn't reach Helcim (${e.message}).`);
  });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { errors: text.slice(0, 200) };
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error("Helcim didn't accept the API token. Check it in Settings → Card payments.");
    const errs = (json as { errors?: unknown }).errors;
    const detail = typeof errs === "string" ? errs : Array.isArray(errs) ? errs.join("; ") : errs && typeof errs === "object" ? Object.values(errs).join("; ") : res.statusText;
    throw new Error(`Helcim: ${detail}`);
  }
  return json as T;
}

export async function testHelcim(): Promise<string> {
  await helcim("/connection-test");
  return "Connected to Helcim.";
}

const dollars = (cents: number) => Math.round(cents) / 100;

/** The invoice as Helcim wants it. Line items + tax must add up exactly to the amount charged. */
function invoiceRequest(invoiceId: number, amountCents: number, helcimNumber: string, simple: boolean) {
  const inv = getInvoice(invoiceId)!;
  const c = getCustomer(inv.customer_id)!;
  const items = lineItems("invoice", invoiceId);
  const rate = rateFor("invoice", invoiceId);
  const totals = computeTotals(items.map((i) => ({ ...i, taxable: !!i.taxable })), rate);
  const full = !simple && amountCents === totals.total && inv.paid_cents === 0 && items.every((i) => lineTotal(i) >= 0) && items.length > 0;
  const lineItemsOut = full
    ? items.map((i) => ({
        sku: "",
        description: [i.name, i.description].filter(Boolean).join(" – ").slice(0, 250),
        quantity: i.quantity,
        price: dollars(i.unit_price_cents),
        total: dollars(lineTotal(i)),
      }))
    : [{ sku: "", description: inv.paid_cents > 0 || amountCents < totals.total ? `Payment on invoice #${inv.number}` : `Invoice #${inv.number}`, quantity: 1, price: dollars(amountCents), total: dollars(amountCents) }];
  // Helcim rounds per line, so double-check the full version adds up; otherwise send one line.
  const linesSum = lineItemsOut.reduce((sum, l) => sum + Math.round(l.total * 100), 0);
  if (full && linesSum + totals.tax !== amountCents) return invoiceRequest(invoiceId, amountCents, helcimNumber, true);
  return {
    invoiceNumber: helcimNumber,
    contactName: customerName(c),
    notes: `${inv.notes ? `${inv.notes}\n` : ""}From SuperFix CRM invoice #${inv.number}`.slice(0, 500),
    lineItems: lineItemsOut,
    ...(full && totals.tax > 0 ? { tax: { amount: dollars(totals.tax), details: taxLabel(rate) } } : {}),
  };
}

function customerRequest(invoiceId: number) {
  const inv = getInvoice(invoiceId)!;
  const c = getCustomer(inv.customer_id)!;
  const job = inv.job_id ? get<{ address_id: number | null }>("SELECT address_id FROM jobs WHERE id = ?", inv.job_id) : undefined;
  const a = getAddress(job?.address_id ?? null) ?? get<{ street: string; unit: string; city: string; province: string; postal_code: string }>("SELECT * FROM addresses WHERE customer_id = ? ORDER BY id LIMIT 1", c.id);
  const name = customerName(c);
  const phone = c.phone.replace(/\D/g, "");
  const address =
    a?.street && a?.postal_code
      ? {
          name,
          street1: a.street,
          ...(a.unit ? { street2: `Unit ${a.unit}` } : {}),
          city: a.city,
          province: (a.province || "ON").slice(0, 2).toUpperCase(),
          country: "CAN",
          postalCode: a.postal_code.replace(/\s/g, "").toUpperCase(),
          ...(phone.length >= 10 && phone.length <= 15 ? { phone } : {}),
          ...(c.email ? { email: c.email } : {}),
        }
      : undefined;
  return {
    contactName: (c.first_name || c.last_name ? `${c.first_name} ${c.last_name}`.trim() : name) || "Customer",
    ...(c.company ? { businessName: c.company } : {}),
    ...(c.phone ? { cellPhone: c.phone } : {}),
    ...(address ? { billingAddress: address } : {}),
  };
}

/** Starts a Helcim checkout for this invoice and remembers the secret token. Returns the checkout token for the browser. */
export async function createCheckout(opts: { invoiceId: number; amountCents: number; source: "staff" | "customer"; userId?: number | null; receiptChannels?: string[] }): Promise<string> {
  const inv = getInvoice(opts.invoiceId);
  if (!inv) throw new Error("Invoice not found.");
  const c = getCustomer(inv.customer_id)!;
  const earlier = get<{ n: number }>("SELECT COUNT(*) AS n FROM payments WHERE invoice_id = ?", inv.id)?.n ?? 0;
  const base = `SF-${inv.number}${earlier ? `-${earlier + 1}` : ""}`;
  const body = (num: string, simple = false) => ({
    paymentType: "purchase",
    amount: dollars(opts.amountCents),
    currency: "CAD",
    paymentMethod: "cc",
    language: "en",
    confirmationScreen: false,
    customStyling: { brandColor: "F4C542", cornerRadius: "rounded", ctaButtonText: "pay" },
    ...(c.helcim_customer_code ? { customerCode: c.helcim_customer_code } : { customerRequest: customerRequest(inv.id) }),
    invoiceRequest: invoiceRequest(inv.id, opts.amountCents, num, simple),
  });
  type Init = { checkoutToken: string; secretToken: string };
  let res: Init;
  try {
    res = await helcim<Init>("/helcim-pay/initialize", { method: "POST", body: body(base) });
  } catch (e) {
    // Most likely that invoice number is already used in Helcim (e.g. a checkout that was opened and closed). Try a fresh one.
    if (/unauthor|api token/i.test((e as Error).message)) throw e;
    try {
      res = await helcim<Init>("/helcim-pay/initialize", { method: "POST", body: body(`${base}-${Date.now().toString(36).slice(-4).toUpperCase()}`, true) });
    } catch {
      // Last resort: let Helcim number the invoice itself.
      const b = body("");
      const { invoiceRequest: _drop, ...rest } = b;
      void _drop;
      res = await helcim<Init>("/helcim-pay/initialize", { method: "POST", body: rest });
    }
  }
  if (!res.checkoutToken || !res.secretToken) throw new Error("Helcim didn't start the checkout. Try again.");
  run(
    "INSERT INTO helcim_checkouts (checkout_token, secret_token, invoice_id, amount_cents, source, user_id, receipt_channels) VALUES (?, ?, ?, ?, ?, ?, ?)",
    res.checkoutToken,
    res.secretToken,
    inv.id,
    opts.amountCents,
    opts.source,
    opts.userId ?? null,
    (opts.receiptChannels ?? []).join(","),
  );
  return res.checkoutToken;
}

export type HelcimTxn = {
  transactionId: string;
  status: string;
  type?: string;
  amount: string;
  currency?: string;
  cardNumber?: string;
  cardType?: string;
  cardHolderName?: string;
  approvalCode?: string;
  customerCode?: string;
  invoiceNumber?: string;
};

/** Helcim hashes the JSON with non-ASCII characters (and, from PHP, slashes) escaped. */
function hashVariants(data: unknown, secret: string): string[] {
  const plain = JSON.stringify(data);
  const uni = plain.replace(/[\u007f-￿]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const slashes = uni.replace(/\//g, "\\/");
  return [...new Set([plain, uni, slashes])].map((j) => createHash("sha256").update(j + secret).digest("hex"));
}

/** Reads what the HelcimPay window sent back and checks it's genuine and approved for the right amount. */
export async function verifyResult(checkout: { secret_token: string; amount_cents: number }, eventMessage: unknown): Promise<HelcimTxn> {
  let msg: unknown = eventMessage;
  if (typeof msg === "string") {
    try {
      msg = JSON.parse(msg);
    } catch {
      throw new Error("Helcim sent back something unexpected.");
    }
  }
  // Shapes seen: {status, data: {data, hash}} or {data, hash}
  const outer = msg as { data?: { data?: unknown; hash?: string }; hash?: string };
  const wrapper = outer?.data && typeof outer.data === "object" && "hash" in outer.data ? outer.data : (outer as { data?: unknown; hash?: string });
  const data = wrapper?.data as HelcimTxn | undefined;
  const hash = wrapper?.hash;
  if (!data?.transactionId) throw new Error("Helcim didn't return a transaction.");

  let txn: HelcimTxn = data;
  const hashOk = !!hash && hashVariants(data, checkout.secret_token).includes(hash);
  if (!hashOk) {
    // Ask Helcim directly before trusting it.
    try {
      const live = await helcim<HelcimTxn & { cardTransactionId?: number | string }>(`/card-transactions/${encodeURIComponent(data.transactionId)}`);
      txn = { ...data, ...live, transactionId: String(live.transactionId ?? live.cardTransactionId ?? data.transactionId) };
    } catch {
      throw new Error(`Couldn't confirm Helcim transaction #${data.transactionId}. Check it in Helcim before recording it.`);
    }
  }
  if (!/^approv/i.test(txn.status ?? "")) throw new Error(`Helcim says the payment wasn't approved (${txn.status || "no status"}).`);
  if (txn.type && txn.type.toLowerCase() !== "purchase") throw new Error(`Unexpected Helcim transaction type: ${txn.type}.`);
  if (Math.round(Number(txn.amount) * 100) !== checkout.amount_cents) {
    throw new Error(`Helcim charged $${Number(txn.amount).toFixed(2)} but $${(checkout.amount_cents / 100).toFixed(2)} was expected. Check it in Helcim.`);
  }
  return txn;
}

export function cardLabel(t: HelcimTxn) {
  const brand = { VI: "Visa", MC: "Mastercard", AX: "Amex", DI: "Discover" }[String(t.cardType ?? "").toUpperCase()] ?? t.cardType ?? "Card";
  const last4 = (t.cardNumber ?? "").replace(/\D/g, "").slice(-4);
  return `${brand}${last4 ? ` ••••${last4}` : ""}`;
}
