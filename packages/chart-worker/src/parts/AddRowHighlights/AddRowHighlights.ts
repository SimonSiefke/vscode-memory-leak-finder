const ROW_HIGHLIGHT_STROKE = '#d32f2f'
const ROW_HIGHLIGHT_STROKE_WIDTH = 3
const ROW_HIGHLIGHT_RADIUS = 10
const ROW_HIGHLIGHT_GAP = 1
const SVG_HEIGHT_REGEX = /^<svg\b[^>]*\bheight="(\d+(?:\.\d+)?)"/
const TRANSLATE_Y_REGEX = /\btransform="translate\(\s*-?\d+(?:\.\d+)?\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*\)"/
const Y_AXIS_TICK_LABEL_GROUP_REGEX = /<g\b(?=[^>]*\baria-label="y-axis tick label")[^>]*>[\s\S]*?<\/g>/
const TEXT_TAG_REGEX = /<text\b[^>]*>/g

type HighlightBlock = {
  readonly labels: string[]
  endIndex: number
  readonly startIndex: number
}

type RowBounds = {
  readonly end: number
  readonly start: number
}

const escapeAttribute = (value: string): string => {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

const getHighlightBlocks = (data: readonly any[], highlightedNames: ReadonlySet<string>) => {
  const blocks: HighlightBlock[] = []
  for (let i = 0; i < data.length; i++) {
    if (!highlightedNames.has(data[i].name)) {
      continue
    }
    const previousBlock = blocks.at(-1)
    if (previousBlock && previousBlock.endIndex === i - 1) {
      previousBlock.endIndex = i
      previousBlock.labels.push(data[i].name)
      continue
    }
    blocks.push({
      endIndex: i,
      labels: [data[i].name],
      startIndex: i,
    })
  }
  return blocks
}

const getRenderedHeight = (svg: string, fallbackHeight: number): number => {
  const match = svg.match(SVG_HEIGHT_REGEX)
  if (!match) {
    return fallbackHeight
  }
  const height = Number(match[1])
  return Number.isFinite(height) ? height : fallbackHeight
}

const getTranslateY = (tag: string): number | undefined => {
  const match = tag.match(TRANSLATE_Y_REGEX)
  if (!match) {
    return undefined
  }
  const y = Number(match[1])
  return Number.isFinite(y) ? y : undefined
}

const getRenderedRowCenters = (svg: string, dataLength: number): readonly number[] | undefined => {
  const group = svg.match(Y_AXIS_TICK_LABEL_GROUP_REGEX)?.[0]
  if (!group) {
    return undefined
  }
  const groupTag = group.match(/^<g\b[^>]*>/)?.[0]
  const groupY = groupTag ? getTranslateY(groupTag) || 0 : 0
  const centers = [...group.matchAll(TEXT_TAG_REGEX)]
    .map((match) => getTranslateY(match[0]))
    .filter((value): value is number => value !== undefined)
    .map((value) => value + groupY)
  return centers.length === dataLength ? centers : undefined
}

const getRowBounds = (svg: string, dataLength: number, renderedHeight: number): readonly RowBounds[] => {
  const centers = getRenderedRowCenters(svg, dataLength)
  if (!centers || centers.length === 1) {
    const rowHeight = renderedHeight / dataLength
    return Array.from({ length: dataLength }, (_, index) => ({
      end: (index + 1) * rowHeight,
      start: index * rowHeight,
    }))
  }
  return centers.map((center, index) => ({
    end:
      index === centers.length - 1
        ? Math.min(renderedHeight, center + (center - centers[index - 1]) / 2)
        : (center + centers[index + 1]) / 2,
    start: index === 0 ? Math.max(0, center - (centers[1] - center) / 2) : (centers[index - 1] + center) / 2,
  }))
}

export const addRowHighlights = (svg: string, data: readonly any[], chartOptions: any, options: any): string => {
  const highlightedNames = new Set<string>(options.highlightLabels || [])
  if (highlightedNames.size === 0 || data.length === 0) {
    return svg
  }
  const renderedHeight = getRenderedHeight(svg, chartOptions.height)
  const rowBounds = getRowBounds(svg, data.length, renderedHeight)
  const blocks = getHighlightBlocks(data, highlightedNames)
  if (blocks.length === 0) {
    return svg
  }
  const rects = blocks
    .map((block) => {
      const outerStart = rowBounds[block.startIndex].start + ROW_HIGHLIGHT_GAP
      const outerEnd = rowBounds[block.endIndex].end - ROW_HIGHLIGHT_GAP
      const y = outerStart + ROW_HIGHLIGHT_STROKE_WIDTH / 2
      const height = outerEnd - outerStart - ROW_HIGHLIGHT_STROKE_WIDTH
      const label = escapeAttribute(block.labels.join('|'))
      return `<rect data-highlight-label="${label}" x="8" y="${y}" width="${chartOptions.width - 16}" height="${height}" rx="${ROW_HIGHLIGHT_RADIUS}" ry="${ROW_HIGHLIGHT_RADIUS}" />`
    })
    .join('')
  const overlay = `<g aria-label="fixed-row-highlights" fill="none" stroke="${ROW_HIGHLIGHT_STROKE}" stroke-width="${ROW_HIGHLIGHT_STROKE_WIDTH}">${rects}</g>`
  return svg.replace('</svg>', `${overlay}</svg>`)
}
