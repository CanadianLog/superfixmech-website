import { NextResponse, type NextRequest } from "next/server";
import { get, getSettings, nextNumber, run, tx } from "@/lib/db";

/**
 * Public endpoint for website booking forms.
 * Accepts JSON or form posts. Creates/matches the customer and adds an unscheduled job.
 */

const CORS = {
  "Access-Control-Allow-Origin": process.env.CRM_BOOKING_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: CORS });

  let body: Record<string, string> = {};
  const isForm = !(req.headers.get("content-type") ?? "").includes("application/json");
  try {
    if (isForm) {
      const fd = await req.formData();
      fd.forEach((v, k) => (body[k] = String(v)));
    } else {
      const json = await req.json();
      body = Object.fromEntries(Object.entries(json ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)]));
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: CORS });
  }
  const f = (k: string, max = 500) => (body[k] ?? "").trim().slice(0, max);

  const key = getSettings().booking_api_key;
  if (!key) return NextResponse.json({ error: "Online booking is not enabled" }, { status: 503, headers: CORS });
  if (f("key") !== key) return NextResponse.json({ error: "Invalid key" }, { status: 401, headers: CORS });

  // Honeypot: real people never fill a hidden "website" field.
  if (f("website")) return done(isForm, f("redirect", 1000), 0);

  const first = f("first_name", 100) || f("name", 100).split(" ")[0] || "";
  const last = f("last_name", 100) || f("name", 100).split(" ").slice(1).join(" ");
  const phone = f("phone", 40);
  const email = f("email", 200);
  if (!(first || last) || !(phone || email)) {
    return NextResponse.json({ error: "Name and a phone number or email are required" }, { status: 422, headers: CORS });
  }

  const digits = phone.replace(/\D/g, "");
  const jobId = tx(() => {
    let customer =
      (email && get<{ id: number }>("SELECT id FROM customers WHERE email = ? COLLATE NOCASE AND email != ''", email)) ||
      (digits.length >= 7 &&
        get<{ id: number }>(
          "SELECT id FROM customers WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,'-',''),' ',''),'(',''),')',''),'.','') LIKE ?",
          `%${digits.slice(-10)}`,
        )) ||
      undefined;
    if (!customer) {
      customer = { id: run("INSERT INTO customers (first_name, last_name, email, phone, lead_source) VALUES (?, ?, ?, ?, 'Online booking')", first, last, email, phone).id };
    }
    let addressId: number | null = null;
    if (f("street")) {
      const existing = get<{ id: number }>("SELECT id FROM addresses WHERE customer_id = ? AND street = ? COLLATE NOCASE", customer.id, f("street"));
      addressId =
        existing?.id ??
        run(
          "INSERT INTO addresses (customer_id, street, unit, city, province, postal_code) VALUES (?, ?, ?, ?, ?, ?)",
          customer.id,
          f("street"),
          f("unit", 40),
          f("city", 100),
          f("province", 10) || "ON",
          f("postal_code", 10).toUpperCase(),
        ).id;
    }
    const appliance = f("appliance", 100);
    const issue = f("issue", 2000) || f("message", 2000);
    const preferred = [f("preferred_date", 20), f("preferred_time", 40)].filter(Boolean).join(" ");
    const description = [issue, preferred && `Preferred time: ${preferred}`].filter(Boolean).join("\n\n");
    const number = nextNumber("jobs", 1001);
    const { id } = run(
      `INSERT INTO jobs (number, customer_id, address_id, title, description, appliance, brand, model, status, lead_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unscheduled', 'Online booking')`,
      number,
      customer.id,
      addressId,
      (appliance ? `${appliance}: ${issue || "service request"}` : issue || "Online booking request").slice(0, 120),
      description,
      appliance,
      f("brand", 100),
      f("model", 100),
    );
    run("INSERT INTO activities (customer_id, job_id, kind, body) VALUES (?, ?, 'portal', ?)", customer.id, id, `Online booking request received (job #${number})`);
    return number;
  });

  return done(isForm, f("redirect", 1000), jobId);
}

function done(isForm: boolean, redirect: string, jobNumber: number) {
  if (isForm && /^https?:\/\//.test(redirect)) return NextResponse.redirect(redirect, { status: 303, headers: CORS });
  return NextResponse.json({ ok: true, job: jobNumber || undefined }, { status: 201, headers: CORS });
}
