import "server-only";
import { getSettings } from "./db";

/**
 * Google address search through Places API (New), called from the server so the key never reaches the browser.
 * Results are biased to the Ottawa area and limited to Canada.
 */

export function placesKey(): string {
  return process.env.GOOGLE_MAPS_API_KEY || getSettings().google_maps_api_key || "";
}

const OTTAWA = { latitude: 45.4215, longitude: -75.6972 };

async function google<T>(url: string, init: RequestInit & { fieldMask?: string }): Promise<T> {
  const key = placesKey();
  if (!key) throw new Error("Google address search isn't set up");
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      ...(init.fieldMask ? { "X-Goog-FieldMask": init.fieldMask } : {}),
    },
    cache: "no-store",
  }).catch((e: Error) => {
    throw new Error(`Couldn't reach Google (${e.message})`);
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Google: ${json.error?.message ?? res.statusText}`);
  return json;
}

export type Suggestion = { placeId: string; main: string; secondary: string };

export async function autocomplete(input: string, sessionToken: string): Promise<Suggestion[]> {
  type Resp = {
    suggestions?: { placePrediction?: { placeId: string; text?: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }[];
  };
  const r = await google<Resp>("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    body: JSON.stringify({
      input,
      sessionToken,
      includedRegionCodes: ["ca"],
      languageCode: "en",
      locationBias: { circle: { center: OTTAWA, radius: 50000 } },
    }),
  });
  return (r.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
    .map((p) => ({
      placeId: p.placeId,
      main: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondary: p.structuredFormat?.secondaryText?.text ?? "",
    }));
}

export type AddressParts = { street: string; unit: string; city: string; province: string; postal_code: string };

type Component = { longText: string; shortText: string; types: string[] };

export function partsFromComponents(components: Component[]): AddressParts {
  const find = (...types: string[]) => components.find((c) => types.some((t) => c.types.includes(t)));
  const number = find("street_number")?.longText ?? "";
  const route = find("route")?.shortText ?? find("route")?.longText ?? "";
  return {
    street: [number, route].filter(Boolean).join(" "),
    unit: find("subpremise")?.longText ?? "",
    city: (find("locality") ?? find("postal_town") ?? find("sublocality_level_1", "sublocality") ?? find("administrative_area_level_3"))?.longText ?? "",
    province: find("administrative_area_level_1")?.shortText ?? "",
    postal_code: (find("postal_code")?.longText ?? "").toUpperCase(),
  };
}

export async function details(placeId: string, sessionToken: string): Promise<AddressParts> {
  const r = await google<{ addressComponents?: Component[] }>(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=en`,
    { method: "GET", fieldMask: "addressComponents" },
  );
  return partsFromComponents(r.addressComponents ?? []);
}
