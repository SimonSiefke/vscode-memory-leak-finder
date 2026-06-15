const ROW_HIGHLIGHT_STROKE = '#d32f2f'
const ROW_HIGHLIGHT_RADIUS = 10

type HighlightBlock = {
  readonly labels: string[]
  endIndex: number
  readonly startIndex: number
}

const escapeAttribute = (value: string): string => {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const getHighlightBlocks = (data: readonly any[], highlightedNames: ReadonlySet<string>) => {
  const blocks: HighlightBlock[] = []
  for (let i = 0; i < data.length; i++) {
    if (!highlightedNames.has(data[i].name)) {
      continue
    }
    const previousBlock = blocks[blocks.length - 1]
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

export const addRowHighlights = (svg: string, data: readonly any[], chartOptions: any, options: any): string => {
  const highlightedNames = new Set<string>(options.highlightLabels || [])
  if (highlightedNames.size === 0 || data.length === 0) {
    return svg
  }
  const rowHeight = chartOptions.height / data.length
  const blocks = getHighlightBlocks(data, highlightedNames)
  if (blocks.length === 0) {
    return svg
  }
  const rects = blocks
    .map((block) => {
      const y = block.startIndex * rowHeight
      const height = (block.endIndex - block.startIndex + 1) * rowHeight
      const label = escapeAttribute(block.labels.join('|'))
      return `<rect data-highlight-label="${label}" x="8" y="${y}" width="${chartOptions.width - 16}" height="${height}" rx="${ROW_HIGHLIGHT_RADIUS}" ry="${ROW_HIGHLIGHT_RADIUS}" />`
    })
    .join('')
  const overlay = `<g aria-label="fixed-row-highlights" fill="none" stroke="${ROW_HIGHLIGHT_STROKE}" stroke-width="3">${rects}</g>`
  return svg.replace('</svg>', `${overlay}</svg>`)
}
