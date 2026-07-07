/**
 * nav/types.ts
 *
 * Core type definitions for the filesystem-driven navigation platform.
 * All other nav modules import from here.
 */

import type { IconSvgElement } from "@hugeicons/react"
import { AccessConfig } from "./access/roles"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DASHBOARD_BASE = "/dashboard" as const

// ---------------------------------------------------------------------------
// Route node — raw structure derived from the filesystem
// ---------------------------------------------------------------------------

export interface RouteNode {
  /** Stable unique ID, e.g. 'complaints-new' or 'complaints-[id]-edit'. */
  id: string
  /** URL segment (exact folder name), e.g. 'complaints' or '[id]'. */
  segment: string
  /** Absolute path template, e.g. '/dashboard/complaints'. */
  path: string
  /** True when segment is a Next.js dynamic param: [param]. */
  isDynamic: boolean
  /** True when segment is a catch-all: [...slug]. */
  isCatchAll: boolean
  /** Param name extracted from dynamic segments, e.g. 'id' from [id]. */
  paramName?: string
  /** Immediate child route nodes. */
  children: RouteNode[]
}

// ---------------------------------------------------------------------------
// Route metadata — human-authored configuration
// ---------------------------------------------------------------------------

export interface RouteMetadata {
  /** Human-readable display label (Title Case). */
  label?: string
  /** HugeIcons icon array — only needed for sidebar items. */
  icon?: IconSvgElement
  /** Override breadcrumb label when it differs from label. */
  breadcrumb?: string
  /** Short description for tooltips / aria. */
  description?: string
  /** Sidebar render order (lower = higher). Defaults to 999. */
  order?: number
  /** Excluded from sidebar but still generates breadcrumbs. */
  sidebarHidden?: boolean
  /** Excluded from the breadcrumb trail entirely. */
  breadcrumbHidden?: boolean
  /** Renders in breadcrumbs as non-clickable (section headers). */
  nonInteractive?: boolean
  /** Hide completely (vs. show locked) when user lacks access. */
  hideWhenLocked?: boolean
  /** Access control config for this route. */
  access?: AccessConfig
}

/** Flat map from route ID to its metadata. */
export type MetadataRegistry = Record<string, RouteMetadata>

// ---------------------------------------------------------------------------
// Composed nav item — RouteNode merged with RouteMetadata
// ---------------------------------------------------------------------------

export interface ComposedNavItem {
  // ── Route identity ─────────────────────────────────────────────────────────
  id: string
  segment: string
  path: string
  isDynamic: boolean
  isCatchAll: boolean
  paramName?: string

  // ── Metadata fields ────────────────────────────────────────────────────────
  label: string
  icon?: IconSvgElement
  breadcrumb?: string
  description?: string
  sidebarHidden: boolean
  breadcrumbHidden: boolean
  nonInteractive: boolean
  hideWhenLocked: boolean
  access: AccessConfig

  /** Composed children (ordered by metadata.order). */
  children: ComposedNavItem[]
}

/** NavItem is a type alias for ComposedNavItem. */
export type NavItem = ComposedNavItem
