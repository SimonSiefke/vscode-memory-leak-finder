import type { MeasureContext } from '../Types/Types.ts'

export interface HandleCounts {
  readonly total: number
  readonly active: number
  readonly referenced: number
}

export interface ResourceUsage {
  readonly maxRss: number | null
  readonly pageFaults: { readonly ioRequired: number | null; readonly ioNotRequired: number | null }
  readonly fsActivity: { readonly reads: number | null; readonly writes: number | null }
  readonly userCpuSeconds: number | null
  readonly kernelCpuSeconds: number | null
}

export interface AvailableSnapshot {
  readonly available: true
  readonly pid: number | null
  readonly handles: Readonly<Record<string, HandleCounts>>
  readonly repeatingUvTimerCount: number
  readonly resourceUsage: ResourceUsage
  readonly javascriptHeap: Readonly<Record<string, number>>
  readonly workerCount: number
}

export interface UnavailableSnapshot {
  readonly available: false
  readonly reason: string
}

export type Snapshot = AvailableSnapshot | UnavailableSnapshot

// Serialized with toString() and evaluated inside the inspected process, so it
// must stay self-contained. The raw diagnostic report contains environment
// variables, paths, command lines, network interfaces and socket endpoints;
// only the allowlisted counters below leave the target.
/* istanbul ignore next */
export const collect = (realm: any): Snapshot => {
  'use strict'
  const report = realm.process?.report
  if (!report || typeof report.getReport !== 'function') {
    return { available: false, reason: 'process.report is unavailable in this target' }
  }
  // excludeNetwork skips reverse DNS lookups for socket endpoints. Its setter only accepts booleans.
  const canExcludeNetwork = typeof report.excludeNetwork === 'boolean'
  const previousExcludeNetwork = report.excludeNetwork
  let raw: any
  try {
    if (canExcludeNetwork) {
      report.excludeNetwork = true
    }
    raw = report.getReport()
    if (typeof raw === 'string') {
      raw = JSON.parse(raw)
    }
  } catch (error) {
    return { available: false, reason: String(error && error.message !== undefined ? error.message : error) }
  } finally {
    if (canExcludeNetwork) {
      report.excludeNetwork = previousExcludeNetwork
    }
  }
  const number = (value: any): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null)
  const counts = new Map<string, { total: number; active: number; referenced: number }>()
  let repeatingUvTimerCount = 0
  for (const handle of Array.isArray(raw?.libuv) ? raw.libuv : []) {
    const type = typeof handle?.type === 'string' && /^[a-z][a-z_]{0,31}$/.test(handle.type) ? handle.type : 'unknown'
    const entry = counts.get(type) || { total: 0, active: 0, referenced: 0 }
    entry.total++
    if (handle?.is_active === true) {
      entry.active++
    }
    if (handle?.is_referenced === true) {
      entry.referenced++
    }
    if (type === 'timer' && (number(handle.repeat) ?? 0) > 0) {
      repeatingUvTimerCount++
    }
    counts.set(type, entry)
  }
  const heapKeys = [
    'totalMemory',
    'totalCommittedMemory',
    'usedMemory',
    'availableMemory',
    'memoryLimit',
    'executableMemory',
    'mallocedMemory',
    'peakMallocedMemory',
    'externalMemory',
    'totalGlobalHandlesMemory',
    'usedGlobalHandlesMemory',
    'nativeContextCount',
    'detachedContextCount',
  ]
  const javascriptHeap: Record<string, number> = {}
  for (const key of heapKeys) {
    const value = number(raw?.javascriptHeap?.[key])
    if (value !== null) {
      javascriptHeap[key] = value
    }
  }
  const usage = raw?.resourceUsage || {}
  return {
    available: true,
    pid: number(realm.process.pid) ?? number(raw?.header?.processId),
    handles: Object.fromEntries([...counts].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
    repeatingUvTimerCount,
    resourceUsage: {
      maxRss: number(usage.maxRss),
      pageFaults: { ioRequired: number(usage.pageFaults?.IORequired), ioNotRequired: number(usage.pageFaults?.IONotRequired) },
      fsActivity: { reads: number(usage.fsActivity?.reads), writes: number(usage.fsActivity?.writes) },
      userCpuSeconds: number(usage.userCpuSeconds),
      kernelCpuSeconds: number(usage.kernelCpuSeconds),
    },
    javascriptHeap,
    workerCount: Array.isArray(raw?.workers) ? raw.workers.length : 0,
  }
}

export const expression = `(${collect.toString()})(globalThis)`

const delta = (before: number | null | undefined, after: number | null | undefined): number | null => {
  if (typeof before !== 'number' || typeof after !== 'number') {
    return null
  }
  // CPU seconds are fractional; avoid floating point noise in stored deltas.
  return Math.round((after - before) * 1e6) / 1e6
}

const empty: HandleCounts = { total: 0, active: 0, referenced: 0 }

export const units = {
  maxRss: 'bytes; process lifetime peak, never reset between snapshots',
  fsActivity: 'filesystem operation counts, not bytes',
  pageFaults: 'fault counts',
  repeatingUvTimerCount: 'native libuv timers with a repeat interval; JavaScript timers share one native timer',
}

export const compare = (before: Snapshot, after: Snapshot, context?: MeasureContext) => {
  const runs = Number.isSafeInteger(context?.runs) && (context?.runs ?? 0) > 0 ? (context?.runs as number) : 1
  if (!before.available || !after.available) {
    const reason = !before.available ? before.reason : (after as UnavailableSnapshot).reason
    return { available: false, reason, processChanged: false, before, after, suspectedTypes: [] as string[] }
  }
  if (before.pid !== after.pid) {
    return {
      available: true,
      reason: `Inspected process changed from PID ${before.pid} to ${after.pid}; deltas are not comparable`,
      processChanged: true,
      before,
      after,
      suspectedTypes: [] as string[],
    }
  }
  const types = [...new Set([...Object.keys(before.handles), ...Object.keys(after.handles)])].sort()
  const handleDeltas: Record<string, HandleCounts> = {}
  for (const type of types) {
    const a = before.handles[type] || empty
    const b = after.handles[type] || empty
    handleDeltas[type] = { total: b.total - a.total, active: b.active - a.active, referenced: b.referenced - a.referenced }
  }
  const javascriptHeapDelta: Record<string, number | null> = {}
  for (const key of Object.keys(after.javascriptHeap)) {
    javascriptHeapDelta[key] = delta(before.javascriptHeap[key], after.javascriptHeap[key])
  }
  const a = before.resourceUsage
  const b = after.resourceUsage
  return {
    available: true,
    processChanged: false,
    pid: after.pid,
    runs,
    handleDeltas,
    repeatingUvTimerDelta: after.repeatingUvTimerCount - before.repeatingUvTimerCount,
    workerCountDelta: after.workerCount - before.workerCount,
    resourceUsageDelta: {
      maxRss: delta(a.maxRss, b.maxRss),
      pageFaults: {
        ioRequired: delta(a.pageFaults.ioRequired, b.pageFaults.ioRequired),
        ioNotRequired: delta(a.pageFaults.ioNotRequired, b.pageFaults.ioNotRequired),
      },
      fsActivity: { reads: delta(a.fsActivity.reads, b.fsActivity.reads), writes: delta(a.fsActivity.writes, b.fsActivity.writes) },
      userCpuSeconds: delta(a.userCpuSeconds, b.userCpuSeconds),
      kernelCpuSeconds: delta(a.kernelCpuSeconds, b.kernelCpuSeconds),
    },
    javascriptHeapDelta,
    units,
    // A handle type is suspicious when it grew by at least one per measured run.
    suspectedTypes: types.filter((type) => handleDeltas[type].total >= runs),
    before,
    after,
  }
}

export type Result = ReturnType<typeof compare>

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`)

export const summary = (result: Result): string => {
  if (!result.available) {
    return `Unavailable: ${result.reason}`
  }
  if (result.processChanged || !('handleDeltas' in result)) {
    return `${result.reason}`
  }
  const changed = Object.entries(result.handleDeltas)
    .filter(([, value]) => value.total !== 0)
    .map(([type, value]) => `${type} ${signed(value.total)}`)
  const handles = changed.length > 0 ? changed.join(', ') : 'no change'
  const suspected = result.suspectedTypes.length > 0 ? `; grew by at least one per run: ${result.suspectedTypes.join(', ')}` : ''
  return `libuv handles (PID ${result.pid}): ${handles}${suspected}; handle growth is not proof of a leak`
}
