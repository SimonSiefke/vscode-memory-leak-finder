import type { Dynamic } from '../Types/Types.ts'

export interface GcStatistics {
  readonly garbageMB: number
  readonly gcDurationMs: number
  readonly majorGCs: number
  readonly minorGCs: number
  readonly usedHeapMB: number
}

export interface GcStatisticsRow {
  readonly name: string
  readonly unit: string
  readonly value: number
}

const ByteToMegabyte = 1024 * 1024
const MicrosecondToMillisecond = 1000
const MillisecondPrecision = 1000

const toNumber = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const round = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MillisecondPrecision) / MillisecondPrecision
}

const toMegabytes = (value: number): number => {
  return round(value / ByteToMegabyte)
}

export const getGcStatistics = (events: readonly Dynamic[], usedHeapBytes: number, finalGarbageBytes: number): GcStatistics => {
  let garbageBytes = finalGarbageBytes
  let majorGCs = 0
  let minorGCs = 0
  let gcDurationMicroseconds = 0

  for (const event of events) {
    switch (event?.name) {
      case 'MajorGC':
        majorGCs++
        break
      case 'MinorGC':
        minorGCs++
        break
      case 'V8.GCFinalizeMC':
      case 'V8.GCScavenger':
        gcDurationMicroseconds += toNumber(event?.dur) || 0
        break
    }
    const usedHeapSizeBefore = toNumber(event?.args?.usedHeapSizeBefore)
    const usedHeapSizeAfter = toNumber(event?.args?.usedHeapSizeAfter)
    if (usedHeapSizeBefore !== undefined && usedHeapSizeAfter !== undefined) {
      garbageBytes += usedHeapSizeBefore - usedHeapSizeAfter
    }
  }

  return {
    garbageMB: toMegabytes(garbageBytes),
    gcDurationMs: round(gcDurationMicroseconds / MicrosecondToMillisecond),
    majorGCs,
    minorGCs,
    usedHeapMB: toMegabytes(usedHeapBytes),
  }
}

export const toGcStatisticsRows = (metrics: GcStatistics): readonly GcStatisticsRow[] => {
  return [
    { name: 'usedHeapMB', unit: 'MB', value: metrics.usedHeapMB },
    { name: 'garbageMB', unit: 'MB', value: metrics.garbageMB },
    { name: 'majorGCs', unit: 'count', value: metrics.majorGCs },
    { name: 'minorGCs', unit: 'count', value: metrics.minorGCs },
    { name: 'gcDurationMs', unit: 'ms', value: metrics.gcDurationMs },
  ]
}

export const formatGcStatisticsSummary = (rows: readonly GcStatisticsRow[]): string => {
  if (rows.length === 0) {
    return 'No GC statistics were available'
  }
  const lines = ['GC statistics:', 'metric | value | unit']
  for (const row of rows) {
    lines.push(`${row.name} | ${row.value} | ${row.unit}`)
  }
  return lines.join('\n')
}
