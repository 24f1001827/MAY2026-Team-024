#!/usr/bin/env bun
/**
 * scripts/watch-routes.ts
 *
 * Filesystem watcher for route auto-regeneration.
 *
 * Uses Node's built-in recursive fs.watch (no external deps) to detect
 * directory changes inside app/dashboard, debounces rapid burst events
 * (folder renames trigger many events), and delegates to generateRoutes().
 *
 * Run: bun routes:watch
 * Typically started alongside next dev via: bun dev
 */

import * as fs from "node:fs"
import path from "node:path"
import { generateRoutes } from "./generate-routes"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WATCH_DIR = path.resolve(process.cwd(), "app/dashboard")

/** Wait this long after the last event before regenerating. */
const DEBOUNCE_MS = 200

/** Paths whose changes should never trigger regeneration. */
const IGNORED: RegExp[] = [
  /nav[/\\]generated/,
  /node_modules/,
  /\.next/,
  /[/\\]_[^/\\]+([/\\]|$)/,
  /(^|[/\\])\./,
]

function isIgnored(rel: string): boolean {
  return IGNORED.some((re) => re.test(rel))
}

// ---------------------------------------------------------------------------
// Debounced regeneration
// ---------------------------------------------------------------------------

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRegeneration(rel: string): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => runRegeneration(rel), DEBOUNCE_MS)
}

function runRegeneration(rel: string): void {
  process.stdout.write(`\n[routes:watch] change: ${rel}\n`)
  try {
    const result = generateRoutes({ silent: true })
    if (result.skipped) {
      process.stdout.write("— No structural changes, skipping write.\n")
    } else {
      const fileWord = result.filesChanged === 1 ? "file" : "files"
      process.stdout.write(
        `Routes regenerated (${result.filesChanged} ${fileWord} updated, ${result.routeCount} routes)\n`
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`Route generation failed: ${message}\n`)
  }
}

// ---------------------------------------------------------------------------
// Initial generation + watcher startup
// ---------------------------------------------------------------------------

process.stdout.write("Watching app routes...\n")
process.stdout.write(`   ${WATCH_DIR}\n\n`)

// Always generate once on startup so the watcher launches with fresh output.
generateRoutes()

const watcher = fs.watch(
  WATCH_DIR,
  { recursive: true },
  (_event, filename) => {
    if (!filename) return
    const rel = filename.toString()
    if (isIgnored(rel)) return
    // Only directory-shaped changes matter (App Router routes are folders),
    // but fs.watch can't distinguish reliably — debounce absorbs the noise.
    scheduleRegeneration(rel)
  }
)

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string): void {
  process.stdout.write(`\n[routes:watch] Received ${signal}, stopping...\n`)
  if (debounceTimer) clearTimeout(debounceTimer)
  watcher.close()
  process.exit(0)
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
