"use client";

import { useEffect, useState } from "react";
import { company, crmUrl } from "@/lib/site-data";

type Review = { author: string; authorUrl: string; photo: string; rating: number; text: string; when: string };
type Data = { name: string; rating: number | null; count: number; url: string; reviews: Review[] };

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden className={i <= Math.round(value) ? "text-[#f4b400]" : "text-[#e5dcc4]"} fill="currentColor">
          <path d="M12 17.3l-6.2 3.7 1.6-7-5.4-4.7 7.1-.6L12 2l2.8 6.7 7.1.6-5.4 4.7 1.6 7z" />
        </svg>
      ))}
    </span>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function ReviewCard({ r }: { r: Review }) {
  const [open, setOpen] = useState(false);
  const long = r.text.length > 260;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#f1dfab] bg-white p-5 shadow-[0_10px_30px_-22px_rgba(74,52,12,0.5)]">
      <header className="flex items-center gap-3">
        {r.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.photo} alt="" width={40} height={40} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f4c542] font-bold text-[#2f2512]">{r.author.slice(0, 1)}</span>
        )}
        <div className="min-w-0">
          {r.authorUrl ? (
            <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="block truncate font-bold text-[#2f2512] hover:underline">
              {r.author}
            </a>
          ) : (
            <span className="block truncate font-bold text-[#2f2512]">{r.author}</span>
          )}
          <span className="text-xs text-[#9a8250]">{r.when}</span>
        </div>
        <span className="ml-auto shrink-0">
          <GoogleG />
        </span>
      </header>
      <div className="mt-3">
        <Stars value={r.rating} />
      </div>
      <p className={`mt-2 whitespace-pre-line text-sm leading-6 text-[#5f4714] ${open || !long ? "" : "line-clamp-6"}`}>{r.text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-2 self-start text-xs font-bold text-[#8d610e] hover:underline">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </article>
  );
}

/** Google rating and reviews, fetched from the SuperFix CRM (which caches them from Google). */
export function GoogleReviews() {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${crmUrl}/api/public/reviews`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Data) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const googleUrl = data?.url || company.googleMaps;

  if (failed || (data && data.reviews.length === 0 && !data.rating)) {
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-[#f1dfab] bg-white p-8 text-center md:mt-10">
        <div className="flex justify-center">
          <GoogleG />
        </div>
        <p className="mt-3 text-[#5f4714]">See what Ottawa homeowners say about us on Google.</p>
        <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full bg-[#f4c542] px-6 py-3 text-sm font-bold text-[#2f2512] transition hover:bg-[#e9b82f]">
          Read our Google reviews
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto mt-6 grid max-w-5xl gap-4 md:mt-10 md:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl border border-[#f1dfab] bg-white" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-5xl md:mt-10">
      {data.rating && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
          <GoogleG />
          <span className="text-3xl font-extrabold text-[#3b2b0f]">{data.rating.toFixed(1)}</span>
          <Stars value={data.rating} size={22} />
          <span className="text-sm text-[#7e6b45]">
            Based on {data.count} Google review{data.count === 1 ? "" : "s"}
          </span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.reviews.map((r, i) => (
          <ReviewCard key={i} r={r} />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-[#e0c06a] bg-white px-6 py-3 text-sm font-bold text-[#2f2512] transition hover:bg-[#fff2c9]">
          Read all reviews on Google
        </a>
      </div>
    </div>
  );
}
