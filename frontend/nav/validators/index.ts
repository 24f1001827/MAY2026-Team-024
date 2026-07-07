/**
 * nav/validators/index.ts
 *
 * Runtime validation utilities for the navigation system.
 * Call runValidation() during startup in development to catch issues early.
 */

import type { ComposedNavItem, RouteNode } from "../types"

// ---------------------------------------------------------------------------
// Validation result types
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  severity: "error" | "warning"
  code: string
  message: string
  context?: Record<string, unknown>
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function error(
  code: string,
  message: string,
  context?: Record<string, unknown>
): ValidationIssue {
  return { severity: "error", code, message, context }
}

function warn(
  code: string,
  message: string,
  context?: Record<string, unknown>
): ValidationIssue {
  return { severity: "warning", code, message, context }
}

function flattenComposed(items: ComposedNavItem[]): ComposedNavItem[] {
  const result: ComposedNavItem[] = []
  for (const item of items) {
    result.push(item)
    if (item.children.length > 0) result.push(...flattenComposed(item.children))
  }
  return result
}

function flattenRouteNodes(nodes: RouteNode[]): RouteNode[] {
  const result: RouteNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children.length > 0)
      result.push(...flattenRouteNodes(node.children))
  }
  return result
}

// ---------------------------------------------------------------------------
// Route tree validators
// ---------------------------------------------------------------------------

export function validateRouteTree(nodes: RouteNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const allNodes = flattenRouteNodes(nodes)

  const idCounts = new Map<string, number>()
  for (const node of allNodes) {
    idCounts.set(node.id, (idCounts.get(node.id) ?? 0) + 1)
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push(
        error("DUPLICATE_ROUTE_ID", `Route ID '${id}' appears ${count} times.`, {
          id,
          count,
        })
      )
    }
  }

  const pathCounts = new Map<string, number>()
  for (const node of allNodes) {
    pathCounts.set(node.path, (pathCounts.get(node.path) ?? 0) + 1)
  }
  for (const [path, count] of pathCounts) {
    if (count > 1) {
      issues.push(
        error(
          "DUPLICATE_ROUTE_PATH",
          `Route path '${path}' appears ${count} times.`,
          { path, count }
        )
      )
    }
  }

  for (const node of allNodes) {
    if (node.isDynamic && !node.paramName) {
      issues.push(
        warn("MISSING_PARAM_NAME", `Dynamic route '${node.id}' has no paramName.`, {
          id: node.id,
        })
      )
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Composed navigation validators
// ---------------------------------------------------------------------------

export function validateNavigation(items: ComposedNavItem[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const flat = flattenComposed(items)

  const idCounts = new Map<string, number>()
  for (const item of flat) {
    idCounts.set(item.id, (idCounts.get(item.id) ?? 0) + 1)
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push(
        error("DUPLICATE_NAV_ID", `Nav item ID '${id}' is duplicated.`, {
          id,
          count,
        })
      )
    }
  }

  for (const item of flat) {
    if (!item.sidebarHidden && !item.isDynamic && !item.icon) {
      issues.push(
        warn("MISSING_ICON", `Sidebar item '${item.id}' has no icon.`, {
          id: item.id,
          label: item.label,
        })
      )
    }
  }

  for (const item of flat) {
    if (item.nonInteractive && item.children.length === 0 && !item.sidebarHidden) {
      issues.push(
        warn(
          "NON_INTERACTIVE_LEAF",
          `Item '${item.id}' is nonInteractive but has no children — it will render as an unclickable leaf.`,
          { id: item.id }
        )
      )
    }
  }

  for (const item of flat) {
    if (!item.breadcrumbHidden && item.children.length > 0) {
      const allChildrenHidden = item.children.every((c) => c.breadcrumbHidden)
      if (allChildrenHidden && !item.sidebarHidden) {
        issues.push(
          warn(
            "ALL_CHILDREN_BREADCRUMB_HIDDEN",
            `Item '${item.id}' has all children breadcrumb-hidden.`,
            { id: item.id }
          )
        )
      }
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Combined runner
// ---------------------------------------------------------------------------

/**
 * Run all validators and return a consolidated result.
 * In development, call this once on startup and log any issues.
 */
export function runValidation(
  routeNodes: RouteNode[],
  composedNav: ComposedNavItem[]
): ValidationResult {
  const issues: ValidationIssue[] = [
    ...validateRouteTree(routeNodes),
    ...validateNavigation(composedNav),
  ]

  return {
    valid: issues.every((i) => i.severity !== "error"),
    issues,
  }
}

/**
 * Log validation results to the console in a developer-friendly format.
 */
export function logValidationResult(result: ValidationResult): void {
  if (result.valid && result.issues.length === 0) {
    console.log("[nav] ✓ Navigation validation passed.")
    return
  }

  if (result.valid) {
    console.warn("[nav] ⚠ Navigation validation passed with warnings:")
  } else {
    console.error("[nav] ✗ Navigation validation FAILED:")
  }

  for (const issue of result.issues) {
    const fn = issue.severity === "error" ? console.error : console.warn
    fn(`  [${issue.code}] ${issue.message}`, issue.context ?? "")
  }
}
