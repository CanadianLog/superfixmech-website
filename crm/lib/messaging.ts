import "server-only";
import nodemailer from "nodemailer";
import { all, get, getSettings, run } from "./db";
import { customerName, money } from "./format";
import { timeZone } from "./data";

/**
 * Texts go out through Twilio and emails through your own mailbox (SMTP: Gmail, Outlook, etc.).
 * Every message is stored in the `messages` table; review requests are queued and sent later by a
 * worker that runs inside the server. When a channel isn't set up, callers fall back to opening the
 * phone's own SMS/email app with the message pre-written.
 */

export type Channel = "sms" | "email";
export type MessageKind = "invoice" | "receipt" | "review" | "test" | "notice";

export function smsConfigured(s = getSettings()) {
  return !!(s.twilio_sid && s.twilio_token && s.twilio_from);
}
export function emailConfigured(s = getSettings()) {
  return !!(s.smtp_host && s.smtp_user && s.smtp_pass);
}

/** North American numbers to +1XXXXXXXXXX; anything already starting with + is kept. */
export function toE164(phone: string): string | null {
  const t = phone.trim();
  if (t.startsWith("+")) return `+${t.replace(/\D/g, "")}`;
  const d = t.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

async function sendSms(to: string, body: string) {
  const s = getSettings();
  const number = toE164(to);
  if (!number) throw new Error(`“${to}” isn't a valid mobile number`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(s.twilio_sid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${s.twilio_sid}:${s.twilio_token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: number, From: s.twilio_from, Body: body }),
    cache: "no-store",
  }).catch((e: Error) => {
    throw new Error(`Couldn't reach Twilio (${e.message}). Check the internet connection and try again`);
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string; code?: number };
    if (j.code === 21610) throw new Error("This customer replied STOP to your texts, so Twilio won't deliver to them");
    throw new Error(`Twilio: ${j.message ?? res.statusText}`);
  }
}

async function sendEmail(to: string, subject: string, body: string) {
  const s = getSettings();
  const port = Number(s.smtp_port) || 465;
  const transport = nodemailer.createTransport({
    host: s.smtp_host,
    port,
    secure: port === 465,
    auth: { user: s.smtp_user, pass: s.smtp_pass },
  });
  await transport.sendMail({
    from: { name: s.smtp_from_name || s.company_name, address: s.smtp_user.includes("@") ? s.smtp_user : s.company_email },
    replyTo: s.company_email || undefined,
    to,
    subject,
    text: body,
  });
}

/** Sends one stored message now and records the outcome (and a line in the job/customer timeline). */
async function deliver(id: number): Promise<{ ok: boolean; error?: string }> {
  const m = get<{ id: number; channel: Channel; recipient: string; subject: string; body: string; kind: string; customer_id: number | null; job_id: number | null; status: string }>(
    "SELECT * FROM messages WHERE id = ?",
    id,
  );
  if (!m || m.status !== "queued") return { ok: false, error: "Already handled" };
  // Claim it first so two workers never send the same message twice.
  if (run("UPDATE messages SET status = 'sent', sent_at = ? WHERE id = ? AND status = 'queued'", new Date().toISOString(), id).changes === 0) {
    return { ok: false, error: "Already handled" };
  }
  const what = { invoice: "Invoice", receipt: "Receipt", review: "Google review request", test: "Test message", notice: "New-booking alert" }[m.kind] ?? "Message";
  const how = m.channel === "sms" ? `texted to ${m.recipient}` : `emailed to ${m.recipient}`;
  try {
    if (m.channel === "sms") await sendSms(m.recipient, m.body);
    else await sendEmail(m.recipient, m.subject, m.body);
    if (m.customer_id) run("INSERT INTO activities (customer_id, job_id, kind, body) VALUES (?, ?, 'message', ?)", m.customer_id, m.job_id, `${what} ${how}`);
    return { ok: true };
  } catch (e) {
    const error = (e as Error).message;
    run("UPDATE messages SET status = 'failed', error = ?, sent_at = NULL WHERE id = ?", error, id);
    if (m.customer_id) run("INSERT INTO activities (customer_id, job_id, kind, body) VALUES (?, ?, 'message', ?)", m.customer_id, m.job_id, `${what} could not be ${how.replace(/ed to/, "ed to")}: ${error}`);
    return { ok: false, error };
  }
}

export async function queueMessage(opts: {
  kind: MessageKind;
  channel: Channel;
  recipient: string;
  subject?: string;
  body: string;
  customerId?: number | null;
  jobId?: number | null;
  invoiceId?: number | null;
  sendAfter?: Date;
  sendNow?: boolean;
}): Promise<{ ok: boolean; error?: string; id: number }> {
  const { id } = run(
    `INSERT INTO messages (kind, channel, customer_id, job_id, invoice_id, recipient, subject, body, send_after)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    opts.kind,
    opts.channel,
    opts.customerId ?? null,
    opts.jobId ?? null,
    opts.invoiceId ?? null,
    opts.recipient,
    opts.subject ?? "",
    opts.body,
    (opts.sendAfter ?? new Date()).toISOString(),
  );
  if (opts.sendNow === false) return { ok: true, id };
  return { ...(await deliver(id)), id };
}

/** Sends every queued message whose time has come. Safe to call often. */
export async function processDueMessages() {
  const s = getSettings();
  const due = all<{ id: number; channel: Channel }>(
    "SELECT id, channel FROM messages WHERE status = 'queued' AND send_after <= ? ORDER BY send_after LIMIT 25",
    new Date().toISOString(),
  );
  for (const m of due) {
    if ((m.channel === "sms" && !smsConfigured(s)) || (m.channel === "email" && !emailConfigured(s))) {
      run(
        "UPDATE messages SET status = 'failed', error = ? WHERE id = ?",
        m.channel === "sms" ? "Texting isn't set up (Settings → Texts & email)" : "Email isn't set up (Settings → Texts & email)",
        m.id,
      );
      continue;
    }
    await deliver(m.id);
  }
}

type Globals = typeof globalThis & { __crmWorker?: ReturnType<typeof setInterval> };

/** Starts the once-a-minute sender (idempotent). Called from the app layout and the health check. */
export function ensureWorker() {
  const g = globalThis as Globals;
  if (g.__crmWorker) return;
  g.__crmWorker = setInterval(() => {
    processDueMessages().catch((e) => console.error("message worker:", e));
  }, 60_000);
  g.__crmWorker.unref?.();
  processDueMessages().catch((e) => console.error("message worker:", e));
}

/* ---------------- building messages ---------------- */

type CustomerLite = { id: number; first_name: string; last_name: string; company: string; email: string; phone: string; no_review?: number };

export function baseVars(c: CustomerLite): Record<string, string> {
  const s = getSettings();
  return {
    first_name: c.first_name || customerName(c),
    name: customerName(c),
    company: s.company_name,
    phone: s.company_phone,
    review_link: s.google_review_url,
  };
}

export function invoiceVars(invoiceId: number, link: string): Record<string, string> {
  const inv = get<{ number: number }>("SELECT number FROM invoices WHERE id = ?", invoiceId);
  return { invoice_number: String(inv?.number ?? ""), link };
}

export function amountVar(cents: number) {
  return money(cents);
}

export const METHOD_LABEL: Record<string, string> = {
  "e-transfer": "e-Transfer",
  card: "credit card",
  cash: "cash",
  cheque: "cheque",
  financing: "financing",
  other: "other",
};

/** Moves a send time out of quiet hours (8pm–9am local) so customers aren't texted at night. */
function respectQuietHours(when: Date, tz: string): Date {
  const hour = Number(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(when));
  if (hour >= 9 && hour < 20) return when;
  // Step forward in 15-minute increments until 9:00 local (at most ~13 hours).
  const next = new Date(when);
  for (let i = 0; i < 60; i++) {
    next.setTime(next.getTime() + 15 * 60_000);
    const h = Number(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(next));
    if (h >= 9 && h < 20) return next;
  }
  return next;
}

/**
 * Queues the Google review request for a finished job, if enabled.
 * Skips customers who opted out or were asked recently. Returns a short status line.
 */
export function scheduleReviewRequest(jobId: number): string {
  const s = getSettings();
  if (s.review_auto !== "1") return "Review requests are turned off.";
  if (!s.google_review_url) return "Add your Google review link in Settings to send review requests.";
  const job = get<{ customer_id: number }>("SELECT customer_id FROM jobs WHERE id = ?", jobId);
  if (!job) return "";
  const c = get<CustomerLite>("SELECT * FROM customers WHERE id = ?", job.customer_id);
  if (!c) return "";
  if (c.no_review) return "Customer opted out of review requests.";
  if (get("SELECT id FROM messages WHERE job_id = ? AND kind = 'review' AND status IN ('queued','sent')", jobId)) return "Review request already scheduled.";
  const cooldown = Number(s.review_cooldown_days) || 0;
  if (cooldown > 0) {
    const since = new Date(Date.now() - cooldown * 86400_000).toISOString();
    if (get("SELECT id FROM messages WHERE customer_id = ? AND kind = 'review' AND status = 'sent' AND sent_at >= ?", c.id, since)) {
      return `Already asked this customer for a review in the last ${cooldown} days.`;
    }
  }
  const vars = baseVars(c);
  const delay = Math.max(0, Number(s.review_delay_minutes) || 0);
  const when = respectQuietHours(new Date(Date.now() + delay * 60_000), timeZone());
  const sms = toE164(c.phone);
  if (sms) {
    run(
      `INSERT INTO messages (kind, channel, customer_id, job_id, recipient, body, send_after) VALUES ('review', 'sms', ?, ?, ?, ?, ?)`,
      c.id,
      jobId,
      c.phone,
      fill(s.tpl_review_sms, vars),
      when.toISOString(),
    );
  } else if (c.email) {
    run(
      `INSERT INTO messages (kind, channel, customer_id, job_id, recipient, subject, body, send_after) VALUES ('review', 'email', ?, ?, ?, ?, ?, ?)`,
      c.id,
      jobId,
      c.email,
      `How did we do? – ${s.company_name}`,
      fill(s.tpl_review_email, vars),
      when.toISOString(),
    );
  } else {
    return "No mobile number or email on file, so no review request was scheduled.";
  }
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: timeZone(), weekday: "short", hour: "numeric", minute: "2-digit" }).format(when);
  return `Google review request will be sent ${local}.`;
}

export type JobMessage = { id: number; kind: string; channel: Channel; recipient: string; status: string; error: string; send_after: string; sent_at: string | null };

export function messagesForJob(jobId: number): JobMessage[] {
  return all<JobMessage>(
    "SELECT id, kind, channel, recipient, status, error, send_after, sent_at FROM messages WHERE job_id = ? ORDER BY id DESC",
    jobId,
  );
}

