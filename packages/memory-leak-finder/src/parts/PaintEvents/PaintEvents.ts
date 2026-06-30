import type { Dynamic } from '../Types/Types.ts'

export interface PaintRect {
  readonly area: number
  readonly height: number
  readonly width: number
  readonly x: number
  readonly y: number
}

export interface PaintEvent {
  readonly durationMs: number
  readonly index: number
  readonly layerId: string
  readonly nodeId: number
  readonly nodeName: string
  readonly rects: readonly PaintRect[]
  readonly source: string
  readonly startMs: number
  readonly timestampUs: number
  readonly totalArea: number
}

export interface PaintEventsMetrics {
  readonly averageDurationMs: number
  readonly dataLossOccurred: boolean
  readonly maxDurationMs: number
  readonly paintAreaCount: number
  readonly paintCount: number
  readonly totalDurationMs: number
  readonly totalPaintedArea: number
}

export interface PaintEventsSummary {
  readonly events: readonly PaintEvent[]
  readonly layerPaintEvents: readonly Dynamic[]
  readonly layerTreeEvents: readonly Dynamic[]
  readonly metrics: PaintEventsMetrics
  readonly rawEvents: readonly Dynamic[]
}

const MicrosecondToMillisecond = 1000
const SecondToMicrosecond = 1_000_000
const MetricPrecision = 1000
const MaxSummaryEvents = 10

const roundMetricValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MetricPrecision) / MetricPrecision
}

const toNumber = (value: Dynamic): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const toString = (value: Dynamic): string => {
  return typeof value === 'string' ? value : ''
}

const getTimestamp = (event: Dynamic): number | undefined => {
  const timestamp = event?.ts
  return typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : undefined
}

const getMonotonicTimestamp = (event: Dynamic): number | undefined => {
  const timestamp = event?.timestamp
  return typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp * SecondToMicrosecond : undefined
}

const getTraceStartTimestamp = (events: readonly Dynamic[]): number => {
  let startTimestamp = Number.POSITIVE_INFINITY
  for (const event of events) {
    const timestamp = getTimestamp(event)
    const monotonicTimestamp = getMonotonicTimestamp(event)
    const candidateTimestamp = timestamp ?? monotonicTimestamp
    if (candidateTimestamp !== undefined && candidateTimestamp < startTimestamp) {
      startTimestamp = candidateTimestamp
    }
  }
  return Number.isFinite(startTimestamp) ? startTimestamp : 0
}

const normalizeRect = (x: number, y: number, width: number, height: number): PaintRect => {
  const normalizedWidth = Math.max(0, roundMetricValue(width))
  const normalizedHeight = Math.max(0, roundMetricValue(height))
  return {
    area: roundMetricValue(normalizedWidth * normalizedHeight),
    height: normalizedHeight,
    width: normalizedWidth,
    x: roundMetricValue(x),
    y: roundMetricValue(y),
  }
}

const getRectFromObject = (value: Dynamic): PaintRect | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  return normalizeRect(toNumber(value.x), toNumber(value.y), toNumber(value.width), toNumber(value.height))
}

const getRectFromArray = (value: readonly Dynamic[]): PaintRect | undefined => {
  if (value.length === 4) {
    return normalizeRect(toNumber(value[0]), toNumber(value[1]), toNumber(value[2]), toNumber(value[3]))
  }
  if (value.length < 8) {
    return undefined
  }
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < value.length - 1; i += 2) {
    const x = toNumber(value[i])
    const y = toNumber(value[i + 1])
    xs.push(x)
    ys.push(y)
  }
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return normalizeRect(minX, minY, maxX - minX, maxY - minY)
}

const getRects = (value: Dynamic): readonly PaintRect[] => {
  if (Array.isArray(value)) {
    const rect = getRectFromArray(value)
    return rect ? [rect] : []
  }
  const rect = getRectFromObject(value)
  return rect ? [rect] : []
}

const getTraceClip = (event: Dynamic): Dynamic => {
  return event?.args?.data?.clip ?? event?.args?.clip
}

const isPaintEvent = (event: Dynamic): boolean => {
  return event?.name === 'Paint'
}

const getLayerPaintEventTimestamp = (event: Dynamic): number => {
  return getMonotonicTimestamp(event) ?? toNumber(event?.ts)
}

const getTotalArea = (rects: readonly PaintRect[]): number => {
  let totalArea = 0
  for (const rect of rects) {
    totalArea = roundMetricValue(totalArea + rect.area)
  }
  return totalArea
}

const createTracePaintEvent = (event: Dynamic, index: number, traceStartTimestamp: number): PaintEvent => {
  const timestampUs = toNumber(event?.ts)
  const durationMs = roundMetricValue(toNumber(event?.dur) / MicrosecondToMillisecond)
  const startMs = roundMetricValue((timestampUs - traceStartTimestamp) / MicrosecondToMillisecond)
  const data = event?.args?.data || {}
  const rects = getRects(getTraceClip(event))
  return {
    durationMs,
    index,
    layerId: toString(data.layerId ?? data.layer_id ?? event?.args?.layerId),
    nodeId: toNumber(data.nodeId),
    nodeName: toString(data.nodeName),
    rects,
    source: 'trace',
    startMs,
    timestampUs,
    totalArea: getTotalArea(rects),
  }
}

const createLayerPaintEvent = (event: Dynamic, index: number, traceStartTimestamp: number): PaintEvent => {
  const params = event?.params || {}
  const timestampUs = getLayerPaintEventTimestamp(event)
  const startMs = timestampUs === 0 ? 0 : roundMetricValue((timestampUs - traceStartTimestamp) / MicrosecondToMillisecond)
  const rects = getRects(params.clip)
  return {
    durationMs: 0,
    index,
    layerId: toString(params.layerId),
    nodeId: 0,
    nodeName: '',
    rects,
    source: 'layer-tree',
    startMs,
    timestampUs,
    totalArea: getTotalArea(rects),
  }
}

export const getPaintEvents = (
  traceEvents: readonly Dynamic[],
  layerPaintEvents: readonly Dynamic[] = [],
  layerTreeEvents: readonly Dynamic[] = [],
  dataLossOccurred = false,
): PaintEventsSummary => {
  const rawEvents = traceEvents.filter(isPaintEvent).toSorted((a, b) => toNumber(a?.ts) - toNumber(b?.ts))
  const sortedLayerPaintEvents = [...layerPaintEvents].toSorted((a, b) => getLayerPaintEventTimestamp(a) - getLayerPaintEventTimestamp(b))
  const traceStartTimestamp = getTraceStartTimestamp([...traceEvents, ...sortedLayerPaintEvents])
  const events: PaintEvent[] = []
  let totalDurationMs = 0
  let maxDurationMs = 0
  let paintAreaCount = 0
  let totalPaintedArea = 0

  for (const event of rawEvents) {
    events.push(createTracePaintEvent(event, events.length + 1, traceStartTimestamp))
  }
  for (const event of sortedLayerPaintEvents) {
    events.push(createLayerPaintEvent(event, events.length + 1, traceStartTimestamp))
  }

  events.sort((a, b) => a.timestampUs - b.timestampUs || a.index - b.index)
  const normalizedEvents = events.map((event, index) => ({ ...event, index: index + 1 }))

  for (const event of normalizedEvents) {
    totalDurationMs = roundMetricValue(totalDurationMs + event.durationMs)
    maxDurationMs = Math.max(maxDurationMs, event.durationMs)
    paintAreaCount += event.rects.length
    totalPaintedArea = roundMetricValue(totalPaintedArea + event.totalArea)
  }

  const paintCount = normalizedEvents.length
  const averageDurationMs = paintCount === 0 ? 0 : roundMetricValue(totalDurationMs / paintCount)

  return {
    events: normalizedEvents,
    layerPaintEvents: sortedLayerPaintEvents,
    layerTreeEvents,
    metrics: {
      averageDurationMs,
      dataLossOccurred,
      maxDurationMs,
      paintAreaCount,
      paintCount,
      totalDurationMs,
      totalPaintedArea,
    },
    rawEvents,
  }
}

export const formatPaintEventsSummary = ({ events, metrics }: PaintEventsSummary): string => {
  const lines = [
    'Paint events:',
    `paintCount | ${metrics.paintCount}`,
    `paintAreaCount | ${metrics.paintAreaCount}`,
    `totalPaintedArea | ${metrics.totalPaintedArea}`,
    `totalDurationMs | ${metrics.totalDurationMs}`,
    `averageDurationMs | ${metrics.averageDurationMs}`,
    `maxDurationMs | ${metrics.maxDurationMs}`,
    `dataLossOccurred | ${metrics.dataLossOccurred}`,
  ]
  const largestEvents = [...events]
    .toSorted((a, b) => b.totalArea - a.totalArea || b.durationMs - a.durationMs || a.index - b.index)
    .slice(0, MaxSummaryEvents)
  if (largestEvents.length > 0) {
    lines.push('index | source | startMs | durationMs | totalArea | rectCount | layerId')
    for (const event of largestEvents) {
      lines.push(
        `${event.index} | ${event.source} | ${event.startMs} | ${event.durationMs} | ${event.totalArea} | ${event.rects.length} | ${event.layerId}`,
      )
    }
  }
  return lines.join('\n')
}
