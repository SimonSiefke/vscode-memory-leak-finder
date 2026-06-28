import type { Session } from '../Session/Session.ts'
import type { ScriptMap } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import * as ResolveTrackedLocationSourceMaps from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import type { TrackedAllocationStatistics } from '../GetTrackedAllocations/GetTrackedAllocations.ts'

export interface TrackedAllocationResult {
  readonly aliveCount: number
  readonly collectedCount: number
  readonly createdCount: number
  readonly location: string
  readonly originalColumn: number | null
  readonly originalLine: number | null
  readonly originalLocation: string | null
  readonly originalSource: string | null
  readonly type: string
}

type TrackedAllocationsInput =
  | TrackedAllocationStatistics
  | {
      readonly scriptMap?: ScriptMap
      readonly trackedAllocations: TrackedAllocationStatistics
    }

const hasTrackedAllocations = (
  value: TrackedAllocationsInput,
): value is Extract<TrackedAllocationsInput, { readonly trackedAllocations: TrackedAllocationStatistics }> => {
  return 'trackedAllocations' in value
}

export const compareTrackedAllocations = async (
  before: TrackedAllocationsInput,
  after: TrackedAllocationsInput,
  _context: Session,
): Promise<readonly TrackedAllocationResult[]> => {
  const beforeAllocations = hasTrackedAllocations(before) ? before.trackedAllocations : before
  const afterData = hasTrackedAllocations(after) ? after : { scriptMap: undefined, trackedAllocations: after }
  const afterAllocations = afterData.trackedAllocations
  const allKeys = new Set([...Object.keys(beforeAllocations), ...Object.keys(afterAllocations)])
  const locations = [
    ...new Set([...allKeys].map((key) => afterAllocations[key]?.location || beforeAllocations[key]?.location).filter(Boolean)),
  ]
  const resolvedLocations = await ResolveTrackedLocationSourceMaps.resolveTrackedLocationSourceMaps(locations, afterData.scriptMap)

  const results: TrackedAllocationResult[] = []
  for (const key of allKeys) {
    const beforeEntry = beforeAllocations[key]
    const afterEntry = afterAllocations[key]
    if (!afterEntry) {
      continue
    }
    const createdCount = Math.max(0, afterEntry.createdCount - (beforeEntry?.createdCount || 0))
    const collectedCount = Math.max(0, afterEntry.collectedCount - (beforeEntry?.collectedCount || 0))
    if (createdCount === 0) {
      continue
    }
    const location = afterEntry.location
    const resolved = resolvedLocations[location] || {
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalSource: null,
    }
    results.push({
      aliveCount: Math.max(0, createdCount - collectedCount),
      collectedCount,
      createdCount,
      location,
      originalColumn: resolved.originalColumn,
      originalLine: resolved.originalLine,
      originalLocation: resolved.originalLocation,
      originalSource: resolved.originalSource,
      type: afterEntry.type,
    })
  }

  return results.toSorted((a, b) => b.collectedCount - a.collectedCount || b.createdCount - a.createdCount)
}
