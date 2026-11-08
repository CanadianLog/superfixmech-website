import { get } from "@/lib/db";
import { ensureWorker } from "@/lib/messaging";

export const dynamic = "force-dynamic";

/** Used by the host to check the app and its database are up. */
export function GET() {
  get("SELECT 1 AS ok");
  ensureWorker();
  return Response.json({ ok: true });
}
