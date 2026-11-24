import type { NextRequest } from "next/server";
import { getSettings } from "@/lib/db";
import { appOrigin } from "@/lib/origin";
import { handleInboundSms, twiml, validTwilioSignature } from "@/lib/sms-inbound";

export const dynamic = "force-dynamic";

/** Twilio calls this for every text sent to your Twilio number. */
export async function POST(req: NextRequest) {
  const params: Record<string, string> = {};
  try {
    (await req.formData()).forEach((v, k) => (params[k] = String(v)));
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const s = getSettings();
  const url = `${await appOrigin()}/api/twilio/inbound${req.nextUrl.search}`;
  if (!validTwilioSignature(url, params, req.headers.get("x-twilio-signature") ?? "", s.twilio_token)) {
    return new Response("Invalid signature", { status: 403 });
  }
  let out: string;
  try {
    out = handleInboundSms(params);
  } catch (e) {
    console.error("inbound sms:", e);
    out = twiml([]);
  }
  return new Response(out, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}
