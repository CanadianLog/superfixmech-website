import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { get, getSettings, run } from "./db";
import { customerName } from "./format";
import { toE164 } from "./messaging";

/**
 * Texts customers send to your Twilio number.
 *
 * Twilio posts each incoming text to /api/twilio/inbound. The CRM:
 *  - saves it on the matching customer's timeline, and
 *  - forwards it to your cell ("Text from Sarah Mitchell (613-555-0142): …").
 * When you reply to a forwarded text from your cell, the reply goes to the customer who texted last,
 * from your business number, so they never see your cell number.
 */

const TWILIO_API = process.env.TWILIO_API_BASE || "https://api.twilio.com";

/** Twilio signs each request: HMAC-SHA1 of the full URL plus every POST field (sorted by name), keyed with the auth token. */
export function validTwilioSignature(url: string, params: Record<string, string>, signature: string, authToken: string): boolean {
  if (!signature || !authToken) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const digits10 = (phone: string) => phone.replace(/\D/g, "").slice(-10);
const pretty = (e164: string) => {
  const d = digits10(e164);
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : e164;
};

export function twiml(messages: { to: string; body: string; media?: string[] }[]): string {
  const inner = messages
    .map((m) => `<Message to="${xml(m.to)}"><Body>${xml(m.body)}</Body>${(m.media ?? []).map((u) => `<Media>${xml(u)}</Media>`).join("")}</Message>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
}

function findCustomer(phone: string) {
  const d = digits10(phone);
  if (d.length !== 10) return undefined;
  return get<{ id: number; first_name: string; last_name: string; company: string }>(
    `SELECT id, first_name, last_name, company FROM customers
      WHERE substr(replace(replace(replace(replace(replace(phone,'-',''),' ',''),'(',''),')',''),'+',''), -10) = ?
         OR substr(replace(replace(replace(replace(replace(alt_phone,'-',''),' ',''),'(',''),')',''),'+',''), -10) = ?
      ORDER BY id DESC LIMIT 1`,
    d,
    d,
  );
}

function activity(customerId: number | null, body: string) {
  run("INSERT INTO activities (customer_id, kind, body) VALUES (?, 'message', ?)", customerId, body);
}

/** Handles one incoming text and returns the TwiML that tells Twilio what to send. */
export function handleInboundSms(p: Record<string, string>): string {
  const s = getSettings();
  const from = toE164(p.From ?? "") ?? p.From ?? "";
  const body = (p.Body ?? "").trim();
  const media = Array.from({ length: Math.min(10, Number(p.NumMedia) || 0) }, (_, i) => p[`MediaUrl${i}`]).filter(Boolean);
  const owner = toE164(s.sms_forward_to ?? "");

  // A reply from your own cell: pass it on to whoever texted last.
  if (owner && from === owner) {
    const last = get<{ from_number: string; customer_id: number | null }>(
      "SELECT from_number, customer_id FROM sms_inbound WHERE created_at >= ? ORDER BY id DESC LIMIT 1",
      new Date(Date.now() - 7 * 86400_000).toISOString(),
    );
    if (!last) return twiml([{ to: owner, body: "No customer has texted in the last 7 days, so there's no one to send that reply to." }]);
    if (!body && !media.length) return twiml([]);
    const c = last.customer_id ? get<{ first_name: string; last_name: string; company: string }>("SELECT first_name, last_name, company FROM customers WHERE id = ?", last.customer_id) : undefined;
    activity(last.customer_id, `You texted ${c ? customerName(c) : pretty(last.from_number)}: ${body || "(photo)"}`);
    return twiml([{ to: last.from_number, body, media }]);
  }

  const c = findCustomer(from);
  const who = c ? `${customerName(c)} (${pretty(from)})` : pretty(from);
  run("INSERT INTO sms_inbound (from_number, customer_id, body, media) VALUES (?, ?, ?, ?)", from, c?.id ?? null, body, media.join("\n"));
  activity(c?.id ?? null, `Text from ${c ? customerName(c) : pretty(from)}: ${body || ""}${media.length ? `${body ? " " : ""}(${media.length} photo${media.length === 1 ? "" : "s"})` : ""}`);

  if (!owner) return twiml([]);
  // Keywords Twilio handles itself (opt-out etc.) are still forwarded so you know.
  const note = /^(stop|stopall|unsubscribe|cancel|end|quit)$/i.test(body) ? "\n(They've opted out of texts.)" : "\n(Reply here to answer them.)";
  return twiml([{ to: owner, body: `Text from ${who}:\n${body || "(photo)"}${note}`, media }]);
}

/**
 * Points the Twilio number's "A message comes in" webhook at this CRM, so replies start flowing.
 * Returns a short status line for the settings page.
 */
export async function connectTwilioReplies(origin: string): Promise<{ ok: boolean; message: string }> {
  const s = getSettings();
  const from = toE164(s.twilio_from);
  if (!s.twilio_sid || !s.twilio_token || !from) return { ok: false, message: "Set up texting first." };
  const auth = `Basic ${Buffer.from(`${s.twilio_sid}:${s.twilio_token}`).toString("base64")}`;
  const base = `${TWILIO_API}/2010-04-01/Accounts/${encodeURIComponent(s.twilio_sid)}`;
  const hook = `${origin}/api/twilio/inbound`;
  try {
    const list = await fetch(`${base}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(from)}`, { headers: { Authorization: auth }, cache: "no-store" });
    if (!list.ok) throw new Error(`Twilio said ${list.status}`);
    const j = (await list.json()) as { incoming_phone_numbers?: { sid: string; sms_url?: string }[] };
    const num = j.incoming_phone_numbers?.[0];
    if (!num) return { ok: false, message: `Couldn't find ${from} in your Twilio account. Check the Twilio number above.` };
    if (num.sms_url === hook) return { ok: true, message: "Replies are connected." };
    const upd = await fetch(`${base}/IncomingPhoneNumbers/${num.sid}.json`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ SmsUrl: hook, SmsMethod: "POST" }),
      cache: "no-store",
    });
    if (!upd.ok) throw new Error(`Twilio said ${upd.status}`);
    return { ok: true, message: "Replies are connected." };
  } catch (e) {
    return {
      ok: false,
      message: `Couldn't connect replies automatically (${(e as Error).message}). In Twilio, open your number → Messaging configuration → “A message comes in”: Webhook, URL ${hook}, HTTP POST.`,
    };
  }
}
