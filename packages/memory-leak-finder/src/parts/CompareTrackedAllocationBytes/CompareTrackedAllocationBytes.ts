import type { TrackedAllocationByteStatistics } from '../GetTrackedAllocationBytes/GetTrackedAllocationBytes.ts'
import type { ScriptMap } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import type { ResolvedTrackedLocation } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import * as ResolveTrackedLocationSourceMaps from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'

export interface TrackedAllocationByteResult extends ResolvedTrackedLocation {
  readonly createdCount: number
  readonly estimatedBytes: number
  readonly unknownCount: number
  readonly location: string
  readonly originalType: string
  readonly type: string
}

export interface TrackedAllocationByteSnapshot {
  readonly scriptMap?: ScriptMap
  readonly trackedAllocationBytes: TrackedAllocationByteStatistics
}

export const compareTrackedAllocationBytes = async (
  before: TrackedAllocationByteSnapshot,
  after: TrackedAllocationByteSnapshot,
): Promise<readonly TrackedAllocationByteResult[]> => {
  const allocations = Object.entries(after.trackedAllocationBytes)
  const locations = [...new Set(allocations.map(([, entry]) => entry.location))]
  const resolved = await ResolveTrackedLocationSourceMaps.resolveTrackedLocationSourceMaps(locations, after.scriptMap)
  const results: TrackedAllocationByteResult[] = []
  for (const [key, entry] of allocations) {
    const previous = before.trackedAllocationBytes[key]
    const createdCount = Math.max(0, entry.createdCount - (previous?.createdCount || 0))
    if (!createdCount) continue
    const source = resolved[entry.location] || {
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalName: null,
      originalSource: null,
    }
    results.push({
      ...source,
      createdCount,
      estimatedBytes: Math.max(0, entry.estimatedBytes - (previous?.estimatedBytes || 0)),
      unknownCount: Math.max(0, entry.unknownCount - (previous?.unknownCount || 0)),
      location: entry.location,
      originalType: source.originalName || entry.type,
      type: entry.type,
    })
  }
  return results.toSorted((a, b) => b.estimatedBytes - a.estimatedBytes || b.createdCount - a.createdCount)
}
