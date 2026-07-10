/**
 * nav/metadata/index.ts
 *
 * Merges all per-module metadata files into a single MetadataRegistry.
 * Add a `<module>.meta.ts` file and register it in the object below when a
 * dashboard module needs sidebar/breadcrumb/access metadata.
 */

import type { MetadataRegistry } from "../types"
import { rootMetadata } from "./root.meta"
import { complaintsMetadata } from "./complaints.meta"
import { tendersMetadata } from "./tenders.meta"
import { agenciesMetadata } from "./agencies.meta"
import { departmentsMetadata } from "./departments.meta"
import { officersMetadata } from "./officers.meta"
import { notificationsMetadata } from "./notifications.meta"
import { settingsMetadata } from "./settings.meta"

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

// Register each `<module>.meta.ts` here as dashboard modules are added.
export const metadataRegistry: MetadataRegistry = validateMetadataModules({
  root: rootMetadata,
  complaints: complaintsMetadata,
  tenders: tendersMetadata,
  agencies: agenciesMetadata,
  departments: departmentsMetadata,
  officers: officersMetadata,
  notifications: notificationsMetadata,
  settings: settingsMetadata,
})
