"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const STORAGE_KEY = "sfm-cookie-consent";
export const OPEN_COOKIE_SETTINGS_EVENT = "sfm:open-cookie-settings";

type Choice = "accepted" | "declined";
// "unset" = no choice saved yet; "pending" = server render, before storage can be read.
type Snapshot = Choice | "unset" | "pending";

// Holds the choice for this visit when storage is blocked.
let memoryChoice: Choice | null = null;
const listeners = new Set<() => void>();

function readChoice(): Snapshot {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "accepted" || value === "declined") return value;
  } catch {
    // Storage blocked: fall back to this visit's choice.
  }
  return memoryChoice ?? "unset";
}

function saveChoice(choice: Choice) {
  memoryChoice = choice;
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * Asks for consent before loading Google Analytics. Renders nothing unless
 * NEXT_PUBLIC_GA_ID is set at build time, since no other optional cookies are used.
 */
export function CookieConsent() {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "pending" as const);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!GA_ID) return null;

  const open = choice === "unset" || (reopened && choice !== "pending");

  function decide(next: Choice) {
    const withdrawing = next === "declined" && choice === "accepted";
    saveChoice(next);
    setReopened(false);
    // Analytics scripts can't be unloaded mid-visit; a reload applies a withdrawal.
    if (withdrawing) window.location.reload();
  }

  return (
    <>
      {choice === "accepted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
          </Script>
        </>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed inset-x-3 bottom-[88px] z-[90] mx-auto max-w-xl rounded-2xl border border-[#d9b557] bg-[#fffdf6] p-5 shadow-2xl md:bottom-6"
        >
          <p className="text-sm leading-6 text-[#5f4714]">
            We use cookies for anonymous analytics that help us improve this site. You can accept or
            decline; the site works the same either way. See our{" "}
            <Link href="/privacy-policy" className="font-semibold underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => decide("accepted")}
              className="rounded-full bg-[#f4c542] px-5 py-2.5 text-sm font-bold text-[#2f2512] hover:bg-[#e9b82f]"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => decide("declined")}
              className="rounded-full border border-[#9b7a2d] bg-white px-5 py-2.5 text-sm font-bold text-[#2f2512] hover:bg-[#fff6dd]"
            >
              Decline
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Footer link that reopens the cookie banner. Hidden when analytics isn't configured. */
export function CookieSettingsButton() {
  if (!GA_ID) return null;
  return (
    <li>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
        className="hover:underline"
      >
        Cookie Settings
      </button>
    </li>
  );
}
