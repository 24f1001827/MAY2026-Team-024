import { NextResponse } from "next/server"

import { getPublicComplaints } from "@/lib/utils/complaint/public-complaints"

/**
 * Public, unauthenticated endpoint listing every complaint with the reporter's
 * identity stripped. Powers the public map at `/complaints` and is safe for any
 * external consumer.
 */
export function GET() {
  return NextResponse.json({ complaints: getPublicComplaints() })
}
