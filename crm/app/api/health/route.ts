import { get } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Used by the host to check the app and its database are up. */
export function GET() {
  get("SELECT 1 AS ok");
  return Response.json({ ok: true });
}
