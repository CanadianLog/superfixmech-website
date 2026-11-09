import { type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { autocomplete } from "@/lib/places";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await currentUser())) return Response.json({ error: "Sign in" }, { status: 401 });
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  const session = (req.nextUrl.searchParams.get("session") ?? "").slice(0, 64);
  if (q.length < 3) return Response.json({ suggestions: [] });
  try {
    return Response.json({ suggestions: await autocomplete(q, session) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
