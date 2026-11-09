import { NextResponse } from "next/server";
import { currentUser, randomToken } from "@/lib/auth";
import { run } from "@/lib/db";
import { appOrigin } from "@/lib/origin";
import { authorizeUrl, qboConfig } from "@/lib/quickbooks";

export const dynamic = "force-dynamic";

/** Starts the QuickBooks OAuth flow (admin only). */
export async function GET() {
  const origin = await appOrigin();
  const user = await currentUser();
  if (!user || user.role !== "admin") return NextResponse.redirect(`${origin}/login`);
  if (!qboConfig().clientId) return NextResponse.redirect(`${origin}/settings?qbo=missing_keys#quickbooks`);
  const state = randomToken(16);
  run("UPDATE settings SET value = ? WHERE key = 'qbo_oauth_state'", state);
  return NextResponse.redirect(authorizeUrl(state, `${origin}/api/qbo/callback`));
}
