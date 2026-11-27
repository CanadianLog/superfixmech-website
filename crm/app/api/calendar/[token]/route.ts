import { feedFor } from "@/lib/calendar";
import { appOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

/** Private calendar feed of a user's jobs (subscribe to it from the iPhone Calendar app). */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.replace(/\.ics$/i, "");
  const ics = token.length >= 20 ? feedFor(token, await appOrigin()) : null;
  if (!ics) return new Response("Not found", { status: 404 });
  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": 'inline; filename="jobs.ics"' },
  });
}
