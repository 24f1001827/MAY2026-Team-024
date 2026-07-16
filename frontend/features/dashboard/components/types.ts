import type { Complaint } from "@/types/complaint"

/** A complaint enriched with derived display fields for the map dashboard. */
export interface ComplaintMapItem extends Complaint {
  departmentName: string
}
