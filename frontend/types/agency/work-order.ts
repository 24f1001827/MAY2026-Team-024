/**
 * `work_orders` entity — the executable contract created when an officer awards
 * a proposal. Mirrors the `work_orders` table. The agency tracks and updates
 * its status through delivery.
 */

export type WorkOrderStatus =
  | "Assigned"
  | "InProgress"
  | "Incomplete"
  | "Completed"
  | "Verified"
  | "Closed"
  | "Cancelled"

export const WORK_ORDER_STATUSES: readonly WorkOrderStatus[] = [
  "Assigned",
  "InProgress",
  "Incomplete",
  "Completed",
  "Verified",
  "Closed",
  "Cancelled",
]

/** Row from `GET /agency/work-orders`. */
export interface WorkOrderListItem {
  id: number
  tenderId: number
  scopeOfWork: string
  status: WorkOrderStatus
  remarks: string | null
  createdAt: string
}

/** Detail from `GET /agency/work-orders/{id}` — adds schedule + proof. */
export interface WorkOrderDetail extends WorkOrderListItem {
  startDate: string | null
  endDate: string | null
  completionProofUrl: string | null
  updatedAt: string
}
