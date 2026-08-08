import { AgencyWorkOrders } from "@/features/agency/components/agency-work-orders"
import { requireRoles } from "@/lib/auth/current-user"

export default async function WorkOrdersPage() {
  await requireRoles(["Agency"])
  return <AgencyWorkOrders />
}
