import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  AgenciesGridTable,
  type AgencyCard,
} from "@/features/agency/components/agencies-grid-table"
import { mockAgencies, mockUsers } from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function AgenciesPage() {
  await requireRoles(["Admin", "Officer"])

  const userById = new Map(mockUsers.map((u) => [u.id, u]))

  const agencies: AgencyCard[] = mockAgencies.map((a) => {
    const u = userById.get(a.id)
    return {
      id: a.id,
      name: u?.name ?? "Unknown agency",
      email: u?.email ?? "",
      contactPerson: a.contactPerson,
      registrationNumber: a.registrationNumber,
      currentProjects: a.currentProjects,
      maxProjects: a.maxProjects,
      status: u?.status ?? "PendingApproval",
    }
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Agencies"
        description="Registered agencies that execute awarded work orders."
        actions={
          <Button asChild variant="brand">
            <Link href={routes.agencies.create}>
              <HugeiconsIcon icon={PlusSignIcon} />
              New agency
            </Link>
          </Button>
        }
      />
      <AgenciesGridTable agencies={agencies} canManage />
    </div>
  )
}
