import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/agency/tenders/[id]/proposal  (multipart/form-data)
 *
 * Agency submits a bid (amount + optional remarks + required `proposal_document`
 * file), proxied to Flask `POST /agency/tenders/{id}/proposal`. The multipart
 * body is re-parsed and forwarded so file parts survive with a matching boundary
 * (see the note in `app/api/complaints/route.ts`).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { message: "Expected multipart form data." },
      { status: 400 },
    )
  }

  const { status, body } = await backendFetch(
    `/agency/tenders/${id}/proposal`,
    { method: "POST", formData },
  )
  return NextResponse.json(body, { status })
}
