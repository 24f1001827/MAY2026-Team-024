import { NextResponse } from "next/server"

import { fetchPublicComplaints } from "@/lib/api/public-complaints"

/**
 * GET /api/complaints/public
 *
 * Public, unauthenticated list of complaints with reporter identity stripped
 * (served from the Flask public endpoint). Safe for any external consumer;
 * powers the public map at `/complaints`.
 */
export async function GET() {
  const complaints = await fetchPublicComplaints()
  return NextResponse.json({ complaints })
}
