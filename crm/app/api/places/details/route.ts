import { type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { details } from "@/lib/places";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await currentUser())) return Response.json({ error: "Sign in" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const session = (req.nextUrl.searchParams.get("session") ?? "").slice(0, 64);
  if (!/^[\w-]{10,300}$/.test(id)) return Response.json({ error: "Bad place id" }, { status: 400 });
  try {
    return Response.json({ address: await details(id, session) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
