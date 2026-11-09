import { type NextRequest } from "next/server";
import { corsHeaders } from "@/lib/public-api";
import { getPublicReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req, "GET, OPTIONS") });
}

/** Your Google rating and recent reviews, for the website's reviews section. */
export async function GET(req: NextRequest) {
  const headers = { ...corsHeaders(req, "GET, OPTIONS"), "Cache-Control": "public, max-age=1800" };
  try {
    const data = await getPublicReviews();
    if (!data) return Response.json({ error: "Reviews aren't set up" }, { status: 404, headers });
    return Response.json(data, { headers });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502, headers });
  }
}
