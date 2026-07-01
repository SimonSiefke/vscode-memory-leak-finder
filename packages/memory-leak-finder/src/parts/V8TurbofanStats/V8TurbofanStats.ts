import type { Dynamic } from '../Types/Types.ts'

export interface V8TurbofanStatsMetrics {
  readonly dataLossOccurred: boolean
  readonly deoptimizationCount: number
  readonly optimizationCount: number
  readonly phaseEventCount: number
  readonly rawEventCount: number
  readonly totalAllocatedBytes: number
  readonly totalPhaseDurationMs: number
}

export interface V8TurbofanOptimizedFunctionRow {
  readonly functionName: string
  readonly optimizationCount: number
  readonly totalAllocatedBytes: number
  readonly totalPhaseDurationMs: number
}

export interface V8TurbofanDeoptimizedFunctionRow {
  readonly count: number
  readonly functionName: string
  readonly reasons: readonly string[]
}

export interface V8TurbofanPhaseRow {
  readonly count: number
  readonly maxAllocatedBytes: number
  readonly name: string
  readonly totalAllocatedBytes: number
  readonly totalDurationMs: number
}

export interface V8TurbofanStatsSummary {
  readonly metrics: V8TurbofanStatsMetrics
  readonly rawEvents: readonly Dynamic[]
  readonly topDeoptimizedFunctions: readonly V8TurbofanDeoptimizedFunctionRow[]
  readonly topOptimizedFunctions: readonly V8TurbofanOptimizedFunctionRow[]
  readonly topPhases: readonly V8TurbofanPhaseRow[]
}

type MutableOptimizedFunctionRow = {
  -readonly [Property in keyof V8TurbofanOptimizedFunctionRow]: V8TurbofanOptimizedFunctionRow[Property]
}

interface MutableDeoptimizedFunctionRow {
  count: number
  functionName: string
  reasons: Set<string>
}

type MutablePhaseRow = {
  -readonly [Property in keyof V8TurbofanPhaseRow]: V8TurbofanPhaseRow[Property]
}

interface PhaseStats {
  readonly absoluteMaxAllocatedBytes: number
  readonly functionName: string
  readonly maxAllocatedBytes: number
  readonly totalAllocatedBytes: number
}

const MicrosecondToMillisecond = 1000
const MetricPrecision = 1000
const MaxTopRows = 20
const UnknownFunctionName = '(unknown)'
const UnknownReason = '(unknown)'

const roundMetricValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MetricPrecision) / MetricPrecision
}

const toNumber = (value: Dynamic): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const toString = (value: Dynamic): string => {
  return typeof value === 'string' ? value : ''
}

const firstString = (...values: readonly Dynamic[]): string => {
  for (const value of values) {
    const stringValue = toString(value)
    if (stringValue) {
      return stringValue
    }
  }
  return ''
}

const parseStatsString = (value: string): Dynamic => {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

const getStats = (event: Dynamic): PhaseStats | undefined => {
  const rawStats = event?.args?.stats
  const stats = typeof rawStats === 'string' ? parseStatsString(rawStats) : rawStats
  if (!stats || typeof stats !== 'object') {
    return undefined
  }
  return {
    absoluteMaxAllocatedBytes: toNumber(stats.absolute_max_allocated_bytes ?? stats.absoluteMaxAllocatedBytes),
    functionName: toString(stats.function_name ?? stats.functionName),
    maxAllocatedBytes: toNumber(stats.max_allocated_bytes ?? stats.maxAllocatedBytes),
    totalAllocatedBytes: toNumber(stats.total_allocated_bytes ?? stats.totalAllocatedBytes),
  }
}

const getDurationMs = (event: Dynamic): number => {
  return roundMetricValue(toNumber(event?.dur) / MicrosecondToMillisecond)
}

const isTurbofanCategory = (event: Dynamic): boolean => {
  const category = toString(event?.cat)
  return category.includes('v8.turbofan') || category.includes('v8.wasm.turbofan')
}

const isPhaseEvent = (event: Dynamic): boolean => {
  return Boolean(event?.name) && Boolean(getStats(event)) && isTurbofanCategory(event)
}

const isOptimizationStartPhase = (event: Dynamic): boolean => {
  const name = toString(event?.name)
  return name === 'BytecodeGraphBuilder' || name === 'V8.TFBytecodeGraphBuilder'
}

const isDeoptimizationEvent = (event: Dynamic): boolean => {
  const name = toString(event?.name).toLowerCase()
  return name.includes('deopt')
}

const getDeoptimizationFunctionName = (event: Dynamic): string => {
  const args = event?.args || {}
  const data = args.data || {}
  return (
    firstString(
      args.functionName,
      args.function_name,
      args.function,
      args.name,
      data.functionName,
      data.function_name,
      data.function,
      data.name,
    ) || UnknownFunctionName
  )
}

const getDeoptimizationReason = (event: Dynamic): string => {
  const args = event?.args || {}
  const data = args.data || {}
  return firstString(args.reason, args.deoptReason, args.deopt_reason, data.reason, data.deoptReason, data.deopt_reason) || UnknownReason
}

const addOptimizedFunction = (
  map: Map<string, MutableOptimizedFunctionRow>,
  functionName: string,
  durationMs: number,
  totalAllocatedBytes: number,
): void => {
  const name = functionName || UnknownFunctionName
  const existing = map.get(name) || {
    functionName: name,
    optimizationCount: 0,
    totalAllocatedBytes: 0,
    totalPhaseDurationMs: 0,
  }
  existing.optimizationCount++
  existing.totalAllocatedBytes += totalAllocatedBytes
  existing.totalPhaseDurationMs = roundMetricValue(existing.totalPhaseDurationMs + durationMs)
  map.set(name, existing)
}

const addDeoptimizedFunction = (map: Map<string, MutableDeoptimizedFunctionRow>, functionName: string, reason: string): void => {
  const existing = map.get(functionName) || {
    count: 0,
    functionName,
    reasons: new Set<string>(),
  }
  existing.count++
  existing.reasons.add(reason)
  map.set(functionName, existing)
}

const addPhase = (map: Map<string, MutablePhaseRow>, name: string, durationMs: number, stats: PhaseStats): void => {
  const existing = map.get(name) || {
    count: 0,
    maxAllocatedBytes: 0,
    name,
    totalAllocatedBytes: 0,
    totalDurationMs: 0,
  }
  existing.count++
  existing.maxAllocatedBytes = Math.max(existing.maxAllocatedBytes, stats.maxAllocatedBytes, stats.absoluteMaxAllocatedBytes)
  existing.totalAllocatedBytes += stats.totalAllocatedBytes
  existing.totalDurationMs = roundMetricValue(existing.totalDurationMs + durationMs)
  map.set(name, existing)
}

const getTopOptimizedFunctions = (rows: Iterable<V8TurbofanOptimizedFunctionRow>): readonly V8TurbofanOptimizedFunctionRow[] => {
  return [...rows]
    .toSorted(
      (a, b) =>
        b.optimizationCount - a.optimizationCount ||
        b.totalPhaseDurationMs - a.totalPhaseDurationMs ||
        b.totalAllocatedBytes - a.totalAllocatedBytes ||
        a.functionName.localeCompare(b.functionName),
    )
    .slice(0, MaxTopRows)
}

const getTopDeoptimizedFunctions = (rows: Iterable<MutableDeoptimizedFunctionRow>): readonly V8TurbofanDeoptimizedFunctionRow[] => {
  return [...rows]
    .map((row) => ({
      count: row.count,
      functionName: row.functionName,
      reasons: [...row.reasons].toSorted((a, b) => a.localeCompare(b)),
    }))
    .toSorted((a, b) => b.count - a.count || a.functionName.localeCompare(b.functionName))
    .slice(0, MaxTopRows)
}

const getTopPhases = (rows: Iterable<V8TurbofanPhaseRow>): readonly V8TurbofanPhaseRow[] => {
  return [...rows]
    .toSorted(
      (a, b) =>
        b.totalDurationMs - a.totalDurationMs ||
        b.totalAllocatedBytes - a.totalAllocatedBytes ||
        b.count - a.count ||
        a.name.localeCompare(b.name),
    )
    .slice(0, MaxTopRows)
}

export const getV8TurbofanStats = (events: readonly Dynamic[], dataLossOccurred = false): V8TurbofanStatsSummary => {
  const rawEvents = events.filter((event) => isPhaseEvent(event) || isDeoptimizationEvent(event))
  const optimizedFunctions = new Map<string, MutableOptimizedFunctionRow>()
  const deoptimizedFunctions = new Map<string, MutableDeoptimizedFunctionRow>()
  const phases = new Map<string, MutablePhaseRow>()
  let deoptimizationCount = 0
  let optimizationCount = 0
  let phaseEventCount = 0
  let totalAllocatedBytes = 0
  let totalPhaseDurationMs = 0

  for (const event of rawEvents) {
    if (isDeoptimizationEvent(event)) {
      deoptimizationCount++
      addDeoptimizedFunction(deoptimizedFunctions, getDeoptimizationFunctionName(event), getDeoptimizationReason(event))
    }

    if (!isPhaseEvent(event)) {
      continue
    }

    const stats = getStats(event)
    if (!stats) {
      continue
    }

    const durationMs = getDurationMs(event)
    const phaseName = toString(event.name)
    phaseEventCount++
    totalAllocatedBytes += stats.totalAllocatedBytes
    totalPhaseDurationMs = roundMetricValue(totalPhaseDurationMs + durationMs)
    addPhase(phases, phaseName, durationMs, stats)

    if (isOptimizationStartPhase(event)) {
      optimizationCount++
      addOptimizedFunction(optimizedFunctions, stats.functionName, durationMs, stats.totalAllocatedBytes)
    }
  }

  return {
    metrics: {
      dataLossOccurred,
      deoptimizationCount,
      optimizationCount,
      phaseEventCount,
      rawEventCount: rawEvents.length,
      totalAllocatedBytes,
      totalPhaseDurationMs,
    },
    rawEvents,
    topDeoptimizedFunctions: getTopDeoptimizedFunctions(deoptimizedFunctions.values()),
    topOptimizedFunctions: getTopOptimizedFunctions(optimizedFunctions.values()),
    topPhases: getTopPhases(phases.values()),
  }
}

export const formatV8TurbofanStatsSummary = ({
  metrics,
  topDeoptimizedFunctions,
  topOptimizedFunctions,
  topPhases,
}: V8TurbofanStatsSummary): string => {
  const lines = [
    'V8 TurboFan stats:',
    `optimizationCount | ${metrics.optimizationCount}`,
    `deoptimizationCount | ${metrics.deoptimizationCount}`,
    `phaseEventCount | ${metrics.phaseEventCount}`,
    `totalPhaseDurationMs | ${metrics.totalPhaseDurationMs}`,
    `totalAllocatedBytes | ${metrics.totalAllocatedBytes}`,
    `dataLossOccurred | ${metrics.dataLossOccurred}`,
  ]
  if (topOptimizedFunctions.length > 0) {
    lines.push('optimized functions:')
    lines.push('function | optimizationCount | totalPhaseDurationMs | totalAllocatedBytes')
    for (const row of topOptimizedFunctions.slice(0, 10)) {
      lines.push(`${row.functionName} | ${row.optimizationCount} | ${row.totalPhaseDurationMs} | ${row.totalAllocatedBytes}`)
    }
  }
  if (topDeoptimizedFunctions.length > 0) {
    lines.push('deoptimized functions:')
    lines.push('function | count | reasons')
    for (const row of topDeoptimizedFunctions.slice(0, 10)) {
      lines.push(`${row.functionName} | ${row.count} | ${row.reasons.join(', ')}`)
    }
  }
  if (topPhases.length > 0) {
    lines.push('top phases:')
    lines.push('phase | totalDurationMs | totalAllocatedBytes | count')
    for (const row of topPhases.slice(0, 10)) {
      lines.push(`${row.name} | ${row.totalDurationMs} | ${row.totalAllocatedBytes} | ${row.count}`)
    }
  }
  return lines.join('\n')
}
