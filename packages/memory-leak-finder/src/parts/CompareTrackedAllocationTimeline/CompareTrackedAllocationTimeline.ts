import type { Session } from '../Session/Session.ts'
import type { ScriptMap } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import * as ResolveTrackedLocationSourceMaps from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import type { TrackedAllocationRun } from '../GetTrackedAllocations/GetTrackedAllocations.ts'

export interface TrackedAllocationTimelineResultEntry {
  readonly createdCount: number
  readonly location: string
  readonly originalColumn: number | null
  readonly originalLine: number | null
  readonly originalLocation: string | null
  readonly originalSource: string | null
  readonly type: string
}

export interface TrackedAllocationTimelineResultRun {
  readonly allocations: readonly TrackedAllocationTimelineResultEntry[]
  readonly runIndex: number
}

export interface TrackedAllocationTimelineInput {
  readonly runs: readonly TrackedAllocationRun[]
  readonly scriptMap?: ScriptMap
}

export const compareTrackedAllocationTimeline = async (
  _before: unknown,
  after: TrackedAllocationTimelineInput,
  _context: Session,
): Promise<readonly TrackedAllocationTimelineResultRun[]> => {
  const locations = [...new Set(after.runs.flatMap((run) => run.allocations.map((allocation) => allocation.location)).filter(Boolean))]
  const resolvedLocations = await ResolveTrackedLocationSourceMaps.resolveTrackedLocationSourceMaps(locations, after.scriptMap)

  return after.runs.map((run) => {
    const allocations = run.allocations.map((allocation) => {
      const resolved = resolvedLocations[allocation.location] || {
        originalColumn: null,
        originalLine: null,
        originalLocation: null,
        originalSource: null,
      }
      return {
        createdCount: allocation.createdCount,
        location: allocation.location,
        originalColumn: resolved.originalColumn,
        originalLine: resolved.originalLine,
        originalLocation: resolved.originalLocation,
        originalSource: resolved.originalSource,
        type: allocation.type,
      }
    })
    return {
      allocations,
      runIndex: run.runIndex,
    }
  })
}
