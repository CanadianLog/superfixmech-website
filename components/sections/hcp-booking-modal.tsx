"use client";

import { useEffect, useState } from "react";
import { HCP_LEAD_FORM_URL } from "@/components/sections/hcp-lead-form";
import { company } from "@/lib/site-data";

// Links to these pages open the Housecall Pro form in a popup instead of navigating.
// The pages themselves still carry the form, so the links work without JavaScript
// and when opened in a new tab.
const POPUP_PATHS = new Set(["/online-booking", "/contact"]);

export function HcpBookingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      const url = new URL(link.getAttribute("href")!, window.location.href);
      if (url.origin !== window.location.origin || !POPUP_PATHS.has(url.pathname)) return;
      event.preventDefault();
      setOpen(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 md:p-6"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Request an appointment"
        className="relative flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#eedca7] bg-[#fff9e8] px-5 py-3">
          <p className="text-sm text-[#5f4714]">
            Prefer to call?{" "}
            <a href="tel:+16133667009" className="font-semibold underline">
              {company.phone}
            </a>
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-[#5f4714] transition hover:bg-[#f4e3b0]"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto">
          <iframe
            title="Request an appointment with SuperFix Mechanical"
            src={HCP_LEAD_FORM_URL}
            className="block w-full border-0"
            style={{ height: 820 }}
          />
        </div>
      </div>
    </div>
  );
}
