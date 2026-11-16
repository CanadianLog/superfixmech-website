"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { finishCardPayment, startCardPayment, startOnlinePayment } from "@/lib/actions";

declare global {
  interface Window {
    appendHelcimPayIframe?: (checkoutToken: string, allowExit?: boolean) => void;
  }
}

const SCRIPT = "https://secure.helcim.app/helcim-pay/services/start.js";

function loadHelcim(): Promise<void> {
  if (window.appendHelcimPayIframe) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SCRIPT;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("Couldn't load Helcim's payment window. Check the internet connection.")));
    // Already loaded before we attached listeners
    if (window.appendHelcimPayIframe) resolve();
  });
}

function removeFrame() {
  document.getElementById("helcimPayIframe")?.remove();
}

type Result = { ok?: string; error?: string; links?: { label: string; href: string }[] };

/**
 * "Pay by card" button. Staff mode charges an amount on an invoice (reads the amount and receipt boxes
 * from the surrounding payment form); customer mode pays the full balance from the invoice link.
 */
export function CardPayButton(props: { mode: "staff"; invoiceId: number; label?: string } | { mode: "customer"; token: string; label?: string }) {
  const router = useRouter();
  const btn = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const listener = useRef<((e: MessageEvent) => void) | null>(null);

  useEffect(() => () => {
    if (listener.current) window.removeEventListener("message", listener.current);
  }, []);

  async function pay() {
    setResult(null);
    setBusy(true);
    let start: { checkoutToken?: string; error?: string };
    try {
      if (props.mode === "staff") {
        const form = btn.current?.form;
        const amount = (form?.elements.namedItem("amount") as HTMLInputElement | null)?.value ?? "";
        const receipt = (["sms", "email"] as const).filter((c) => (form?.elements.namedItem(`receipt_${c}`) as HTMLInputElement | null)?.checked);
        start = await startCardPayment({ invoiceId: props.invoiceId, amount, receipt: [...receipt] });
      } else {
        start = await startOnlinePayment(props.token);
      }
      if (start.error || !start.checkoutToken) throw new Error(start.error || "Couldn't start the payment.");
      await loadHelcim();
    } catch (e) {
      setBusy(false);
      setResult({ error: (e as Error).message });
      return;
    }
    const token = start.checkoutToken;
    if (listener.current) window.removeEventListener("message", listener.current);
    const onMessage = async (event: MessageEvent) => {
      const d = event.data as { eventName?: string; eventStatus?: string; eventMessage?: unknown } | undefined;
      if (!d || d.eventName !== `helcim-pay-js-${token}`) return;
      if (d.eventStatus === "SUCCESS") {
        window.removeEventListener("message", onMessage);
        removeFrame();
        setResult({ ok: "Card approved. Saving…" });
        const r = await finishCardPayment(token, typeof d.eventMessage === "string" ? d.eventMessage : JSON.stringify(d.eventMessage));
        setResult(r);
        setBusy(false);
        // Customers: show the "Paid" page straight away. Staff: keep the confirmation on screen until they tap Done
        // (refreshing now would hide this box once the invoice is fully paid).
        if (props.mode === "customer" || r.error) router.refresh();
      } else if (d.eventStatus === "ABORTED") {
        const why = String(d.eventMessage ?? "").replace(/^HelcimPay\.js transaction failed\s*-?\s*/i, "");
        setResult({ error: `Card declined${why ? `: ${why}` : ""}. Try another card.` });
      } else if (d.eventStatus === "HIDE") {
        window.removeEventListener("message", onMessage);
        removeFrame();
        setBusy(false);
      }
    };
    listener.current = onMessage;
    window.addEventListener("message", onMessage);
    window.appendHelcimPayIframe!(token, true);
  }

  return (
    <div className="space-y-2">
      <button ref={btn} type="button" onClick={pay} disabled={busy} className={props.mode === "customer" ? "btn-primary w-full justify-center py-3 text-base" : "btn-dark w-full justify-center"}>
        {busy ? "Waiting for card…" : props.label ?? "Charge card now"}
      </button>
      {result?.error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {result.error}
        </div>
      )}
      {result?.ok && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {result.ok}
          <div className="mt-2 flex flex-wrap gap-2">
            {result.links?.map((l) => (
              <a key={l.href} href={l.href} className="btn-dark btn-sm">
                {l.label}
              </a>
            ))}
            {props.mode === "staff" && !busy && (
              <button type="button" className="btn-ghost btn-sm" onClick={() => router.refresh()}>
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
