import "server-only";
import { get, getSettings } from "./db";
import { getAddress, getCustomer, getInvoice, invoicePayments, lineItems, rateFor } from "./data";
import { helcimOnline } from "./helcim";
import { addressLine, computeTotals, customerName, fmtDate, lineTotal, money, taxLabel } from "./format";

/**
 * The invoice (or receipt) shown inside the email, so customers see everything without opening a link.
 * Built with tables and inline styles because email apps (Gmail, Outlook, Apple Mail) ignore most CSS.
 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const INK = "#1c1917";
const MUTED = "#78716c";
const LINE = "#e7e5e4";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * Turns the plain-text message into paragraphs. The bare link is left out (the invoice is shown below
 * and the button links to it), and wording that pointed at the link ("is ready:", "Your receipt:") is tidied.
 */
function introHtml(text: string, link: string): string {
  const lines = text.split("\n").map((line) => line.split(link).join("").trimEnd());
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hadLink = text.split("\n")[i]?.includes(link);
    if (hadLink && !line.trim()) continue; // the link on its own line
    const nextHadLink = text.split("\n")[i + 1]?.trim() === link;
    if (line.trim().endsWith(":") && (hadLink || nextHadLink)) {
      // "Your receipt:" on its own says nothing now; "…is ready:" becomes "…is ready."
      if (line.trim().length <= 25) continue;
      out.push(line.trim().replace(/:$/, "."));
      continue;
    }
    out.push(line);
  }
  return out
    .join("\n")
    .split(/\n{2,}/)
    .map((para) => para.split("\n").map(esc).join("<br>").trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:22px;color:${INK}">${p}</p>`)
    .join("");
}

export function documentEmailHtml(opts: {
  kind: "invoice" | "receipt";
  invoiceId: number;
  paymentId?: number;
  intro: string;
  link: string;
  origin: string;
}): string {
  const s = getSettings();
  const inv = getInvoice(opts.invoiceId);
  if (!inv) return "";
  const c = getCustomer(inv.customer_id)!;
  const job = inv.job_id ? get<{ address_id: number | null }>("SELECT address_id FROM jobs WHERE id = ?", inv.job_id) : undefined;
  const address = getAddress(job?.address_id ?? null);
  const items = lineItems("invoice", inv.id);
  const rate = rateFor("invoice", inv.id);
  const totals = computeTotals(items.map((i) => ({ ...i, taxable: !!i.taxable })), rate);
  const payments = invoicePayments(inv.id);
  const paid = payments.reduce((sum, p) => sum + p.amount_cents, 0);
  const balance = Math.max(0, totals.total - paid);
  const payment = opts.paymentId ? payments.find((p) => p.id === opts.paymentId) : undefined;
  const payOnline = opts.kind === "invoice" && helcimOnline(s) && balance > 0;
  const methodLabel = (m: string) => (m === "card" ? "credit card" : m === "e-transfer" ? "e-Transfer" : m);

  const row = (label: string, value: string, strong = false, color = INK) =>
    `<tr><td style="padding:3px 0;font-size:14px;color:${strong ? INK : MUTED};${strong ? "font-weight:700;" : ""}">${label}</td>` +
    `<td align="right" style="padding:3px 0;font-size:14px;color:${color};${strong ? "font-weight:700;" : ""}white-space:nowrap">${value}</td></tr>`;

  const lines = items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};vertical-align:top">
          <div style="font-weight:600">${esc(i.name)}</div>
          ${i.description ? `<div style="font-size:12px;color:${MUTED};white-space:pre-line">${esc(i.description)}</div>` : ""}
          <div style="font-size:12px;color:${MUTED}">${i.quantity} × ${money(i.unit_price_cents)}</div>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};vertical-align:top;white-space:nowrap">${money(lineTotal(i))}</td>
      </tr>`,
    )
    .join("");

  const paymentRows = payments
    .map((p) => row(`Paid ${esc(fmtDate(p.paid_on, { year: undefined }))}${p.method !== "other" ? ` (${esc(methodLabel(p.method))})` : ""}`, `−${money(p.amount_cents)}`))
    .join("");

  const receiptBanner =
    opts.kind === "receipt" && payment
      ? `<tr><td style="padding:0 28px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border-radius:10px">
            <tr><td align="center" style="padding:18px">
              <div style="font-size:13px;color:#047857;font-weight:600">Payment received${payment.method !== "other" ? ` by ${esc(methodLabel(payment.method))}` : ""} · ${esc(fmtDate(payment.paid_on))}</div>
              <div style="font-size:28px;font-weight:800;color:${INK};margin-top:4px">${money(payment.amount_cents)}</div>
            </td></tr>
          </table>
        </td></tr>`
      : "";

  const companyLines = [s.company_address, [s.company_phone, s.company_email].filter(Boolean).join(" · "), s.tax_number ? `HST/GST # ${s.tax_number}` : ""]
    .filter(Boolean)
    .map(esc)
    .join("<br>");

  const customerLines = [customerName(c), c.company && (c.first_name || c.last_name) ? c.company : "", c.email, c.phone].filter(Boolean).map(esc).join("<br>");

  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 0"><tr>
      <td style="background:#f4c542;border-radius:999px"><a href="${esc(opts.link)}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:700;color:#2f2512;text-decoration:none">${opts.kind === "invoice" ? (payOnline ? "View &amp; pay invoice" : "View &amp; print invoice") : "View &amp; print receipt"}</a></td>
    </tr></table>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(opts.kind === "invoice" ? `Invoice #${inv.number}` : `Receipt for invoice #${inv.number}`)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f4">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;font-family:${FONT}">
<tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
    <tr><td style="padding:0 4px 16px">${introHtml(opts.intro, opts.link)}</td></tr>
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${LINE};border-radius:14px">
        <tr><td style="padding:24px 28px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top">
              <img src="${esc(opts.origin)}/logo.png" alt="${esc(s.company_name)}" width="120" style="display:block;width:120px;height:auto;border:0;margin-bottom:8px">
              <div style="font-size:16px;font-weight:700;color:${INK}">${esc(s.company_name)}</div>
              <div style="font-size:12px;line-height:18px;color:${MUTED};margin-top:4px">${companyLines}</div>
            </td>
            <td align="right" style="vertical-align:top;white-space:nowrap">
              <div style="font-size:22px;font-weight:800;color:${INK}">${opts.kind === "invoice" ? "Invoice" : "Receipt"}</div>
              <div style="font-size:14px;color:${MUTED}">#${inv.number}</div>
              <div style="font-size:12px;color:${MUTED};margin-top:6px">Issued <span style="color:${INK}">${esc(fmtDate(inv.issued_on))}</span></div>
              <div style="font-size:12px;color:${MUTED}">Due <span style="color:${INK}">${esc(fmtDate(inv.due_on))}</span></div>
            </td>
          </tr></table>
        </td></tr>
        ${receiptBanner}
        <tr><td style="padding:12px 28px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top;padding-right:12px">
              <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${MUTED}">Prepared for</div>
              <div style="font-size:14px;line-height:20px;color:${INK};margin-top:4px">${customerLines}</div>
            </td>
            ${
              address
                ? `<td style="vertical-align:top">
              <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${MUTED}">Service address</div>
              <div style="font-size:14px;line-height:20px;color:${INK};margin-top:4px">${esc(addressLine(address))}</div>
            </td>`
                : ""
            }
          </tr></table>
        </td></tr>
        <tr><td style="padding:16px 28px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 0 6px;border-bottom:2px solid ${INK};font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${INK}">Description</td>
              <td align="right" style="padding:0 0 6px;border-bottom:2px solid ${INK};font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${INK}">Amount</td>
            </tr>
            ${lines}
          </table>
        </td></tr>
        <tr><td align="right" style="padding:12px 28px 4px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:280px">
            ${row("Subtotal", money(totals.subtotal))}
            ${row(esc(taxLabel(rate)), money(totals.tax))}
            <tr><td colspan="2" style="border-top:2px solid ${INK};padding-top:4px"></td></tr>
            ${row("Total", money(totals.total), true)}
            ${paymentRows}
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:280px;margin-top:8px;background:${balance > 0 ? "#fef9e7" : "#ecfdf5"};border-radius:8px">
            <tr><td style="padding:10px 12px;font-size:15px;font-weight:700;color:${INK}">${balance > 0 ? "Balance due" : "Paid in full"}</td>
            <td align="right" style="padding:10px 12px;font-size:15px;font-weight:700;color:${INK};white-space:nowrap">${money(balance)}</td></tr>
          </table>
        </td></tr>
        ${inv.notes ? `<tr><td style="padding:16px 28px 0;font-size:13px;line-height:19px;color:${MUTED};white-space:pre-line">${esc(inv.notes)}</td></tr>` : ""}
        <tr><td style="padding:16px 28px 24px;font-size:13px;line-height:19px;color:${MUTED}">
          ${balance > 0 ? (payOnline ? `Pay by card online with the button below, or e-transfer to ${esc(s.company_email)}.<br><br>` : `Payment options: e-transfer to ${esc(s.company_email)}, or call ${esc(s.company_phone)} to pay by card.<br><br>`) : ""}
          ${button}
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:16px 4px;font-size:11px;color:${MUTED}">${esc(s.company_name)} · ${esc(s.company_phone)} · ${esc(s.company_email)}</td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}
