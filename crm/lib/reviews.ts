import "server-only";
import { createHash } from "node:crypto";
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

export type PlaceCandidate = { id: string; name: string; address: string; mapsUri: string; rating: number | null; count: number; isYours: boolean };

/** Searches Google for businesses matching the name; the one matching your Google Maps listing id is flagged. */
export async function searchBusinesses(query: string): Promise<PlaceCandidate[]> {
  const cid = getSettings().google_cid;
  const r = await call<{
    places?: { id: string; displayName?: { text: string }; formattedAddress?: string; googleMapsUri?: string; rating?: number; userRatingCount?: number }[];
  }>(
    "https://places.googleapis.com/v1/places:searchText",
    { method: "POST", body: JSON.stringify({ textQuery: query, regionCode: "ca", languageCode: "en", pageSize: 6 }) },
    "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.rating,places.userRatingCount",
  );
  return (r.places ?? []).map((p) => ({
    id: p.id,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? "",
    mapsUri: p.googleMapsUri ?? "",
    rating: p.rating ?? null,
    count: p.userRatingCount ?? 0,
    isYours: !!cid && (p.googleMapsUri ?? "").includes(`cid=${cid}`),
  }));
}

export type StoredReview = PublicReviews["reviews"][number] & { id: string; source: "google" | "manual" };
type GoogleCache = Omit<PublicReviews, "reviews"> & { reviews: StoredReview[] };

const reviewId = (author: string, text: string) => createHash("sha1").update(`${author}\n${text}`).digest("hex").slice(0, 12);

function readJson<T>(raw: string | undefined, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function manualReviews(): StoredReview[] {
  return readJson<StoredReview[]>(getSettings().reviews_manual, []);
}

export function hiddenReviewIds(): string[] {
  return readJson<string[]>(getSettings().reviews_hidden, []);
}

/** Everything Google currently shares (up to 5 reviews, any rating), cached for 12 hours. */
export async function getGoogleReviews(force = false): Promise<GoogleCache | null> {
  const s = getSettings();
  // Only ever show reviews for a business the owner confirmed in Settings.
  if (s.google_place_confirmed !== "1" || !s.google_place_id) return null;
  if (!force && s.reviews_cache) {
    const cached = readJson<GoogleCache | null>(s.reviews_cache, null);
    if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < TTL_MS) {
      return { ...cached, reviews: cached.reviews.map((r) => ({ ...r, id: r.id ?? reviewId(r.author, r.text), source: "google" as const })) };
    }
  }
  if (!placesKey()) return null;
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
    `https://places.googleapis.com/v1/places/${encodeURIComponent(s.google_place_id)}?languageCode=en`,
    { method: "GET" },
    "displayName,rating,userRatingCount,googleMapsUri,reviews",
  );
  const out: GoogleCache = {
    name: g.displayName?.text ?? s.company_name,
    rating: g.rating ?? null,
    count: g.userRatingCount ?? 0,
    url: g.googleMapsUri ?? "",
    reviews: (g.reviews ?? [])
      .filter((r) => r.text?.text || r.originalText?.text)
      .map((r) => {
        const author = r.authorAttribution?.displayName ?? "Google user";
        const text = r.text?.text ?? r.originalText?.text ?? "";
        return {
          id: reviewId(author, text),
          source: "google" as const,
          author,
          authorUrl: r.authorAttribution?.uri ?? "",
          photo: r.authorAttribution?.photoUri ?? "",
          rating: r.rating ?? 5,
          text,
          when: r.relativePublishTimeDescription ?? "",
        };
      }),
    fetchedAt: new Date().toISOString(),
  };
  setSetting("reviews_cache", JSON.stringify(out));
  return out;
}

/** What the website shows: your added reviews first, then Google's, minus hidden and low-rated ones. */
export async function getPublicReviews(force = false): Promise<PublicReviews | null> {
  const s = getSettings();
  const google = await getGoogleReviews(force);
  const manual = manualReviews();
  if (!google && manual.length === 0) return null;
  const hidden = new Set(hiddenReviewIds());
  const min = Number(s.reviews_min_rating || "4") || 0;
  const strip = (r: StoredReview) => ({ author: r.author, authorUrl: r.authorUrl, photo: r.photo, rating: r.rating, text: r.text, when: r.when });
  return {
    name: google?.name ?? s.company_name,
    rating: google?.rating ?? null,
    count: google?.count ?? 0,
    url: google?.url ?? "",
    reviews: [...manual, ...(google?.reviews ?? []).filter((r) => r.rating >= min)].filter((r) => !hidden.has(r.id)).map(strip),
    fetchedAt: google?.fetchedAt ?? new Date().toISOString(),
  };
}
