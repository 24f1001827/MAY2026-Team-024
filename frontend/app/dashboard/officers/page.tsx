import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import { OfficerStatsCard } from "@/features/officer/components/officer-stats-card"
import {
  OfficersTable,
  type OfficerRow,
} from "@/features/officer/components/officers-table"
import {
  mockDepartments,
  mockOfficers,
  mockUsers,
} from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function OfficersPage() {
  await requireRoles(["Admin"])

  const userById = new Map(mockUsers.map((u) => [u.id, u]))
  const deptById = new Map(mockDepartments.map((d) => [d.id, d.name]))

  const officers: OfficerRow[] = mockOfficers.map((o) => {
    const u = userById.get(o.userId)
    return {
      userId: o.userId,
      name: u?.name ?? "Unknown officer",
      email: u?.email ?? "",
      departmentId: o.departmentId,
      departmentName: deptById.get(o.departmentId) ?? "Unassigned",
      availabilityStatus: o.availabilityStatus,
      currentWorkload: o.currentWorkload,
      maxWorkload: o.maxWorkload,
    }
  })

  const available = officers.filter(
    (o) => o.availabilityStatus === "Available"
  ).length
  const engaged = officers.filter(
    (o) => o.availabilityStatus === "Engaged"
  ).length
  const onLeave = officers.filter(
    (o) => o.availabilityStatus === "OnLeave"
  ).length

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Officers"
        description="Officers and their department assignments."
        actions={
          <Button asChild variant="brand">
            <Link href={routes.officers.create}>
              <HugeiconsIcon icon={PlusSignIcon} />
              New officer
            </Link>
          </Button>
        }
      />

      <OfficerStatsCard
        total={officers.length}
        available={available}
        engaged={engaged}
        onLeave={onLeave}
      />

      <OfficersTable
        officers={officers}
        departments={mockDepartments.map((d) => ({ id: d.id, name: d.name }))}
        canManage
      />
    </div>
  )
}
