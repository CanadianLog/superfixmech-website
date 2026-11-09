import "server-only";
import { getSettings, run } from "./db";
import { placesKey } from "./places";

/**
 * Google rating and reviews for the website, from Places API (New).
 * Cached for 12 hours so Google is asked at most twice a day.
 */

export type PublicReviews = {
  name: string;
  rating: number | null;
  count: number;
  url: string;
  reviews: { author: string; authorUrl: string; photo: string; rating: number; text: string; when: string }[];
  fetchedAt: string;
};

const TTL_MS = 12 * 3600_000;

function setSetting(key: string, value: string) {
  run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value);
}

async function call<T>(url: string, init: RequestInit, fieldMask: string): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": placesKey(), "X-Goog-FieldMask": fieldMask },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Google: ${json.error?.message ?? res.statusText}`);
  return json;
}

/** Finds the business's Google Place ID from its name and address (saved after the first lookup). */
export async function findPlaceId(query?: string): Promise<{ id: string; name: string; address: string } | null> {
  const s = getSettings();
  const q = query || `${s.company_name} ${s.company_address}`;
  const r = await call<{ places?: { id: string; displayName?: { text: string }; formattedAddress?: string }[] }>(
    "https://places.googleapis.com/v1/places:searchText",
    { method: "POST", body: JSON.stringify({ textQuery: q, regionCode: "ca", languageCode: "en" }) },
    "places.id,places.displayName,places.formattedAddress",
  );
  const p = r.places?.[0];
  return p ? { id: p.id, name: p.displayName?.text ?? "", address: p.formattedAddress ?? "" } : null;
}

export async function getPublicReviews(force = false): Promise<PublicReviews | null> {
  const s = getSettings();
  if (!force && s.reviews_cache) {
    try {
      const cached = JSON.parse(s.reviews_cache) as PublicReviews;
      if (Date.now() - new Date(cached.fetchedAt).getTime() < TTL_MS) return cached;
    } catch {
      /* refetch */
    }
  }
  if (!placesKey()) return null;
  let placeId = s.google_place_id;
  if (!placeId) {
    const found = await findPlaceId();
    if (!found) return null;
    placeId = found.id;
    setSetting("google_place_id", placeId);
  }
  type G = {
    displayName?: { text: string };
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    reviews?: {
      rating?: number;
      text?: { text: string };
      originalText?: { text: string };
      relativePublishTimeDescription?: string;
      authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
    }[];
  };
  const g = await call<G>(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`,
    { method: "GET" },
    "displayName,rating,userRatingCount,googleMapsUri,reviews",
  );
  const out: PublicReviews = {
    name: g.displayName?.text ?? s.company_name,
    rating: g.rating ?? null,
    count: g.userRatingCount ?? 0,
    url: g.googleMapsUri ?? "",
    reviews: (g.reviews ?? [])
      .filter((r) => (r.text?.text || r.originalText?.text) && (r.rating ?? 0) >= 4)
      .map((r) => ({
        author: r.authorAttribution?.displayName ?? "Google user",
        authorUrl: r.authorAttribution?.uri ?? "",
        photo: r.authorAttribution?.photoUri ?? "",
        rating: r.rating ?? 5,
        text: r.text?.text ?? r.originalText?.text ?? "",
        when: r.relativePublishTimeDescription ?? "",
      })),
    fetchedAt: new Date().toISOString(),
  };
  setSetting("reviews_cache", JSON.stringify(out));
  return out;
}
