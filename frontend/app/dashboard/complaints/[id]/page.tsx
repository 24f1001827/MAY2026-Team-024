import { notFound, redirect } from "next/navigation"

import { ComplaintDetail } from "@/features/complaint/components/complaint-detail"
import {
  mockComplaintRemarks,
  mockComplaints,
  mockDepartments,
  mockUsers,
} from "@/components/shared/mock-data"
import { getCurrentUser } from "@/lib/auth/current-user"
import { publicRoutes } from "@/nav"

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) redirect(publicRoutes.login)

  const complaint = mockComplaints.find((c) => c.id === id)
  if (!complaint) notFound()

  const citizen = mockUsers.find((u) => u.id === complaint.citizenId)
  const department = mockDepartments.find((d) => d.id === complaint.departmentId)
  const remarks = mockComplaintRemarks.filter((r) => r.complaintId === id)

  return (
    <ComplaintDetail
      complaint={complaint}
      citizenName={citizen?.name ?? "Unknown citizen"}
      departmentName={department?.name ?? "Unassigned"}
      currentRole={user.role}
      currentUserId={user.id}
      currentUserName={user.name}
      initialRemarks={remarks}
    />
  )
}
