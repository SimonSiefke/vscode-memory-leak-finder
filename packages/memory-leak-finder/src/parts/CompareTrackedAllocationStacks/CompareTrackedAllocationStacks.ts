import type { TrackedAllocationStackStatistic } from '../GetTrackedAllocations/GetTrackedAllocations.ts'
import type { ScriptMap } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import * as ResolveTrackedLocationSourceMaps from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import type { Session } from '../Session/Session.ts'

export interface TrackedAllocationStackInput {
  readonly profiledRuns?: number
  readonly scriptMap?: ScriptMap
  readonly selectedAllocationSites?: readonly string[]
  readonly trackedAllocationStacks: readonly TrackedAllocationStackStatistic[]
  readonly tracedRuns?: number
}

export interface TrackedAllocationStackFrame {
  readonly functionName: string
  readonly location: string | null
  readonly originalFunctionName: string | null
  readonly originalLocation: string | null
  readonly raw: string
}

export interface TrackedAllocationStackResult {
  readonly createdCount: number
  readonly location: string
  readonly originalLocation: string | null
  readonly originalType: string
  readonly stack: readonly TrackedAllocationStackFrame[]
  readonly type: string
}

export interface TrackedAllocationStackSiteResult {
  readonly createdCount: number
  readonly location: string
  readonly originalLocation: string | null
  readonly originalType: string
  readonly topCallers: readonly TrackedAllocationCallerResult[]
  readonly topTraces: readonly TrackedAllocationStackResult[]
  readonly type: string
}

export interface TrackedAllocationCallerResult {
  readonly callPath: string
  readonly createdCount: number
}

export interface TrackedAllocationStacksResult {
  readonly isLeak: false
  readonly profiledRuns: number
  readonly selectedAllocationSites: readonly string[]
  readonly sites: readonly TrackedAllocationStackSiteResult[]
  readonly summary: string
  readonly traces: readonly TrackedAllocationStackResult[]
  readonly tracedRuns: number
}

interface ParsedStackFrame {
  readonly functionName: string
  readonly location: string | null
  readonly raw: string
}

const parseStackFrame = (raw: string): ParsedStackFrame => {
  const trimmed = raw.trim()
  const frame = trimmed.startsWith('at ') ? trimmed.slice(3) : trimmed
  const withFunction = frame.match(/^(.*?) \((.+):(\d+):(\d+)\)$/)
  if (withFunction) {
    return {
      functionName: withFunction[1],
      location: `${withFunction[2]}:${withFunction[3]}:${withFunction[4]}`,
      raw: trimmed,
    }
  }
  const withoutFunction = frame.match(/^(.+):(\d+):(\d+)$/)
  if (withoutFunction) {
    return {
      functionName: '',
      location: `${withoutFunction[1]}:${withoutFunction[2]}:${withoutFunction[3]}`,
      raw: trimmed,
    }
  }
  return {
    functionName: '',
    location: null,
    raw: trimmed,
  }
}

const getKey = (entry: TrackedAllocationStackStatistic): string => {
  return `${entry.location}\0${entry.type}\0${entry.stack}`
}

const getInput = (value: readonly TrackedAllocationStackStatistic[] | TrackedAllocationStackInput): TrackedAllocationStackInput => {
  if (Array.isArray(value)) {
    return {
      trackedAllocationStacks: value,
    }
  }
  return value as TrackedAllocationStackInput
}

const formatCallPath = (trace: TrackedAllocationStackResult): string => {
  const names = trace.stack
    .slice(0, 8)
    .map((frame) => frame.functionName)
    .filter(Boolean)
  return names.length === 0 ? trace.stack[0]?.raw || '<unknown>' : names.join(' <- ')
}

const formatSummary = (sites: readonly TrackedAllocationStackSiteResult[], profiledRuns: number, tracedRuns: number): string => {
  if (sites.length === 0) {
    return 'Tracked allocations with stack traces: none'
  }
  const lines = [
    `Tracked allocation hot sites with stack traces: ${sites.length} (${profiledRuns} profiling run, ${tracedRuns} traced runs)`,
    'created | type | allocation location',
  ]
  for (const site of sites.slice(0, 10)) {
    lines.push(`${site.createdCount} | ${site.originalType} | ${site.originalLocation || site.location}`)
    for (const caller of site.topCallers.slice(0, 3)) {
      lines.push(`  ${caller.createdCount} | ${caller.callPath}`)
    }
  }
  return lines.join('\n')
}

export const compareTrackedAllocationStacks = async (
  beforeValue: readonly TrackedAllocationStackStatistic[] | TrackedAllocationStackInput,
  afterValue: readonly TrackedAllocationStackStatistic[] | TrackedAllocationStackInput,
  _context: Session,
): Promise<TrackedAllocationStacksResult> => {
  const before = getInput(beforeValue).trackedAllocationStacks
  const after = getInput(afterValue)
  const beforeByKey = new Map(before.map((entry) => [getKey(entry), entry]))
  const parsedStacks = after.trackedAllocationStacks.map((entry) => ({
    entry,
    frames: entry.stack.split('\n').filter(Boolean).map(parseStackFrame),
  }))
  const locations = [...new Set(after.trackedAllocationStacks.map((entry) => entry.location))]
  const resolvedLocations = await ResolveTrackedLocationSourceMaps.resolveTrackedLocationSourceMaps(locations, after.scriptMap)
  const traces: TrackedAllocationStackResult[] = []

  for (const { entry, frames } of parsedStacks) {
    const previous = beforeByKey.get(getKey(entry))
    const createdCount = Math.max(0, entry.createdCount - (previous?.createdCount || 0))
    if (createdCount === 0) {
      continue
    }
    const allocationLocation = resolvedLocations[entry.location]
    traces.push({
      createdCount,
      location: entry.location,
      originalLocation: allocationLocation?.originalLocation || null,
      originalType: allocationLocation?.originalName || entry.type,
      stack: frames.map((frame) => {
        return {
          functionName: frame.functionName,
          location: frame.location,
          originalFunctionName: null,
          originalLocation: null,
          raw: frame.raw,
        }
      }),
      type: entry.type,
    })
  }

  traces.sort((a, b) => b.createdCount - a.createdCount || a.location.localeCompare(b.location))
  const sites = [...Map.groupBy(traces, (trace) => trace.location)].map(([location, siteTraces]) => {
    const first = siteTraces[0]!
    const topCallers = [...Map.groupBy(siteTraces, formatCallPath)]
      .map(([callPath, callerTraces]) => ({
        callPath,
        createdCount: callerTraces.reduce((total, trace) => total + trace.createdCount, 0),
      }))
      .toSorted((a, b) => b.createdCount - a.createdCount || a.callPath.localeCompare(b.callPath))
    return {
      createdCount: siteTraces.reduce((total, trace) => total + trace.createdCount, 0),
      location,
      originalLocation: first.originalLocation,
      originalType: first.originalType,
      topCallers,
      topTraces: siteTraces,
      type: first.type,
    }
  })
  sites.sort((a, b) => b.createdCount - a.createdCount || a.location.localeCompare(b.location))
  return {
    isLeak: false,
    profiledRuns: after.profiledRuns || 0,
    selectedAllocationSites: after.selectedAllocationSites || [],
    sites,
    summary: formatSummary(sites, after.profiledRuns || 0, after.tracedRuns || 0),
    traces,
    tracedRuns: after.tracedRuns || 0,
  }
}
