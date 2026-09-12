import escapeHtml from 'escape-html'
import prettyBytes from 'pretty-bytes'

interface MemoryComparisonRow {
  readonly afterBytes: number
  readonly beforeBytes: number
  readonly deltaBytes: number
  readonly detail?: string
  readonly isInspected?: boolean
  readonly name: string
}

export function formatBytes(value: number): string {
  return prettyBytes(value, { binary: true })
}

function formatSignedBytes(value: number): string {
  return prettyBytes(value, { binary: true, signed: true }).trimStart()
}

const truncate = (value: string, limit: number): string => (value.length > limit ? `${value.slice(0, limit - 1)}…` : value)

export const createMemoryComparisonChart = (data: readonly MemoryComparisonRow[], options: any): string => {
  const rows = [...data]
  const width = options.width || 1400
  const labelWidth = 570
  const rightWidth = 220
  const plotWidth = width - labelWidth - rightWidth - 40
  const rowHeight = 34
  const headerHeight = 92
  const footerHeight = options.omittedEntryCount > 0 ? 28 : 0
  const height = headerHeight + Math.max(rows.length, 1) * rowHeight + footerHeight + 16
  const maximum = Math.max(1, ...rows.flatMap((row) => [row.beforeBytes, row.afterBytes]))
  const title = escapeHtml(options.title || 'Memory comparison')
  const subtitle = escapeHtml(options.subtitle || '')
  const body = rows
    .map((row, index) => {
      const y = headerHeight + index * rowHeight
      const beforeWidth = Math.max(0, (row.beforeBytes / maximum) * plotWidth)
      const afterWidth = Math.max(0, (row.afterBytes / maximum) * plotWidth)
      const delta = formatSignedBytes(row.deltaBytes)
      const tooltip = escapeHtml(
        `${row.name}\nBefore: ${formatBytes(row.beforeBytes)}\nAfter: ${formatBytes(row.afterBytes)}\nDelta: ${delta}${row.detail ? `\n${row.detail}` : ''}`,
      )
      const label = escapeHtml(truncate(row.name, 78))
      const outline = row.isInspected
        ? `<rect x="2" y="${y - 2}" width="${width - 4}" height="${rowHeight - 2}" rx="4" fill="none" stroke="#8b5cf6" stroke-width="2"/>`
        : ''
      const inspected = row.isInspected ? ' • inspected renderer' : ''
      return `<g data-row-label="${escapeHtml(row.name)}"><title>${tooltip}</title>${outline}<text x="12" y="${y + 14}" font-weight="${row.isInspected ? 700 : 400}">${label}${escapeHtml(inspected)}</text><rect x="${labelWidth}" y="${y + 3}" width="${beforeWidth}" height="10" rx="2" fill="#94a3b8"/><rect x="${labelWidth}" y="${y + 17}" width="${afterWidth}" height="10" rx="2" fill="#2563eb"/><text x="${width - rightWidth + 12}" y="${y + 19}" fill="${row.deltaBytes >= 0 ? '#b91c1c' : '#15803d'}" font-weight="600">${escapeHtml(delta)}</text></g>`
    })
    .join('')
  const empty = rows.length === 0 ? `<text x="12" y="${headerHeight + 20}" fill="#64748b">No comparable memory rows</text>` : ''
  const footer =
    options.omittedEntryCount > 0 ? `<text x="12" y="${height - 12}" fill="#64748b">${options.omittedEntryCount} rows omitted</text>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, sans-serif" font-size="12" style="background:white"><rect width="100%" height="100%" fill="white"/><text x="12" y="28" font-size="20" font-weight="700">${title}</text><text x="12" y="50" fill="#475569">${subtitle}</text><g transform="translate(${labelWidth},64)"><rect width="12" height="10" rx="2" fill="#94a3b8"/><text x="18" y="9">Before</text><rect x="72" width="12" height="10" rx="2" fill="#2563eb"/><text x="90" y="9">After</text></g>${body}${empty}${footer}</svg>`
}
