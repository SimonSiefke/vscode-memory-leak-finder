import type { Dynamic } from '../Types/Types.ts'

export interface LayoutEvent {
  readonly durationMs: number
  readonly index: number
  readonly startMs: number
  readonly timestampUs: number
}

export interface LayoutEventsMetrics {
  readonly averageDurationMs: number
  readonly dataLossOccurred: boolean
  readonly layoutCount: number
  readonly maxDurationMs: number
  readonly totalDurationMs: number
}

export interface LayoutEventsSummary {
  readonly events: readonly LayoutEvent[]
  readonly metrics: LayoutEventsMetrics
  readonly rawEvents: readonly Dynamic[]
}

const MicrosecondToMillisecond = 1000
const MillisecondPrecision = 1000
const MaxSummaryEvents = 10

const roundMetricValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MillisecondPrecision) / MillisecondPrecision
}

const toNumber = (value: Dynamic): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const getTimestamp = (event: Dynamic): number | undefined => {
  const timestamp = event?.ts
  return typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : undefined
}

const getTraceStartTimestamp = (events: readonly Dynamic[]): number => {
  let startTimestamp = Number.POSITIVE_INFINITY
  for (const event of events) {
    const timestamp = getTimestamp(event)
    if (timestamp !== undefined && timestamp < startTimestamp) {
      startTimestamp = timestamp
    }
  }
  return Number.isFinite(startTimestamp) ? startTimestamp : 0
}

const isLayoutEvent = (event: Dynamic): boolean => {
  return event?.name === 'Layout'
}

export const getLayoutEvents = (events: readonly Dynamic[], dataLossOccurred = false): LayoutEventsSummary => {
  const traceStartTimestamp = getTraceStartTimestamp(events)
  const rawEvents = events.filter(isLayoutEvent).toSorted((a, b) => toNumber(a?.ts) - toNumber(b?.ts))
  const normalizedEvents: LayoutEvent[] = []
  let totalDurationMs = 0
  let maxDurationMs = 0

  for (const [index, event] of rawEvents.entries()) {
    const timestampUs = getTimestamp(event) ?? traceStartTimestamp
    const durationMs = roundMetricValue(toNumber(event?.dur) / MicrosecondToMillisecond)
    const startMs = roundMetricValue((timestampUs - traceStartTimestamp) / MicrosecondToMillisecond)
    totalDurationMs = roundMetricValue(totalDurationMs + durationMs)
    maxDurationMs = Math.max(maxDurationMs, durationMs)
    normalizedEvents.push({
      durationMs,
      index: index + 1,
      startMs,
      timestampUs,
    })
  }

  const layoutCount = normalizedEvents.length
  const averageDurationMs = layoutCount === 0 ? 0 : roundMetricValue(totalDurationMs / layoutCount)

  return {
    events: normalizedEvents,
    metrics: {
      averageDurationMs,
      dataLossOccurred,
      layoutCount,
      maxDurationMs,
      totalDurationMs,
    },
    rawEvents,
  }
}

export const formatLayoutEventsSummary = ({ events, metrics }: LayoutEventsSummary): string => {
  const lines = [
    'Layout events:',
    `layoutCount | ${metrics.layoutCount}`,
    `totalDurationMs | ${metrics.totalDurationMs}`,
    `averageDurationMs | ${metrics.averageDurationMs}`,
    `maxDurationMs | ${metrics.maxDurationMs}`,
    `dataLossOccurred | ${metrics.dataLossOccurred}`,
  ]
  const slowestEvents = [...events].toSorted((a, b) => b.durationMs - a.durationMs || a.index - b.index).slice(0, MaxSummaryEvents)
  if (slowestEvents.length > 0) {
    lines.push('index | startMs | durationMs')
    for (const event of slowestEvents) {
      lines.push(`${event.index} | ${event.startMs} | ${event.durationMs}`)
    }
  }
  return lines.join('\n')
}
