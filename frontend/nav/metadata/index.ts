/**
 * nav/metadata/index.ts
 *
 * Merges all per-module metadata files into a single MetadataRegistry.
 * Add a `<module>.meta.ts` file and register it in the object below when a
 * dashboard module needs sidebar/breadcrumb/access metadata.
 */

import type { MetadataRegistry } from "../types"

function validateMetadataModules(
  modules: Record<string, MetadataRegistry>
): MetadataRegistry {
  const seen = new Map<string, string>()
  const collisions: string[] = []

  for (const [moduleName, metadata] of Object.entries(modules)) {
    for (const key of Object.keys(metadata)) {
      const previous = seen.get(key)
      if (previous === undefined) {
        seen.set(key, moduleName)
      } else {
        collisions.push(
          `"${key}" defined in both "${previous}" and "${moduleName}"`
        )
      }
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `Duplicate metadata keys detected:\n${collisions.map((c) => `  - ${c}`).join("\n")}`
    )
  }

  return Object.assign({}, ...Object.values(modules)) as MetadataRegistry
}

// No modules yet — register `<module>Metadata` entries here as routes are added.
export const metadataRegistry: MetadataRegistry = validateMetadataModules({})
