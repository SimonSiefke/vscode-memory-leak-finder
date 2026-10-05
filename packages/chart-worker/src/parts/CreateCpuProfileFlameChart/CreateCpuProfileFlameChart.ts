interface CpuProfileFrame {
  readonly colorKey?: string
  readonly depth?: number
  readonly durationMs?: number
  readonly hitCount?: number
  readonly location?: string
  readonly name?: string
  readonly selfTimeMs?: number
  readonly startMs?: number
  readonly totalTimeMs?: number
}

interface NormalizedCpuProfileFrame {
  readonly colorKey: string
  readonly depth: number
  readonly durationMs: number
  readonly hitCount: number
  readonly location: string
  readonly name: string
  readonly selfTimeMs: number
  readonly startMs: number
  readonly totalTimeMs: number
}

interface CpuProfileFlameChartOptions {
  readonly headerHeight?: number
  readonly rowHeight?: number
  readonly width?: number
}

const DefaultWidth = 1400
const DefaultRowHeight = 18
const DefaultHeaderHeight = 72
const HorizontalPadding = 12
const BottomPadding = 18
const RectGap = 0.5
const MinLabelWidth = 34
const LabelCharacterWidth = 7
const AxisTickCount = 4

const escapeXml = (value: string): string => {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

const toNumber = (value: unknown): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const toString = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

const roundMetricValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

const normalizeFrame = (frame: CpuProfileFrame): NormalizedCpuProfileFrame => {
  const name = toString(frame.name) || '(anonymous)'
  const location = toString(frame.location)
  return {
    colorKey: toString(frame.colorKey) || location || name,
    depth: Math.max(0, Math.floor(toNumber(frame.depth))),
    durationMs: Math.max(0, toNumber(frame.durationMs)),
    hitCount: Math.max(0, Math.floor(toNumber(frame.hitCount))),
    location,
    name,
    selfTimeMs: Math.max(0, toNumber(frame.selfTimeMs)),
    startMs: Math.max(0, toNumber(frame.startMs)),
    totalTimeMs: Math.max(0, toNumber(frame.totalTimeMs)),
  }
}

const canMergeFrame = (a: NormalizedCpuProfileFrame, b: NormalizedCpuProfileFrame): boolean => {
  return (
    a.depth === b.depth &&
    a.name === b.name &&
    a.location === b.location &&
    a.colorKey === b.colorKey &&
    roundMetricValue(a.startMs + a.durationMs) === roundMetricValue(b.startMs)
  )
}

const mergeFrames = (frames: readonly NormalizedCpuProfileFrame[]): readonly NormalizedCpuProfileFrame[] => {
  const orderedFrames = [...frames].toSorted((a, b) => a.depth - b.depth || a.startMs - b.startMs || a.name.localeCompare(b.name))
  const mergedFrames: NormalizedCpuProfileFrame[] = []
  for (const frame of orderedFrames) {
    const previous = mergedFrames.at(-1)
    if (previous && canMergeFrame(previous, frame)) {
      mergedFrames[mergedFrames.length - 1] = {
        ...previous,
        durationMs: roundMetricValue(previous.durationMs + frame.durationMs),
        hitCount: previous.hitCount + frame.hitCount,
        selfTimeMs: roundMetricValue(Math.max(previous.selfTimeMs, frame.selfTimeMs)),
        totalTimeMs: roundMetricValue(Math.max(previous.totalTimeMs, frame.totalTimeMs)),
      }
      continue
    }
    mergedFrames.push(frame)
  }
  return mergedFrames
}

const hashString = (value: string): number => {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

const getFrameColor = (frame: NormalizedCpuProfileFrame): string => {
  const name = frame.name.toLowerCase()
  if (name === '(idle)') {
    return '#d8dee9'
  }
  if (name === '(program)') {
    return '#cfd8dc'
  }
  if (name.includes('garbage collector') || name.includes('gc')) {
    return '#b0bec5'
  }
  const hue = 25 + (hashString(frame.colorKey) % 275)
  return `hsl(${hue}, 55%, 72%)`
}

const getLabel = (name: string, width: number): string => {
  if (width < MinLabelWidth) {
    return ''
  }
  const maxCharacters = Math.floor((width - 8) / LabelCharacterWidth)
  if (maxCharacters <= 0) {
    return ''
  }
  if (name.length <= maxCharacters) {
    return name
  }
  if (maxCharacters <= 3) {
    return ''
  }
  return `${name.slice(0, maxCharacters - 3)}...`
}

const getTooltip = (frame: NormalizedCpuProfileFrame): string => {
  const locationLine = frame.location ? `\nLocation: ${frame.location}` : ''
  return `${frame.name}${locationLine}\nStart: ${roundMetricValue(frame.startMs)} ms\nDuration: ${roundMetricValue(frame.durationMs)} ms\nSelf: ${roundMetricValue(frame.selfTimeMs)} ms\nTotal: ${roundMetricValue(frame.totalTimeMs)} ms\nHits: ${frame.hitCount}`
}

const getScaleX = (maxTimeMs: number, plotWidth: number) => {
  if (maxTimeMs <= 0) {
    return () => HorizontalPadding
  }
  return (value: number): number => HorizontalPadding + (value / maxTimeMs) * plotWidth
}

const renderTicks = (maxTimeMs: number, width: number, headerHeight: number, scaleX: (value: number) => number): string => {
  const ticks = []
  for (let i = 0; i <= AxisTickCount; i++) {
    const value = roundMetricValue((maxTimeMs / AxisTickCount) * i)
    const x = roundMetricValue(scaleX(value))
    ticks.push(`<g class="CpuProfileTick">
  <line x1="${x}" x2="${x}" y1="${headerHeight - 18}" y2="${headerHeight - 6}" stroke="#9aa0a6" stroke-width="1" />
  <text x="${x}" y="${headerHeight - 24}" font-size="11" text-anchor="${i === 0 ? 'start' : i === AxisTickCount ? 'end' : 'middle'}" fill="#5f6368">${value} ms</text>
</g>`)
  }
  return `<line x1="${HorizontalPadding}" x2="${width - HorizontalPadding}" y1="${headerHeight - 6}" y2="${headerHeight - 6}" stroke="#dadce0" stroke-width="1" />${ticks.join('')}`
}

const renderFrames = (
  frames: readonly NormalizedCpuProfileFrame[],
  maxTimeMs: number,
  rowHeight: number,
  headerHeight: number,
  scaleX: (value: number) => number,
): string => {
  return frames
    .map((frame, index) => {
      const x = roundMetricValue(scaleX(frame.startMs))
      const endX = roundMetricValue(scaleX(frame.startMs + frame.durationMs))
      const width = Math.max(0, roundMetricValue(endX - x - RectGap))
      const y = headerHeight + frame.depth * rowHeight
      const height = Math.max(1, rowHeight - 1)
      const label = getLabel(frame.name, width)
      const text = label
        ? `<text x="${roundMetricValue(x + 4)}" y="${roundMetricValue(y + rowHeight - 5)}" font-size="11" fill="#202124">${escapeXml(label)}</text>`
        : ''
      const timePercent = maxTimeMs > 0 ? roundMetricValue((frame.durationMs / maxTimeMs) * 100) : 0
      return `<g class="CpuProfileFrame" data-frame="${index}">
  <title>${escapeXml(getTooltip(frame))}</title>
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="2" ry="2" fill="${getFrameColor(frame)}" stroke="#ffffff" stroke-width="0.5" />
  ${text}
  <desc>${escapeXml(frame.name)} ${timePercent}%</desc>
</g>`
    })
    .join('')
}

export const createCpuProfileFlameChart = (data: readonly CpuProfileFrame[], options: CpuProfileFlameChartOptions): string => {
  const width = options.width || DefaultWidth
  const rowHeight = options.rowHeight || DefaultRowHeight
  const headerHeight = options.headerHeight || DefaultHeaderHeight
  const frames = mergeFrames(data.map(normalizeFrame).filter((frame) => frame.durationMs > 0))
  const maxDepth = Math.max(0, ...frames.map((frame) => frame.depth))
  const maxTimeMs = roundMetricValue(Math.max(0, ...frames.map((frame) => frame.startMs + frame.durationMs)))
  const height = headerHeight + (maxDepth + 1) * rowHeight + BottomPadding
  const plotWidth = width - HorizontalPadding * 2
  const scaleX = getScaleX(maxTimeMs, plotWidth)
  const title = `CPU Profile Flame Chart (${frames.length} frames, ${maxTimeMs} ms)`

  return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="CpuProfileFlameChart" fill="currentColor" font-family="system-ui, sans-serif" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible; background:white">
<title>${escapeXml(title)}</title>
<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
<text x="${HorizontalPadding}" y="24" font-size="18" font-weight="600" fill="#202124">CPU Profile Flame Chart</text>
<text x="${HorizontalPadding}" y="45" font-size="12" fill="#5f6368">Total time ${maxTimeMs} ms | ${frames.length} merged frames</text>
${renderTicks(maxTimeMs, width, headerHeight, scaleX)}
${renderFrames(frames, maxTimeMs, rowHeight, headerHeight, scaleX)}
</svg>`
}
