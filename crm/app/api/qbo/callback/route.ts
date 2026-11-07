import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSettings, run } from "@/lib/db";
import { appOrigin } from "@/lib/origin";
import { exchangeCode } from "@/lib/quickbooks";

export const dynamic = "force-dynamic";

/** Intuit redirects here after the owner approves the connection. */
export async function GET(req: NextRequest) {
  const origin = await appOrigin();
  const user = await currentUser();
  if (!user || user.role !== "admin") return NextResponse.redirect(`${origin}/login`);
  const p = req.nextUrl.searchParams;
  const back = (msg: string) => NextResponse.redirect(`${origin}/settings?qbo=${encodeURIComponent(msg)}#quickbooks`);

  if (p.get("error")) return back(p.get("error") === "access_denied" ? "denied" : p.get("error")!);
  const expected = getSettings().qbo_oauth_state;
  run("UPDATE settings SET value = '' WHERE key = 'qbo_oauth_state'");
  if (!expected || p.get("state") !== expected) return back("bad_state");
  const code = p.get("code");
  const realmId = p.get("realmId");
  if (!code || !realmId) return back("missing_code");
  try {
    await exchangeCode(code, `${origin}/api/qbo/callback`, realmId);
  } catch (e) {
    return back((e as Error).message);
  }
  return back("connected");
}
