import "server-only";
import { getSettings } from "./db";

/** Origins (e.g. https://superfixmech.ca) allowed to call the public booking/reviews endpoints from a browser. */
export function allowedOrigins(): string[] {
  const raw = [process.env.CRM_BOOKING_ORIGIN ?? "", getSettings().website_origins ?? ""].join(",");
  return raw
    .split(/[\s,]+/)
    .map((o) => o.trim().replace(/\/$/, "").toLowerCase())
    .filter((o) => /^https?:\/\//.test(o));
}

export function requestOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) return origin.toLowerCase();
  const ref = req.headers.get("referer");
  try {
    return ref ? new URL(ref).origin.toLowerCase() : "";
  } catch {
    return "";
  }
}

export function isAllowedOrigin(req: Request): boolean {
  const o = requestOrigin(req);
  return !!o && allowedOrigins().includes(o);
}

/** CORS headers echoing the caller's origin only when it is one of ours. */
export function corsHeaders(req: Request, methods = "GET, POST, OPTIONS"): Record<string, string> {
  const o = req.headers.get("origin")?.toLowerCase() ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins().includes(o) ? o : "null",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
