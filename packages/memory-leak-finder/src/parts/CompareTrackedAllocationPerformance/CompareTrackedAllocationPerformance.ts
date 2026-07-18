import type { TrackedAllocationResult } from '../CompareTrackedAllocations/CompareTrackedAllocations.ts'
import * as CompareTrackedAllocations from '../CompareTrackedAllocations/CompareTrackedAllocations.ts'
import type { CpuProfileSourceMetrics } from '../CpuProfileSourceSummary/CpuProfileSourceSummary.ts'
import * as CpuProfileSourceSummary from '../CpuProfileSourceSummary/CpuProfileSourceSummary.ts'
import type { ScriptMap } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import type { Session } from '../Session/Session.ts'
import type { Dynamic } from '../Types/Types.ts'

export interface TrackedAllocationPerformanceAfter {
  readonly cpuProfile: Dynamic
  readonly scriptMap: ScriptMap
  readonly trackedAllocations: Dynamic
}

export interface TrackedAllocationPerformanceFile {
  readonly collectedCount: number
  readonly createdCount: number
  readonly retainedCount: number
  readonly source: string
  readonly sourceSelfTimeMs: number
  readonly sourceSelfTimePercent: number
}

export interface TrackedAllocationPerformanceResult {
  readonly cpuProfile: Dynamic
  readonly files: readonly TrackedAllocationPerformanceFile[]
  readonly metrics: CpuProfileSourceMetrics
  readonly sites: readonly TrackedAllocationResult[]
}

const PercentagePrecision = 1000

const getLocationSource = (location: string, scriptMap: ScriptMap): string => {
  const match = location.match(/^(.+):\d+:\d+$/)
  const generatedSource = match?.[1] || location || 'Unknown'
  return scriptMap[generatedSource]?.url || generatedSource
}

const getAllocationSource = (allocation: TrackedAllocationResult, scriptMap: ScriptMap): string => {
  return allocation.originalSource || getLocationSource(allocation.location, scriptMap)
}

const roundPercentage = (value: number): number => {
  return Math.round((value + Number.EPSILON) * PercentagePrecision) / PercentagePrecision
}

export const compareTrackedAllocationPerformance = async (
  before: Dynamic,
  after: TrackedAllocationPerformanceAfter,
  context: Session,
): Promise<TrackedAllocationPerformanceResult> => {
  const sites = await CompareTrackedAllocations.compareTrackedAllocations(before, after, context)
  const cpuSummary = await CpuProfileSourceSummary.getCpuProfileSourceSummary(after.cpuProfile, after.scriptMap)
  const countsBySource = new Map<
    string,
    {
      collectedCount: number
      createdCount: number
      retainedCount: number
    }
  >()

  for (const site of sites) {
    const source = getAllocationSource(site, after.scriptMap)
    const counts = countsBySource.get(source) || {
      collectedCount: 0,
      createdCount: 0,
      retainedCount: 0,
    }
    counts.collectedCount += site.collectedCount
    counts.createdCount += site.createdCount
    counts.retainedCount += site.aliveCount
    countsBySource.set(source, counts)
  }

  const files = [...countsBySource]
    .map(([source, counts]) => {
      const sourceSelfTimeMs = cpuSummary.sourceSelfTime[source] || 0
      const sourceSelfTimePercent =
        cpuSummary.metrics.javascriptSelfTimeMs === 0
          ? 0
          : roundPercentage((sourceSelfTimeMs / cpuSummary.metrics.javascriptSelfTimeMs) * 100)
      return {
        ...counts,
        source,
        sourceSelfTimeMs,
        sourceSelfTimePercent,
      }
    })
    .toSorted(
      (a, b) =>
        b.collectedCount - a.collectedCount ||
        b.createdCount - a.createdCount ||
        b.sourceSelfTimeMs - a.sourceSelfTimeMs ||
        a.source.localeCompare(b.source),
    )

  return {
    cpuProfile: after.cpuProfile,
    files,
    metrics: cpuSummary.metrics,
    sites,
  }
}
