import { getSampleTiming } from '../CpuProfileSampleTimes/CpuProfileSampleTimes.ts'
import type { Dynamic } from '../Types/Types.ts'

export interface CpuProfileMetrics {
  readonly elapsedTimeMs?: number | null
  readonly javascriptTimeMs?: number
  readonly gcTimeMs?: number
  readonly idleTimeMs?: number
  readonly otherTimeMs?: number
  readonly estimatedTiming?: boolean
  readonly nodeCount: number
  readonly sampleCount: number
  readonly totalTimeMs: number
}

export interface CpuProfileRow {
  readonly columnNumber: number
  readonly functionName: string
  readonly hitCount: number
  readonly lineNumber: number
  readonly selfTimeMs: number
  readonly totalTimeMs: number
  readonly url: string
}

export interface CpuProfileSummary {
  readonly metrics: CpuProfileMetrics
  readonly topSelfTime: readonly CpuProfileRow[]
  readonly topTotalTime: readonly CpuProfileRow[]
}

type MutableCpuProfileRow = {
  -readonly [Property in keyof CpuProfileRow]: CpuProfileRow[Property]
}

const MillisecondPrecision = 1000
const MaxTopFunctions = 20
const AnonymousFunctionName = '(anonymous)'

const toArray = (value: Dynamic): readonly Dynamic[] => {
  return Array.isArray(value) ? value : []
}

const toNumber = (value: Dynamic): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const toString = (value: Dynamic): string => {
  return typeof value === 'string' ? value : ''
}

const roundMetricValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MillisecondPrecision) / MillisecondPrecision
}

const getFunctionName = (node: Dynamic): string => {
  const functionName = toString(node?.callFrame?.functionName)
  return functionName || AnonymousFunctionName
}

const createRow = (node: Dynamic): MutableCpuProfileRow => {
  const callFrame = node?.callFrame || {}
  return {
    columnNumber: toNumber(callFrame.columnNumber),
    functionName: getFunctionName(node),
    hitCount: 0,
    lineNumber: toNumber(callFrame.lineNumber),
    selfTimeMs: 0,
    totalTimeMs: 0,
    url: toString(callFrame.url),
  }
}

const getSortedRows = (rows: Iterable<CpuProfileRow>, key: 'selfTimeMs' | 'totalTimeMs'): readonly CpuProfileRow[] => {
  return [...rows]
    .filter((row) => row[key] > 0)
    .toSorted(
      (a, b) =>
        b[key] - a[key] ||
        b.hitCount - a.hitCount ||
        a.functionName.localeCompare(b.functionName) ||
        a.url.localeCompare(b.url) ||
        a.lineNumber - b.lineNumber ||
        a.columnNumber - b.columnNumber,
    )
    .slice(0, MaxTopFunctions)
}

export const getCpuProfileSummary = (profile: Dynamic): CpuProfileSummary => {
  const nodes = toArray(profile?.nodes)
  const samples = toArray(profile?.samples)
  const timing = getSampleTiming(profile)
  const sampleTimes = timing.times
  const parentMap = new Map<number, number>()
  const rowMap = new Map<number, MutableCpuProfileRow>()

  for (const node of nodes) {
    const id = toNumber(node?.id)
    if (!id) {
      continue
    }
    rowMap.set(id, createRow(node))
    for (const child of toArray(node?.children)) {
      const childId = toNumber(child)
      if (childId) {
        parentMap.set(childId, id)
      }
    }
  }

  let totalTimeMs = 0
  let javascriptTimeMs = 0,
    gcTimeMs = 0,
    idleTimeMs = 0,
    otherTimeMs = 0
  for (let i = 0; i < samples.length; i++) {
    const sampleId = toNumber(samples[i])
    const sampleTimeMs = sampleTimes[i] || 0
    totalTimeMs += sampleTimeMs
    const row = rowMap.get(sampleId)
    if (!row) {
      otherTimeMs += sampleTimeMs
      continue
    }
    if (row.functionName === '(idle)') idleTimeMs += sampleTimeMs
    else if (row.functionName === '(garbage collector)') gcTimeMs += sampleTimeMs
    else if (row.url) javascriptTimeMs += sampleTimeMs
    else otherTimeMs += sampleTimeMs
    row.selfTimeMs += sampleTimeMs
    row.hitCount++

    let currentId = sampleId
    const seen = new Set<number>()
    while (currentId && !seen.has(currentId)) {
      seen.add(currentId)
      const currentRow = rowMap.get(currentId)
      if (currentRow) {
        currentRow.totalTimeMs += sampleTimeMs
      }
      currentId = parentMap.get(currentId) || 0
    }
  }

  for (const row of rowMap.values()) {
    row.selfTimeMs = roundMetricValue(row.selfTimeMs)
    row.totalTimeMs = roundMetricValue(row.totalTimeMs)
  }
  return {
    metrics: {
      nodeCount: nodes.length,
      sampleCount: samples.length,
      totalTimeMs: roundMetricValue(totalTimeMs),
      elapsedTimeMs: timing.elapsedTimeMs === null ? null : roundMetricValue(timing.elapsedTimeMs),
      javascriptTimeMs: roundMetricValue(javascriptTimeMs),
      gcTimeMs: roundMetricValue(gcTimeMs),
      idleTimeMs: roundMetricValue(idleTimeMs),
      otherTimeMs: roundMetricValue(otherTimeMs),
      estimatedTiming: timing.estimated,
    },
    topSelfTime: getSortedRows(rowMap.values(), 'selfTimeMs'),
    topTotalTime: getSortedRows(rowMap.values(), 'totalTimeMs'),
  }
}

const formatLocation = (row: CpuProfileRow): string => {
  if (!row.url) {
    return ''
  }
  return `${row.url}:${row.lineNumber}:${row.columnNumber}`
}

export const formatCpuProfileSummary = ({ metrics, topSelfTime, topTotalTime }: CpuProfileSummary): string => {
  const lines = [
    'CPU profile:',
    `totalTimeMs | ${metrics.totalTimeMs}`,
    `sampleCount | ${metrics.sampleCount}`,
    `nodeCount | ${metrics.nodeCount}`,
  ]
  for (const key of ['elapsedTimeMs', 'javascriptTimeMs', 'gcTimeMs', 'idleTimeMs', 'otherTimeMs', 'estimatedTiming'] as const) {
    if (metrics[key] !== undefined) lines.push(`${key} | ${metrics[key]}`)
  }
  if (topSelfTime.length > 0) {
    lines.push('top self time:')
    lines.push('function | selfTimeMs | totalTimeMs | hitCount | location')
    for (const row of topSelfTime.slice(0, 10)) {
      lines.push(`${row.functionName} | ${row.selfTimeMs} | ${row.totalTimeMs} | ${row.hitCount} | ${formatLocation(row)}`)
    }
  }
  if (topTotalTime.length > 0) {
    lines.push('top total time:')
    lines.push('function | totalTimeMs | selfTimeMs | hitCount | location')
    for (const row of topTotalTime.slice(0, 10)) {
      lines.push(`${row.functionName} | ${row.totalTimeMs} | ${row.selfTimeMs} | ${row.hitCount} | ${formatLocation(row)}`)
    }
  }
  return lines.join('\n')
}
