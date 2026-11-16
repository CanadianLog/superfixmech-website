"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { brandNames, company, crmUrl } from "@/lib/site-data";

const SERVICES = ["Repair", "Installation", "Maintenance"];
const APPLIANCES = [
  "Refrigerator",
  "Freezer",
  "Dishwasher",
  "Washer",
  "Dryer",
  "Oven / Range",
  "Cooktop",
  "Microwave",
  "Range hood",
  "Ice maker",
  "Other",
];
const TIMES = ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Any time"];

const input =
  "w-full rounded-xl border border-[#e8d49a] bg-white px-3.5 py-2.5 text-[15px] text-[#2f2512] outline-none transition placeholder:text-[#b59a62] focus:border-[#d6a52d] focus:ring-2 focus:ring-[#f4e3b0]";
const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-[#7e6b45]";

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Gtag = (...args: unknown[]) => void;

/** Booking request form. Each submission lands in the SuperFix CRM as an unscheduled job. */
export function BookingRequestForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [service, setService] = useState("Repair");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    data.service_type = service;
    data.source_page = window.location.pathname;
    setSending(true);
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(`${crmUrl}/api/public/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Error ${res.status}`);
      }
      const gtag = (window as unknown as { gtag?: Gtag }).gtag;
      if (typeof gtag === "function") gtag("event", "generate_lead", { form: "booking", service_type: service, appliance: data.appliance });
      router.push("/thank-you");
    } catch (err) {
      const msg = (err as Error).name === "AbortError" ? "The request timed out" : (err as Error).message;
      setError(msg);
      setSending(false);
    } finally {
      window.clearTimeout(timer);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`mx-auto w-full max-w-xl space-y-5 ${compact ? "p-5" : ""}`}>
      {/* Honeypot: hidden from people, bots fill it in */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset>
        <legend className={label}>What do you need?</legend>
        <div className="grid grid-cols-3 gap-2">
          {SERVICES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setService(s)}
              aria-pressed={service === s}
              className={`rounded-xl border-2 px-2 py-2.5 text-sm font-bold transition ${
                service === s ? "border-[#d6a52d] bg-[#fff4cf] text-[#2f2512]" : "border-[#efe0b4] bg-white text-[#7e6b45] hover:border-[#e2c879]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Appliance *</span>
          <select name="appliance" required className={input} defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {APPLIANCES.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Brand</span>
          <input name="brand" list="booking-brands" className={input} placeholder="e.g. Samsung" />
          <datalist id="booking-brands">
            {brandNames.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="block">
        <span className={label}>What&apos;s going on?</span>
        <textarea
          name="issue"
          rows={3}
          maxLength={2000}
          className={input}
          placeholder="e.g. Fridge isn't cooling, freezer is fine. Clicking noise at the back."
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>First name *</span>
          <input name="first_name" required autoComplete="given-name" className={input} />
        </label>
        <label className="block">
          <span className={label}>Last name</span>
          <input name="last_name" autoComplete="family-name" className={input} />
        </label>
        <label className="block">
          <span className={label}>Mobile phone *</span>
          <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" className={input} placeholder="Your phone number" />
        </label>
        <label className="block">
          <span className={label}>Email</span>
          <input name="email" type="email" autoComplete="email" className={input} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-6">
        <label className="block sm:col-span-4">
          <span className={label}>Street address *</span>
          <input name="street" required autoComplete="address-line1" className={input} placeholder="123 Main St" />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>Unit</span>
          <input name="unit" autoComplete="address-line2" className={input} />
        </label>
        <label className="block sm:col-span-3">
          <span className={label}>City</span>
          <input name="city" autoComplete="address-level2" defaultValue="Ottawa" className={input} />
        </label>
        <label className="block sm:col-span-3">
          <span className={label}>Postal code</span>
          <input name="postal_code" autoComplete="postal-code" className={`${input} uppercase`} placeholder="K1A 0A1" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Preferred day</span>
          <input name="preferred_date" type="date" min={todayLocal()} className={input} />
        </label>
        <label className="block">
          <span className={label}>Preferred time</span>
          <select name="preferred_time" className={input} defaultValue="Any time">
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Sorry, we couldn&apos;t send your request ({error}). Please call us at{" "}
          <a href="tel:+16133667009" className="font-bold underline">
            {company.phone}
          </a>{" "}
          or try again.
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-full bg-[#f4c542] px-6 py-3.5 text-base font-extrabold text-[#2f2512] shadow-[0_10px_24px_-12px_rgba(141,97,14,0.8)] transition hover:bg-[#e9b82f] disabled:cursor-wait disabled:opacity-70"
      >
        {sending ? "Sending…" : "Request appointment"}
      </button>
      <p className="text-center text-xs text-[#9a8250]">
        We&apos;ll call or text to confirm your time. Prefer to talk now?{" "}
        <a href="tel:+16133667009" className="font-semibold underline">
          {company.phone}
        </a>
      </p>
    </form>
  );
}
