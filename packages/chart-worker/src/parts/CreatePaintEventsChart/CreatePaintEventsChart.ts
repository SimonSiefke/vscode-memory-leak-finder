const DEFAULT_WIDTH = 1180
const HEADER_HEIGHT = 44
const GROUP_TOP_PADDING = 18
const GROUP_BOTTOM_PADDING = 18
const GROUP_GAP = 18
const BREAKDOWN_ROW_HEIGHT = 22
const THUMBNAIL_WIDTH = 220
const THUMBNAIL_HEIGHT = 126
const THUMBNAIL_X = 920
const BAR_X = 260
const BAR_WIDTH = 250
const COMPONENT_BAR_X = 548
const COMPONENT_BAR_WIDTH = 150

const PALETTE = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#f59e0b', '#0891b2', '#be123c', '#4f46e5', '#65a30d', '#c2410c']

interface PaintChartGroup {
  readonly averageDurationMs?: number
  readonly averagePaintedArea?: number
  readonly components?: readonly PaintComponent[]
  readonly count?: number
  readonly id?: string
  readonly name?: string
  readonly paintCount?: number
  readonly rects?: readonly PaintRect[]
  readonly sampleIndexes?: readonly number[]
  readonly sampleStartMs?: number
  readonly selectorSummary?: string
  readonly totalDurationMs?: number
}

interface PaintComponent {
  readonly averageArea?: number
  readonly averageDurationMs?: number
  readonly count?: number
  readonly height?: number
  readonly name?: string
  readonly rects?: readonly PaintRect[]
  readonly selector?: string
  readonly totalDurationMs?: number
  readonly width?: number
  readonly x?: number
  readonly y?: number
}

interface PaintRect {
  readonly area?: number
  readonly height?: number
  readonly selector?: string
  readonly width?: number
  readonly x?: number
  readonly y?: number
}

interface Bounds {
  readonly height: number
  readonly maxX: number
  readonly maxY: number
  readonly minX: number
  readonly minY: number
  readonly width: number
}

const escapeXml = (value: string): string => {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return 0
}

const formatMs = (value: number): string => {
  if (value >= 10) {
    return `${value.toFixed(1)} ms`
  }
  return `${value.toFixed(3)} ms`
}

const formatArea = (value: number): string => {
  return Math.round(value).toLocaleString('en-US')
}

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, maxLength - 3)}...`
}

const hashString = (value: string): number => {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return hash >>> 0
}

const getSelectorColor = (selector: string): string => {
  return PALETTE[hashString(selector) % PALETTE.length]
}

const getGroupHeight = (group: PaintChartGroup): number => {
  const componentCount = Math.max(1, group.components?.length || 0)
  return GROUP_TOP_PADDING + THUMBNAIL_HEIGHT + GROUP_BOTTOM_PADDING + componentCount * BREAKDOWN_ROW_HEIGHT
}

const getBarWidth = (value: number, maxValue: number, width: number): number => {
  if (value <= 0 || maxValue <= 0) {
    return 0
  }
  return Math.max(1, (value / maxValue) * width)
}

const getBounds = (rects: readonly PaintRect[]): Bounds => {
  if (rects.length === 0) {
    return {
      height: 1,
      maxX: 1,
      maxY: 1,
      minX: 0,
      minY: 0,
      width: 1,
    }
  }
  const minX = Math.min(...rects.map((rect) => toFiniteNumber(rect.x)))
  const minY = Math.min(...rects.map((rect) => toFiniteNumber(rect.y)))
  const maxX = Math.max(...rects.map((rect) => toFiniteNumber(rect.x) + toFiniteNumber(rect.width)))
  const maxY = Math.max(...rects.map((rect) => toFiniteNumber(rect.y) + toFiniteNumber(rect.height)))
  return {
    height: Math.max(1, maxY - minY),
    maxX,
    maxY,
    minX,
    minY,
    width: Math.max(1, maxX - minX),
  }
}

const getThumbnailRects = (rects: readonly PaintRect[], bounds: Bounds): string => {
  const scale = Math.min(THUMBNAIL_WIDTH / bounds.width, THUMBNAIL_HEIGHT / bounds.height)
  const scaledWidth = bounds.width * scale
  const scaledHeight = bounds.height * scale
  const offsetX = THUMBNAIL_X + (THUMBNAIL_WIDTH - scaledWidth) / 2
  const offsetY = (THUMBNAIL_HEIGHT - scaledHeight) / 2
  return rects
    .map((rect) => {
      const selector = rect.selector || 'unknown'
      const x = offsetX + (toFiniteNumber(rect.x) - bounds.minX) * scale
      const y = offsetY + (toFiniteNumber(rect.y) - bounds.minY) * scale
      const width = Math.max(1, toFiniteNumber(rect.width) * scale)
      const height = Math.max(1, toFiniteNumber(rect.height) * scale)
      const label = `${selector} ${toFiniteNumber(rect.width)}x${toFiniteNumber(rect.height)} @ ${toFiniteNumber(rect.x)},${toFiniteNumber(rect.y)}`
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${getSelectorColor(selector)}" fill-opacity="0.28" stroke="${getSelectorColor(selector)}" stroke-width="1"><title>${escapeXml(label)}</title></rect>`
    })
    .join('')
}

const getThumbnail = (group: PaintChartGroup, y: number): string => {
  const rects = group.rects || []
  const bounds = getBounds(rects)
  const thumbnailRects = getThumbnailRects(rects, bounds)
  const boundsLabel = `${Math.round(bounds.minX)},${Math.round(bounds.minY)} to ${Math.round(bounds.maxX)},${Math.round(bounds.maxY)}`
  return `<g transform="translate(0 ${y})">
  <rect x="${THUMBNAIL_X}" y="0" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" fill="#f8fafc" stroke="#cbd5e1" />
  ${thumbnailRects}
  <text x="${THUMBNAIL_X}" y="${THUMBNAIL_HEIGHT + 14}" font-size="11" fill="#475569">${escapeXml(boundsLabel)}</text>
</g>`
}

const getComponents = (group: PaintChartGroup, y: number, maxComponentDuration: number): string => {
  const components = group.components || []
  if (components.length === 0) {
    return `<text x="32" y="${y + 14}" font-size="12" fill="#64748b">No paint regions recorded</text>`
  }
  return components
    .map((component, index) => {
      const rowY = y + index * BREAKDOWN_ROW_HEIGHT
      const selector = component.selector || 'unknown'
      const duration = toFiniteNumber(component.averageDurationMs)
      const barWidth = getBarWidth(duration, maxComponentDuration, COMPONENT_BAR_WIDTH)
      const dimension = `${toFiniteNumber(component.width)}x${toFiniteNumber(component.height)} @ ${toFiniteNumber(component.x)},${toFiniteNumber(component.y)}`
      const label = `${selector} ${dimension}`
      return `<g>
  <rect x="36" y="${rowY + 5}" width="10" height="10" fill="${getSelectorColor(selector)}" />
  <text x="54" y="${rowY + 14}" font-size="12" fill="#0f172a"><title>${escapeXml(label)}</title>${escapeXml(truncate(label, 68))}</text>
  <rect x="${COMPONENT_BAR_X}" y="${rowY + 5}" width="${barWidth}" height="10" rx="2" ry="2" fill="${getSelectorColor(selector)}" fill-opacity="0.75" />
  <text x="${COMPONENT_BAR_X + barWidth + 6}" y="${rowY + 14}" font-size="12" fill="#334155">${escapeXml(formatMs(duration))} avg, ${component.count || 0}x, ${escapeXml(formatArea(toFiniteNumber(component.averageArea)))} px</text>
</g>`
    })
    .join('')
}

const getSampleIndexesLabel = (group: PaintChartGroup): string => {
  const sampleIndexes = group.sampleIndexes || []
  if (sampleIndexes.length === 0) {
    return ''
  }
  return `samples #${sampleIndexes.join(', #')}`
}

const getGroup = (group: PaintChartGroup, index: number, y: number, maxDuration: number, maxComponentDuration: number): string => {
  const averageDuration = toFiniteNumber(group.averageDurationMs)
  const barWidth = getBarWidth(averageDuration, maxDuration, BAR_WIDTH)
  const componentsY = GROUP_TOP_PADDING + THUMBNAIL_HEIGHT + 22
  const groupHeight = getGroupHeight(group)
  const sampleIndexesLabel = getSampleIndexesLabel(group)
  const title = `${group.id || group.name || `paint-${index + 1}`} ${group.selectorSummary || ''}`
  const metrics = `${formatMs(averageDuration)} avg, ${formatMs(toFiniteNumber(group.totalDurationMs))} total, ${group.count || 0} occurrences, ${group.paintCount || 0} paints`
  return `<g data-row-label="${escapeXml(group.name || title)}" transform="translate(0 ${y})">
  <rect x="8" y="0" width="${DEFAULT_WIDTH - 16}" height="${groupHeight}" rx="6" ry="6" fill="#ffffff" stroke="#e2e8f0" />
  <text x="28" y="24" font-size="13" font-weight="600" fill="#0f172a"><title>${escapeXml(title)}</title>${index + 1}. ${escapeXml(truncate(title, 96))}</text>
  <text x="28" y="43" font-size="12" fill="#475569">${escapeXml(metrics)}</text>
  <text x="28" y="62" font-size="12" fill="#64748b">${escapeXml(sampleIndexesLabel)} start ${formatMs(toFiniteNumber(group.sampleStartMs))}, avg area ${formatArea(toFiniteNumber(group.averagePaintedArea))} px</text>
  <rect x="${BAR_X}" y="28" width="${barWidth}" height="14" rx="3" ry="3" fill="#111827" fill-opacity="0.78" />
  <text x="${BAR_X + barWidth + 8}" y="40" font-size="12" fill="#111827">${escapeXml(formatMs(averageDuration))}</text>
  ${getThumbnail(group, GROUP_TOP_PADDING)}
  ${getComponents(group, componentsY, maxComponentDuration)}
</g>`
}

export const createPaintEventsChart = (data: readonly PaintChartGroup[], options: any): string => {
  const width = options.width || DEFAULT_WIDTH
  const orderedData = [...data].sort(
    (a, b) =>
      toFiniteNumber(b.averageDurationMs) - toFiniteNumber(a.averageDurationMs) ||
      toFiniteNumber(b.totalDurationMs) - toFiniteNumber(a.totalDurationMs) ||
      (a.name || '').localeCompare(b.name || ''),
  )
  const maxDuration = Math.max(1, ...orderedData.map((group) => toFiniteNumber(group.averageDurationMs)))
  const maxComponentDuration = Math.max(1, ...orderedData.flatMap((group) => group.components || []).map((component) => toFiniteNumber(component.averageDurationMs)))
  const groupOffsets: number[] = []
  let offset = HEADER_HEIGHT
  for (const group of orderedData) {
    groupOffsets.push(offset)
    offset += getGroupHeight(group) + GROUP_GAP
  }
  const height = Math.max(80, offset)
  const groups = orderedData.map((group, index) => getGroup(group, index, groupOffsets[index], maxDuration, maxComponentDuration)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" fill="currentColor" font-family="system-ui, sans-serif" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible; background:white">
<title>Paint Events</title>
<text x="16" y="25" font-size="18" font-weight="700" fill="#0f172a">Paint Events</text>
<text x="150" y="25" font-size="12" fill="#475569">Grouped by inferred document paint kind, sorted by average paint duration</text>
${groups}
</svg>`
}
