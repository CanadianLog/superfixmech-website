"use client";

import { useEffect, useState } from "react";

export const HCP_TOKEN = "782f6b3219464d26a0b49b809ad17b06";
export const HCP_ORG = "Super-Fix-Mechanical";
export const HCP_LEAD_FORM_URL = `https://book.housecallpro.com/lead-form/${HCP_ORG}/${HCP_TOKEN}`;

// Hide the spinner on load, or after this long in case the load event fired before hydration.
const LOADING_FALLBACK_MS = 6000;

/** The Housecall Pro lead form iframe with a loading indicator until it appears. */
export function HcpFormFrame({ id, className }: { id?: string; className?: string }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), LOADING_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {loading ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-x-0 top-16 flex flex-col items-center gap-3 text-sm font-semibold text-[#7e6b45]"
        >
          <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#f4e3b0] border-t-[#d6a52d]" />
          Loading booking form…
        </div>
      ) : null}
      <iframe
        id={id}
        title="Request an appointment with SuperFix Mechanical"
        src={HCP_LEAD_FORM_URL}
        onLoad={() => setLoading(false)}
        className={`relative block w-full border-0 ${className ?? ""}`}
        style={{ height: 820 }}
      />
    </div>
  );
}
