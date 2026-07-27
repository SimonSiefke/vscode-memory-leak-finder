import { addOmittedEntriesFooter } from '../AddOmittedEntriesFooter/AddOmittedEntriesFooter.ts'

interface CodeSizeBreakdown {
  readonly bytecodeBytes?: number
  readonly instructionBytes?: number
  readonly metadataBytes?: number
  readonly totalBytes?: number
}

interface CompiledCodeChartRow {
  readonly after?: CodeSizeBreakdown
  readonly before?: CodeSizeBreakdown
  readonly delta?: CodeSizeBreakdown
  readonly name?: string
}

const HeaderHeight = 68
const RowHeight = 38
const BarHeight = 14
const BytecodeColor = '#2E7D32'
const InstructionColor = '#1565C0'
const MetadataColor = '#6D4C41'
const PositiveDeltaColor = '#B3261E'
const NegativeDeltaColor = '#137333'

const escapeXml = (value: string): string => {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

const getBytes = (value: number | undefined): number => {
  return Number.isFinite(value) ? value! : 0
}

const formatBytes = (value: number): string => {
  const absolute = Math.abs(value)
  if (absolute < 1024) {
    return `${Math.round(value)} B`
  }
  if (absolute < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KiB`
  }
  return `${(value / 1024 / 1024).toFixed(2)} MiB`
}

const formatDelta = (value: number): string => {
  if (value === 0) {
    return 'no change'
  }
  return `${value > 0 ? '+' : ''}${formatBytes(value)}`
}

const getBarWidth = (value: number, maxValue: number, plotWidth: number): number => {
  if (value <= 0 || maxValue <= 0) {
    return 0
  }
  return (value / maxValue) * plotWidth
}

const getLegendItem = (x: number, color: string, label: string): string => {
  return `<rect x="${x}" y="39" width="12" height="12" fill="${color}" /><text x="${x + 18}" y="49" font-size="11">${label}</text>`
}

export const createCompiledCodeSizeChart = (
  data: readonly CompiledCodeChartRow[],
  options: {
    readonly fontSize?: number
    readonly marginLeft?: number
    readonly marginRight?: number
    readonly omittedEntryCount?: number
    readonly title?: string
    readonly width?: number
  },
): string => {
  const orderedData = [...data].sort(
    (a, b) => getBytes(b.after?.totalBytes) - getBytes(a.after?.totalBytes) || (a.name || '').localeCompare(b.name || ''),
  )
  const width = options.width || 1600
  const fontSize = options.fontSize || 12
  const marginLeft = options.marginLeft || 560
  const marginRight = options.marginRight || 190
  const plotWidth = width - marginLeft - marginRight
  const maxValue = Math.max(1, ...orderedData.map((item) => getBytes(item.after?.totalBytes)))
  const height = Math.max(HeaderHeight + RowHeight, HeaderHeight + orderedData.length * RowHeight)
  const title = escapeXml(options.title || 'Compiled code size')

  const rows = orderedData
    .map((item, index) => {
      const name = escapeXml(item.name || 'Unknown')
      const bytecodeBytes = getBytes(item.after?.bytecodeBytes)
      const instructionBytes = getBytes(item.after?.instructionBytes)
      const metadataBytes = getBytes(item.after?.metadataBytes)
      const totalBytes = getBytes(item.after?.totalBytes)
      const beforeBytes = getBytes(item.before?.totalBytes)
      const deltaBytes = getBytes(item.delta?.totalBytes)
      const bytecodeWidth = getBarWidth(bytecodeBytes, maxValue, plotWidth)
      const instructionWidth = getBarWidth(instructionBytes, maxValue, plotWidth)
      const metadataWidth = getBarWidth(metadataBytes, maxValue, plotWidth)
      const totalWidth = bytecodeWidth + instructionWidth + metadataWidth
      const rowTop = HeaderHeight + index * RowHeight
      const barY = rowTop + 6
      const textY = barY + BarHeight - 2
      const deltaColor = deltaBytes > 0 ? PositiveDeltaColor : deltaBytes < 0 ? NegativeDeltaColor : '#5F6368'
      const tooltip = escapeXml(
        `${item.name || 'Unknown'}\nAfter: ${formatBytes(totalBytes)}\nBefore: ${formatBytes(beforeBytes)}\nChange: ${formatDelta(deltaBytes)}\nBytecode: ${formatBytes(bytecodeBytes)}\nInstructions: ${formatBytes(instructionBytes)}\nMetadata: ${formatBytes(metadataBytes)}`,
      )
      return `<g data-row-label="${name}"><title>${tooltip}</title>
  <text x="${marginLeft - 10}" y="${textY}" font-size="${fontSize}" text-anchor="end">${name}</text>
  <rect x="${marginLeft}" y="${barY}" width="${bytecodeWidth}" height="${BarHeight}" fill="${BytecodeColor}" />
  <rect x="${marginLeft + bytecodeWidth}" y="${barY}" width="${instructionWidth}" height="${BarHeight}" fill="${InstructionColor}" />
  <rect x="${marginLeft + bytecodeWidth + instructionWidth}" y="${barY}" width="${metadataWidth}" height="${BarHeight}" fill="${MetadataColor}" />
  <text x="${marginLeft + totalWidth + 6}" y="${textY}" font-size="${fontSize - 1}">${formatBytes(totalBytes)} <tspan fill="${deltaColor}">(${formatDelta(deltaBytes)})</tspan></text>
</g>`
    })
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" fill="currentColor" font-family="system-ui, sans-serif" font-size="${fontSize}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible; background:white"><title>${title}</title><text x="8" y="23" font-size="16" font-weight="600">${title}</text>${getLegendItem(8, BytecodeColor, 'Bytecode')}${getLegendItem(108, InstructionColor, 'Native instructions')}${getLegendItem(264, MetadataColor, 'Metadata')}${rows}</svg>`
  return addOmittedEntriesFooter(svg, options)
}
