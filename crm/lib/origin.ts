import "server-only";
import { headers } from "next/headers";

/** Public base URL for links sent to customers. Set CRM_PUBLIC_URL in production. */
export async function appOrigin(): Promise<string> {
  if (process.env.CRM_PUBLIC_URL) return process.env.CRM_PUBLIC_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3100";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
