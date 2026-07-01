import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface PaintEvent {
  readonly durationMs?: number
  readonly index?: number
  readonly nodeName?: string
  readonly rects?: readonly PaintRect[]
  readonly startMs?: number
  readonly totalArea?: number
}

interface PaintRect {
  readonly area?: number
  readonly height?: number
  readonly width?: number
  readonly x?: number
  readonly y?: number
}

interface PaintComponent {
  averageArea: number
  averageDurationMs: number
  count: number
  height: number
  name: string
  rects: readonly NormalizedRect[]
  selector: string
  totalArea: number
  totalDurationMs: number
  width: number
  x: number
  y: number
}

interface PaintChartGroup {
  averageDurationMs: number
  averagePaintedArea: number
  components: readonly PaintComponent[]
  count: number
  id: string
  name: string
  paintCount: number
  rects: readonly NormalizedRect[]
  sampleIndexes: readonly number[]
  sampleStartMs: number
  selectorSummary: string
  totalDurationMs: number
  totalPaintedArea: number
}

interface NormalizedRect {
  readonly area: number
  readonly height: number
  readonly selector: string
  readonly width: number
  readonly x: number
  readonly y: number
}

interface DocumentPaintGroup {
  readonly events: readonly PaintEvent[]
}

interface ComponentAggregate {
  count: number
  height: number
  rects: NormalizedRect[]
  selector: string
  totalArea: number
  totalDurationMs: number
  width: number
  x: number
  y: number
}

interface GroupAggregate {
  components: Map<string, ComponentAggregate>
  count: number
  events: PaintEvent[]
  id: string
  sampleIndexes: number[]
  sampleStartMs: number
  totalDurationMs: number
  totalPaintedArea: number
}

const MaxPaintGroups = 20
const MaxComponentsPerGroup = 8
const MaxSampleIndexes = 6

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return 0
}

const roundMetric = (value: number): number => {
  return Math.round(value * 1000) / 1000
}

const normalizeIdentifier = (value: string): string => {
  return value.trim().replace(/\s+/g, '-')
}

const getAttributeValue = (nodeName: string, attributeName: string): string => {
  const match = nodeName.match(new RegExp(`${attributeName}='([^']+)'`))
  return match ? match[1] : ''
}

const getSelector = (nodeName: string | undefined): string => {
  if (!nodeName) {
    return 'unknown'
  }
  if (nodeName === '#document') {
    return '#document'
  }
  const tagMatch = nodeName.match(/^([A-Z0-9-]+)/)
  const tagName = tagMatch ? tagMatch[1].toLowerCase() : 'node'
  const id = getAttributeValue(nodeName, 'id')
  const className = getAttributeValue(nodeName, 'class')
  const idPart = id ? `#${normalizeIdentifier(id)}` : ''
  const classPart = className
    ? className
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => `.${normalizeIdentifier(part)}`)
        .join('')
    : ''
  return `${tagName}${idPart}${classPart}`
}

const isDocumentPaint = (event: PaintEvent): boolean => {
  return getSelector(event.nodeName) === '#document'
}

const normalizeRect = (rect: PaintRect | undefined, selector: string): NormalizedRect => {
  const x = Math.round(toFiniteNumber(rect?.x))
  const y = Math.round(toFiniteNumber(rect?.y))
  const width = Math.round(toFiniteNumber(rect?.width))
  const height = Math.round(toFiniteNumber(rect?.height))
  const area = Math.round(toFiniteNumber(rect?.area) || width * height)
  return {
    area,
    height,
    selector,
    width,
    x,
    y,
  }
}

const getEventRects = (event: PaintEvent): readonly NormalizedRect[] => {
  const selector = getSelector(event.nodeName)
  if (!event.rects || event.rects.length === 0) {
    return [normalizeRect(undefined, selector)]
  }
  return event.rects.map((rect) => normalizeRect(rect, selector))
}

const getComponentKey = (rect: NormalizedRect): string => {
  return `${rect.selector}|${rect.x}|${rect.y}|${rect.width}|${rect.height}`
}

const hashString = (value: string): string => {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

const getDocumentGroupSignature = (group: DocumentPaintGroup): string => {
  const components = group.events.flatMap((event) => getEventRects(event).map(getComponentKey))
  return components.toSorted().join('\n')
}

const getDocumentGroupId = (group: DocumentPaintGroup): string => {
  return `paint-${hashString(getDocumentGroupSignature(group))}`
}

const getEventDuration = (event: PaintEvent): number => {
  return toFiniteNumber(event.durationMs)
}

const getEventArea = (event: PaintEvent): number => {
  const totalArea = toFiniteNumber(event.totalArea)
  if (totalArea > 0) {
    return totalArea
  }
  return getEventRects(event).reduce((total, rect) => total + rect.area, 0)
}

const groupDocumentPaints = (events: readonly PaintEvent[]): readonly DocumentPaintGroup[] => {
  const orderedEvents = [...events].toSorted(
    (a, b) => toFiniteNumber(a.startMs) - toFiniteNumber(b.startMs) || toFiniteNumber(a.index) - toFiniteNumber(b.index),
  )
  const groups: DocumentPaintGroup[] = []
  let currentEvents: PaintEvent[] = []
  for (const event of orderedEvents) {
    if (isDocumentPaint(event)) {
      if (currentEvents.length > 0) {
        groups.push({
          events: currentEvents,
        })
      }
      currentEvents = [event]
      continue
    }
    currentEvents.push(event)
  }
  if (currentEvents.length > 0) {
    groups.push({
      events: currentEvents,
    })
  }
  return groups
}

const addComponent = (components: Map<string, ComponentAggregate>, rect: NormalizedRect, durationMs: number): void => {
  const key = getComponentKey(rect)
  const existing = components.get(key)
  if (existing) {
    existing.count++
    existing.totalArea += rect.area
    existing.totalDurationMs += durationMs
    if (existing.rects.length < MaxSampleIndexes) {
      existing.rects.push(rect)
    }
    return
  }
  components.set(key, {
    count: 1,
    height: rect.height,
    rects: [rect],
    selector: rect.selector,
    totalArea: rect.area,
    totalDurationMs: durationMs,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  })
}

const addGroup = (aggregates: Map<string, GroupAggregate>, group: DocumentPaintGroup): void => {
  const id = getDocumentGroupId(group)
  let aggregate = aggregates.get(id)
  if (!aggregate) {
    aggregate = {
      components: new Map(),
      count: 0,
      events: [],
      id,
      sampleIndexes: [],
      sampleStartMs: toFiniteNumber(group.events[0]?.startMs),
      totalDurationMs: 0,
      totalPaintedArea: 0,
    }
    aggregates.set(id, aggregate)
  }
  aggregate.count++
  aggregate.events.push(...group.events)
  aggregate.totalDurationMs += group.events.reduce((total, event) => total + getEventDuration(event), 0)
  aggregate.totalPaintedArea += group.events.reduce((total, event) => total + getEventArea(event), 0)
  for (const event of group.events) {
    const index = toFiniteNumber(event.index)
    if (index && aggregate.sampleIndexes.length < MaxSampleIndexes) {
      aggregate.sampleIndexes.push(index)
    }
    for (const rect of getEventRects(event)) {
      addComponent(aggregate.components, rect, getEventDuration(event))
    }
  }
}

const toPaintComponent = (component: ComponentAggregate): PaintComponent => {
  const dimensions = `${component.width}x${component.height} @ ${component.x},${component.y}`
  return {
    averageArea: Math.round(component.totalArea / component.count),
    averageDurationMs: roundMetric(component.totalDurationMs / component.count),
    count: component.count,
    height: component.height,
    name: `${component.selector} ${dimensions}`,
    rects: component.rects,
    selector: component.selector,
    totalArea: component.totalArea,
    totalDurationMs: roundMetric(component.totalDurationMs),
    width: component.width,
    x: component.x,
    y: component.y,
  }
}

const toPaintChartGroup = (aggregate: GroupAggregate): PaintChartGroup => {
  const components = [...aggregate.components.values()]
    .map(toPaintComponent)
    .toSorted(
      (a, b) =>
        b.averageDurationMs - a.averageDurationMs ||
        b.averageArea - a.averageArea ||
        a.selector.localeCompare(b.selector) ||
        b.width * b.height - a.width * a.height,
    )
  const topComponents = components.slice(0, MaxComponentsPerGroup)
  const selectorSummary = topComponents
    .filter((component) => component.selector !== '#document')
    .slice(0, 3)
    .map((component) => component.selector)
    .join(', ')
  const name = `${aggregate.id} ${selectorSummary || '#document'}`
  return {
    averageDurationMs: roundMetric(aggregate.totalDurationMs / aggregate.count),
    averagePaintedArea: Math.round(aggregate.totalPaintedArea / aggregate.count),
    components: topComponents,
    count: aggregate.count,
    id: aggregate.id,
    name,
    paintCount: aggregate.events.length,
    rects: topComponents.flatMap((component) => component.rects),
    sampleIndexes: aggregate.sampleIndexes,
    sampleStartMs: roundMetric(aggregate.sampleStartMs),
    selectorSummary: selectorSummary || '#document',
    totalDurationMs: roundMetric(aggregate.totalDurationMs),
    totalPaintedArea: aggregate.totalPaintedArea,
  }
}

const getPaintEventGroups = (events: readonly PaintEvent[]): readonly PaintChartGroup[] => {
  const aggregates = new Map<string, GroupAggregate>()
  for (const group of groupDocumentPaints(events)) {
    addGroup(aggregates, group)
  }
  return [...aggregates.values()]
    .map(toPaintChartGroup)
    .toSorted(
      (a, b) =>
        b.averageDurationMs - a.averageDurationMs ||
        b.totalDurationMs - a.totalDurationMs ||
        b.averagePaintedArea - a.averagePaintedArea ||
        a.id.localeCompare(b.id),
    )
    .slice(0, MaxPaintGroups)
}

export const getPaintEventsData = async (basePath: string): Promise<any[]> => {
  const resultsPath = join(basePath, 'paint-events')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents.toSorted()) {
    const absolutePath = join(resultsPath, dirent)
    const rawData = await readJson(absolutePath)
    const events = rawData.paintEvents?.events || []
    const data = getPaintEventGroups(events)
    allData.push({
      data,
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
