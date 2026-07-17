import { redirect } from "next/navigation"

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

export default async function MyDepartmentPage() {
  const user = await requireRoles(["Officer"])

  // Resolve the officer's department. An account without an officer profile
  // has no department to land on — send them to the dashboard home.
  const officer = mockOfficers.find((o) => o.userId === user.id)
  if (!officer) redirect(routes.href)

  const department = mockDepartments.find((d) => d.id === officer.departmentId)
  if (!department) redirect(routes.href)

  const isHead = department.headOfficerId === user.id

  const userName = new Map(mockUsers.map((u) => [u.id, u.name]))
  const officers: DepartmentOfficer[] = mockOfficers
    .filter((o) => o.departmentId === department.id)
    .map((o) => ({
      userId: o.userId,
      name: userName.get(o.userId) ?? "Unknown officer",
      availabilityStatus: o.availabilityStatus,
      currentWorkload: o.currentWorkload,
      maxWorkload: o.maxWorkload,
      isHead: department.headOfficerId === o.userId,
    }))

  // Only the unassigned queue and the officer's own complaints leave the
  // server; colleagues' assigned cases are never sent to the client.
  const deptComplaints = mockComplaints.filter(
    (c) => c.departmentId === department.id
  )
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
      canManage={false}
      canAllot={isHead}
      showMyComplaints
    />
  )
}
