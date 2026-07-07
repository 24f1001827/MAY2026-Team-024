#!/usr/bin/env bun
/**
 * scripts/generate-routes.ts
 *
 * Filesystem-driven route codegen.
 *
 * Usage:
 *   bun routes:generate   — generate once and exit
 *
 * Exports generateRoutes() for use by the watcher.
 * When executed directly this file also runs generateRoutes() once.
 */

import { createHash } from "node:crypto"
import * as fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  type ScannedRoute,
  dynamicKey,
  extractParamName,
  generatedHeader,
  isCatchAll,
  isDynamic,
  renderRouteNode,
  segmentsToId,
  toCamelCase,
} from "./route-utils"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT_DIR = path.resolve(process.cwd(), "app/dashboard")
const OUT_DIR = path.resolve(process.cwd(), "nav/generated")
const DASHBOARD_BASE = "/dashboard"

const IGNORED_FOLDERS = new Set([
  "api",
  "_components",
  "_hooks",
  "_utils",
  "_lib",
  "_actions",
])

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GenerateResult {
  routeCount: number
  filesChanged: number
  /** true when route tree hash matched — files were not re-read or written */
  skipped: boolean
}

// ---------------------------------------------------------------------------
// Filesystem scanner
// ---------------------------------------------------------------------------

function shouldIgnore(name: string): boolean {
  return IGNORED_FOLDERS.has(name) || name.startsWith("_")
}

function isRouteGroup(name: string): boolean {
  return name.startsWith("(") && name.endsWith(")")
}

function scanDirectory(dir: string, relativeSegments: string[]): ScannedRoute[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const routes: ScannedRoute[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const { name } = entry

    if (shouldIgnore(name)) continue

    if (isRouteGroup(name)) {
      routes.push(...scanDirectory(path.join(dir, name), relativeSegments))
      continue
    }

    const childSegments = [...relativeSegments, name]
    const children = scanDirectory(path.join(dir, name), childSegments)

    routes.push({
      id: segmentsToId(childSegments),
      segment: name,
      path: `${DASHBOARD_BASE}/${childSegments.join("/")}`,
      isDynamic: isDynamic(name),
      isCatchAll: isCatchAll(name),
      paramName: extractParamName(name),
      children: sortRoutes(children),
    })
  }

  return routes
}

function sortRoutes(routes: ScannedRoute[]): ScannedRoute[] {
  return [...routes].toSorted((a, b) => {
    if (a.isDynamic !== b.isDynamic) return a.isDynamic ? 1 : -1
    return a.segment.localeCompare(b.segment)
  })
}

function countRoutes(routes: ScannedRoute[]): number {
  let total = 0
  for (const r of routes) total += 1 + countRoutes(r.children)
  return total
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function generateRoutesFile(routes: ScannedRoute[], date: string): string {
  const rootNode: ScannedRoute = {
    id: "dashboard",
    segment: "dashboard",
    path: DASHBOARD_BASE,
    isDynamic: false,
    isCatchAll: false,
    children: routes,
  }

  return `${generatedHeader("nav/generated/routes.generated.ts", date)}
import type { RouteNode } from '../types';

export const ROUTE_TREE: RouteNode = ${renderRouteNode(rootNode, 0)};

function flattenTree(node: RouteNode): RouteNode[] {
  return [node, ...node.children.flatMap((child) => flattenTree(child))];
}

export const ALL_ROUTE_NODES: readonly RouteNode[] = flattenTree(ROUTE_TREE);
`
}

interface CapturedParam {
  paramName: string
  variable: string
}

function resolvePathTemplate(
  relPath: string,
  captured: CapturedParam[]
): string {
  let resolved = relPath
  for (const { paramName, variable } of captured) {
    resolved = resolved.replace(`[${paramName}]`, `\${${variable}}`)
  }
  return resolved
}

function pathCallExpr(rawPath: string, captured: CapturedParam[]): string {
  const rel = rawPath.replace(DASHBOARD_BASE, "")
  const resolved = resolvePathTemplate(rel, captured)
  const needsTemplate = captured.some(({ paramName }) =>
    rel.includes(`[${paramName}]`)
  )
  return needsTemplate ? `b(\`${resolved}\`)` : `b('${resolved}')`
}

function renderHelperEntries(
  routes: ScannedRoute[],
  captured: CapturedParam[],
  indentLevel: number
): string[] {
  const pad = "  ".repeat(indentLevel)
  const innerPad = "  ".repeat(indentLevel + 1)
  const entries: string[] = []

  for (const route of routes) {
    if (route.isCatchAll) continue

    const key = route.isDynamic
      ? dynamicKey(route.paramName ?? "id")
      : toCamelCase(route.segment)

    if (route.isDynamic) {
      const param = route.paramName ?? "id"
      const newCaptured: CapturedParam[] = [
        ...captured,
        { paramName: param, variable: param },
      ]
      const hrefExpr = pathCallExpr(route.path, newCaptured)

      if (route.children.length === 0) {
        entries.push(
          `${pad}${key}: (${param}: string | number) => ({ href: ${hrefExpr} })`
        )
      } else {
        const childEntries = renderHelperEntries(
          route.children,
          newCaptured,
          indentLevel + 1
        )
        entries.push(
          `${pad}${key}: (${param}: string | number) => ({\n` +
            `${innerPad}href: ${hrefExpr},\n` +
            `${childEntries.join(",\n")},\n` +
            `${pad}})`
        )
      }
    } else {
      const hrefExpr = pathCallExpr(route.path, captured)

      if (route.children.length === 0) {
        entries.push(`${pad}${key}: ${hrefExpr}`)
      } else {
        const childEntries = renderHelperEntries(
          route.children,
          captured,
          indentLevel + 1
        )
        entries.push(
          `${pad}${key}: {\n` +
            `${innerPad}href: ${hrefExpr},\n` +
            `${childEntries.join(",\n")},\n` +
            `${pad}}`
        )
      }
    }
  }

  return entries
}

function generateHelpersFile(routes: ScannedRoute[], date: string): string {
  const topLevelEntries = renderHelperEntries(routes, [], 1)
  // Only emit the entries block (with its leading blank line + trailing comma)
  // when there are routes — otherwise an empty tree yields a stray comma.
  const entriesBlock =
    topLevelEntries.length > 0 ? `\n${topLevelEntries.join(",\n\n")},\n` : ""

  return `${generatedHeader("nav/generated/route-helpers.generated.ts", date)}
const BASE = '${DASHBOARD_BASE}';
const b = (path: string) => \`\${BASE}\${path}\`;

export const routes = {
  href: b(''),
${entriesBlock}} as const;

export type Routes = typeof routes;
`
}

function generateIndexFile(date: string): string {
  return `${generatedHeader("nav/generated/route-index.generated.ts", date)}
import type { RouteNode } from '../types';
import { ROUTE_TREE, ALL_ROUTE_NODES } from './routes.generated';

export const routeById: Readonly<Record<string, RouteNode>> = Object.fromEntries(
  ALL_ROUTE_NODES.map((node) => [node.id, node])
);

export const routeByPath: Readonly<Record<string, RouteNode>> = Object.fromEntries(
  ALL_ROUTE_NODES.map((node) => [node.path, node])
);

const _segmentMap: Record<string, RouteNode[]> = {};
for (const node of ALL_ROUTE_NODES) {
  if (_segmentMap[node.segment]) {
    _segmentMap[node.segment].push(node);
  } else {
    _segmentMap[node.segment] = [node];
  }
}
export const routesBySegment: Readonly<Record<string, RouteNode[]>> = _segmentMap;

function buildParentMap(node: RouteNode, map: Map<string, RouteNode[]>): void {
  map.set(node.id, node.children);
  for (const child of node.children) buildParentMap(child, map);
}

const _parentMap = new Map<string, RouteNode[]>();
buildParentMap(ROUTE_TREE, _parentMap);
export const childrenById: Readonly<Map<string, RouteNode[]>> = _parentMap;

export const allRouteIds: readonly string[] = ALL_ROUTE_NODES.map((n) => n.id);
export const allStaticPaths: readonly string[] = ALL_ROUTE_NODES.filter((n) => !n.isDynamic).map((n) => n.path);
export const allDynamicRouteNodes: readonly RouteNode[] = ALL_ROUTE_NODES.filter((n) => n.isDynamic);
`
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

const normalizeGeneratedContent = (s: string) =>
  s.replace(/\* Generated: .+/, "* Generated: [normalized]")

function writeIfChanged(filePath: string, content: string): boolean {
  const normalizedNew = normalizeGeneratedContent(content)

  try {
    const existing = fs.readFileSync(filePath, "utf8")
    if (normalizeGeneratedContent(existing) === normalizedNew) return false
  } catch {
    // File doesn't exist yet — fall through to write
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, "utf8")
  return true
}

// ---------------------------------------------------------------------------
// Hash-based change detection (module singleton — persists across watcher calls)
// ---------------------------------------------------------------------------

let _lastTreeHash: string | null = null

function hashRouteTree(routes: ScannedRoute[]): string {
  return createHash("sha256").update(JSON.stringify(routes)).digest("hex")
}

// ---------------------------------------------------------------------------
// Core generator
// ---------------------------------------------------------------------------

export function generateRoutes(
  options: { silent?: boolean } = {}
): GenerateResult {
  const { silent = false } = options
  const date = new Date().toISOString().split("T")[0]

  // When the dashboard tree doesn't exist yet, emit an empty route tree instead
  // of failing — lets the routing setup be generated/committed before any
  // dashboard routes are added.
  const rootExists = fs.existsSync(ROOT_DIR)
  if (!rootExists && !silent) {
    console.log(
      `[routes:generate] ${ROOT_DIR} not found — generating an empty route tree.`
    )
  }

  if (!silent && rootExists) console.log(`[routes:generate] Scanning ${ROOT_DIR}...`)

  const scanned = rootExists ? sortRoutes(scanDirectory(ROOT_DIR, [])) : []
  const routeCount = countRoutes(scanned)

  if (!silent) console.log(`[routes:generate] Found ${routeCount} route nodes.`)

  const treeHash = hashRouteTree(scanned)
  if (_lastTreeHash !== null && treeHash === _lastTreeHash) {
    if (!silent)
      console.log("[routes:generate] No structural changes — skipping write.")
    return { routeCount, filesChanged: 0, skipped: true }
  }
  _lastTreeHash = treeHash

  const fileDefs = [
    {
      name: "routes.generated.ts",
      filePath: path.join(OUT_DIR, "routes.generated.ts"),
      content: generateRoutesFile(scanned, date),
    },
    {
      name: "route-helpers.generated.ts",
      filePath: path.join(OUT_DIR, "route-helpers.generated.ts"),
      content: generateHelpersFile(scanned, date),
    },
    {
      name: "route-index.generated.ts",
      filePath: path.join(OUT_DIR, "route-index.generated.ts"),
      content: generateIndexFile(date),
    },
  ]

  let filesChanged = 0
  for (const { name, filePath, content } of fileDefs) {
    const changed = writeIfChanged(filePath, content)
    if (!silent)
      console.log(
        `[routes:generate] ${changed ? "✓ updated" : "— unchanged"} ${name}`
      )
    if (changed) filesChanged++
  }

  if (!silent) console.log("[routes:generate] Done.")
  return { routeCount, filesChanged, skipped: false }
}

// ---------------------------------------------------------------------------
// Entry point — only runs when this file is executed directly
// ---------------------------------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateRoutes()
}
