import "server-only";
import ICAL from "ical.js";
import { all, get, getSettings, run } from "./db";
import { timeZone } from "./data";
import { customerName } from "./format";
import { randomToken } from "./auth";

/**
 * Calendar sync, both ways, without anyone's Apple password:
 *  - Out: each user gets a private calendar link (webcal://…/api/calendar/<token>.ics) with their jobs.
 *    Subscribe to it on the iPhone (or iCloud.com) and jobs show up in the Calendar app.
 *  - In: a user can paste the public link of one of their iCloud calendars; those events show as
 *    "busy" blocks on the CRM schedule so nobody books over them.
 */

/* ---------------- time helpers ---------------- */

/** "2026-11-27T09:30" in the business time zone → Date (UTC instant). */
export function localToUtc(local: string, tz: string): Date {
  const [d, t = "00:00"] = local.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  const offset = (at: number) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
        .formatToParts(new Date(at))
        .map((x) => [x.type, x.value]),
    );
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - at;
  };
  let utc = guess - offset(guess);
  utc = guess - offset(utc); // second pass settles daylight-saving edges
  return new Date(utc);
}

/** Date → "YYYY-MM-DDTHH:mm" wall clock in the business time zone. */
export function utcToLocal(date: Date, tz: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/* ---------------- out: the CRM's calendar feed ---------------- */

export function calendarToken(userId: number): string {
  const u = get<{ calendar_token: string }>("SELECT calendar_token FROM users WHERE id = ?", userId);
  if (u?.calendar_token) return u.calendar_token;
  const t = randomToken(24);
  run("UPDATE users SET calendar_token = ? WHERE id = ?", t, userId);
  return t;
}

export function resetCalendarToken(userId: number) {
  run("UPDATE users SET calendar_token = ? WHERE id = ?", randomToken(24), userId);
}

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
/** ICS lines must be folded at 75 bytes. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
}

type FeedJob = {
  id: number;
  number: number;
  title: string;
  description: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string | null;
  appliance: string;
  brand: string;
  model: string;
  first_name: string;
  last_name: string;
  company: string;
  phone: string;
  street: string | null;
  unit: string | null;
  city: string | null;
  postal_code: string | null;
  tech_name: string | null;
  updated: string | null;
};

export function feedFor(token: string, origin: string): string | null {
  const user = get<{ id: number; role: string; name: string; active: number }>("SELECT id, role, name, active FROM users WHERE calendar_token = ? AND calendar_token != ''", token);
  if (!user || !user.active) return null;
  const tz = timeZone();
  const s = getSettings();
  const from = new Date(Date.now() - 60 * 86400_000).toISOString().slice(0, 10);
  const mine = user.role === "tech";
  const jobs = all<FeedJob>(
    `SELECT j.id, j.number, j.title, j.description, j.status, j.scheduled_start, j.scheduled_end, j.appliance, j.brand, j.model,
            c.first_name, c.last_name, c.company, c.phone, a.street, a.unit, a.city, a.postal_code, u.name AS tech_name,
            COALESCE(j.completed_at, j.started_at, j.created_at) AS updated
       FROM jobs j JOIN customers c ON c.id = j.customer_id
       LEFT JOIN addresses a ON a.id = j.address_id LEFT JOIN users u ON u.id = j.tech_id
      WHERE j.scheduled_start IS NOT NULL AND j.scheduled_start >= ? AND j.status != 'canceled' ${mine ? "AND j.tech_id = ?" : ""}
      ORDER BY j.scheduled_start LIMIT 2000`,
    ...(mine ? [from, user.id] : [from]),
  );
  const now = icsStamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SuperFix CRM//Jobs//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsText(`${s.company_name || "CRM"} jobs${mine ? ` – ${user.name}` : ""}`)}`,
    `X-WR-TIMEZONE:${tz}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
  ];
  for (const j of jobs) {
    const start = localToUtc(j.scheduled_start, tz);
    const end = j.scheduled_end && j.scheduled_end > j.scheduled_start ? localToUtc(j.scheduled_end, tz) : new Date(start.getTime() + 2 * 3600_000);
    const who = customerName(j);
    const address = [j.street && `${j.street}${j.unit ? ` #${j.unit}` : ""}`, j.city, j.postal_code].filter(Boolean).join(", ");
    const what = [j.appliance, j.brand].filter(Boolean).join(" ");
    const done = j.status === "completed" ? "✓ " : "";
    const desc = [
      `Job #${j.number}${j.tech_name && !mine ? ` · ${j.tech_name}` : ""}`,
      j.phone && `Phone: ${j.phone}`,
      what && `Appliance: ${what}${j.model ? ` (model ${j.model})` : ""}`,
      j.description,
      `${origin}/jobs/${j.id}`,
    ]
      .filter(Boolean)
      .join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:job-${j.id}@superfix-crm`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      fold(`SUMMARY:${icsText(`${done}${who} – ${j.title || what || "Service call"}`)}`),
      ...(address ? [fold(`LOCATION:${icsText(address)}`)] : []),
      fold(`DESCRIPTION:${icsText(desc)}`),
      fold(`URL:${origin}/jobs/${j.id}`),
      `STATUS:${j.status === "unscheduled" ? "TENTATIVE" : "CONFIRMED"}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/* ---------------- in: someone's iCloud calendar as busy time ---------------- */

export type BusyBlock = { userId: number; start: string; end: string; title: string; allDay: boolean };

type Cached = { at: number; text?: string; error?: string };
const g = globalThis as typeof globalThis & { __calCache?: Map<string, Cached> };
const cache = (g.__calCache ??= new Map());

export function normalizeCalendarUrl(url: string): string | null {
  const u = url.trim().replace(/^webcals?:\/\//i, "https://");
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

async function fetchCalendar(url: string, force = false): Promise<Cached> {
  const hit = cache.get(url);
  if (hit && !force && Date.now() - hit.at < 10 * 60_000) return hit;
  let entry: Cached;
  try {
    const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": "SuperFix-CRM calendar" }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(res.status === 404 ? "the link doesn't work any more (was sharing turned off?)" : `the calendar server said ${res.status}`);
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("that link isn't a calendar");
    entry = { at: Date.now(), text };
  } catch (e) {
    const msg = (e as Error).name === "TimeoutError" ? "the calendar took too long to answer" : (e as Error).message;
    // Keep showing the last good copy if we have one.
    entry = hit?.text ? { ...hit, at: Date.now(), error: msg } : { at: Date.now(), error: msg };
  }
  cache.set(url, entry);
  return entry;
}

/** Reads events between two local dates ("YYYY-MM-DD") from an ICS file. */
export function parseBusy(text: string, fromDay: string, toDay: string, tz: string): Omit<BusyBlock, "userId">[] {
  const comp = new ICAL.Component(ICAL.parse(text));
  for (const vtz of comp.getAllSubcomponents("vtimezone")) {
    try {
      ICAL.TimezoneService.register(vtz);
    } catch {
      /* ignore broken zones */
    }
  }
  const rangeStart = localToUtc(`${fromDay}T00:00`, tz).getTime();
  const rangeEnd = localToUtc(`${toDay}T00:00`, tz).getTime();
  const events = comp.getAllSubcomponents("vevent").map((v) => new ICAL.Event(v));
  const masters = new Map<string, ICAL.Event>();
  for (const e of events) if (!e.isRecurrenceException()) masters.set(e.uid, e);
  for (const e of events) if (e.isRecurrenceException()) masters.get(e.uid)?.relateException(e);

  const toDate = (t: ICAL.Time) => {
    if (t.isDate) return localToUtc(`${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}T00:00`, tz);
    if (t.zone === ICAL.Timezone.localTimezone) return localToUtc(`${t.toString().slice(0, 16)}`, tz); // floating time = business time
    return t.toJSDate();
  };
  const out: Omit<BusyBlock, "userId">[] = [];
  const push = (e: ICAL.Event, s: ICAL.Time, en: ICAL.Time | null) => {
    if (String(e.component.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED") return;
    if (String(e.component.getFirstPropertyValue("transp") ?? "").toUpperCase() === "TRANSPARENT") return;
    const start = toDate(s);
    const end = en ? toDate(en) : new Date(start.getTime() + (s.isDate ? 86400_000 : 3600_000));
    if (end.getTime() <= rangeStart || start.getTime() >= rangeEnd) return;
    out.push({ start: utcToLocal(start, tz), end: utcToLocal(end, tz), title: e.summary || "Busy", allDay: s.isDate });
  };
  for (const e of masters.values()) {
    try {
      if (!e.isRecurring()) {
        push(e, e.startDate, e.endDate);
        continue;
      }
      const it = e.iterator();
      for (let i = 0, next = it.next(); next && i < 3000; i++, next = it.next()) {
        const occ = e.getOccurrenceDetails(next);
        if (toDate(occ.startDate).getTime() >= rangeEnd) break;
        push(occ.item, occ.startDate, occ.endDate);
      }
    } catch {
      /* skip events we can't read */
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

/** Busy blocks for everyone (or one user) with a linked calendar, between two local dates. */
export async function busyBlocks(fromDay: string, toDay: string, userId?: number): Promise<BusyBlock[]> {
  const users = all<{ id: number; busy_calendar_url: string }>(
    `SELECT id, busy_calendar_url FROM users WHERE active = 1 AND busy_calendar_url != ''${userId ? " AND id = ?" : ""}`,
    ...(userId ? [userId] : []),
  );
  const tz = timeZone();
  const lists = await Promise.all(
    users.map(async (u) => {
      const c = await fetchCalendar(u.busy_calendar_url);
      if (!c.text) return [];
      try {
        return parseBusy(c.text, fromDay, toDay, tz).map((b) => ({ ...b, userId: u.id }));
      } catch {
        return [];
      }
    }),
  );
  return lists.flat();
}

/** Checks a calendar link right now (used when saving it). */
export async function checkCalendar(url: string): Promise<{ ok: boolean; message: string }> {
  const c = await fetchCalendar(url, true);
  if (c.error && !c.text) return { ok: false, message: `Couldn't read that calendar: ${c.error}.` };
  try {
    const tz = timeZone();
    const today = utcToLocal(new Date(), tz).slice(0, 10);
    const until = utcToLocal(new Date(Date.now() + 30 * 86400_000), tz).slice(0, 10);
    const n = parseBusy(c.text!, today, until, tz).length;
    return { ok: true, message: `Connected. ${n} event${n === 1 ? "" : "s"} in the next 30 days.` };
  } catch {
    return { ok: false, message: "That link opened, but the calendar in it couldn't be read." };
  }
}
