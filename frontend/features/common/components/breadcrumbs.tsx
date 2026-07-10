"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/shadcn/breadcrumb"
import {
  getBreadcrumbLabel,
  isHiddenSegment,
  isIdSegment,
  isNonInteractiveSegment,
  routes,
} from "@/nav"

type Crumb = {
  href: string
  label: string
  isNonInteractive: boolean
}

/** Friendly label for a dynamic id segment, based on its parent module. */
const ID_LABELS: Record<string, string> = {
  complaints: "Complaint",
  tenders: "Tender",
  departments: "Department",
  officers: "Officer",
  agencies: "Agency",
}

function idLabel(parentSegment: string | undefined): string {
  return (parentSegment && ID_LABELS[parentSegment]) || "Details"
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Always anchored at the dashboard home.
  const home: Crumb = {
    href: routes.href,
    label: "Dashboard",
    isNonInteractive: false,
  }

  const segments = pathname.split("/").filter(Boolean)

  const crumbs: Crumb[] = []
  segments.forEach((segment, index) => {
    if (isHiddenSegment(segment)) return
    const href = "/" + segments.slice(0, index + 1).join("/")
    const label = isIdSegment(segment)
      ? idLabel(segments[index - 1])
      : getBreadcrumbLabel(segment)
    crumbs.push({
      href,
      label,
      isNonInteractive: isNonInteractiveSegment(segment),
    })
  })

  const trail = [home, ...crumbs]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1
          return (
            <Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || crumb.isNonInteractive ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
