"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Compact page navigator: first / prev / numbered pages (with ellipses) /
 * next / last. Purely presentational — the parent owns the current page.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="size-8 p-0"
        aria-label="First page"
      >
        <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={14} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="size-8 p-0"
        aria-label="Previous page"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
      </Button>

      {pageNumbers.map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "brand" : "outline"}
            size="sm"
            onClick={() => onPageChange(page as number)}
            className="h-8 min-w-8 px-3"
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="size-8 p-0"
        aria-label="Next page"
      >
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="size-8 p-0"
        aria-label="Last page"
      >
        <HugeiconsIcon icon={ArrowRightDoubleIcon} size={14} />
      </Button>
    </div>
  )
}

/** Page list with leading/trailing anchors and ellipses for long ranges. */
function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  const pages: (number | string)[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (currentPage > 3) pages.push("...")

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (currentPage < totalPages - 2) pages.push("...")
  pages.push(totalPages)

  return pages
}
