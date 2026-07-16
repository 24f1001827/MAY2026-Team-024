import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ComplaintDetail } from "@/features/complaint/components/complaint-detail"
import {
  ANONYMOUS_REPORTER,
  getPublicComplaint,
} from "@/lib/utils/complaint/public-complaints"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const data = getPublicComplaint(id)
  return {
    title: data ? data.complaint.title : "Complaint not found",
  }
}

export default async function PublicComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = getPublicComplaint(id)
  if (!data) notFound()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ComplaintDetail
        complaint={data.complaint}
        citizenName={ANONYMOUS_REPORTER}
        departmentName={data.departmentName}
        initialRemarks={data.remarks}
        readOnly
      />
    </div>
  )
}
