import { notFound, redirect } from "next/navigation"

import {
  DepartmentDashboard,
  type DepartmentOfficer,
} from "@/features/department/components/department-dashboard"
import {
  mockAppSettings,
  mockComplaints,
  mockDepartments,
  mockOfficers,
  mockUsers,
} from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function DepartmentDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Admins reach any department; officers only their own (checked below).
  const user = await requireRoles(["Admin", "Officer"])

  const deptId = Number(id)
  const department = mockDepartments.find((d) => d.id === deptId)
  if (!department) notFound()

  const isAdmin = user.role === "Admin"
  const isHead = department.headOfficerId === user.id
  const isDeptOfficer = mockOfficers.some(
    (o) => o.userId === user.id && o.departmentId === deptId
  )
  // A non-admin may only view a department they belong to. Anyone else is
  // bounced to their own landing.
  if (!isAdmin && !isDeptOfficer) redirect(routes.department)

  const userName = new Map(mockUsers.map((u) => [u.id, u.name]))
  const officers: DepartmentOfficer[] = mockOfficers
    .filter((o) => o.departmentId === deptId)
    .map((o) => ({
      userId: o.userId,
      name: userName.get(o.userId) ?? "Unknown officer",
      availabilityStatus: o.availabilityStatus,
      currentWorkload: o.currentWorkload,
      maxWorkload: o.maxWorkload,
      isHead: department.headOfficerId === o.userId,
    }))

  // Only the unassigned queue and the viewer's own complaints leave the server;
  // colleagues' assigned cases are never sent to the client.
  const deptComplaints = mockComplaints.filter((c) => c.departmentId === deptId)
  const queue = deptComplaints.filter((c) => c.assignedOfficerId === null)
  const myComplaints = deptComplaints.filter(
    (c) => c.assignedOfficerId === user.id
  )

  return (
    <DepartmentDashboard
      department={department}
      officers={officers}
      queue={queue}
      myComplaints={myComplaints}
      totalComplaints={deptComplaints.length}
      manualAllotment={mockAppSettings.manualAllotment}
      canManage={isAdmin}
      canAllot={isAdmin || isHead}
      showMyComplaints={user.role === "Officer"}
    />
  )
}
