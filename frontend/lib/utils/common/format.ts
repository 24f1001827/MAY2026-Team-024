/**
 * lib/utils/common/format.ts
 *
 * Small shared formatting helpers.
 */

/** Format an amount as Indian Rupees with no decimals (e.g. ₹2,50,00,000). */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format an ISO date as e.g. "20 Jul 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
