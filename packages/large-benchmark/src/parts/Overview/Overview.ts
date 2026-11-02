import type { Comparison } from '../Report/Report.ts'

const escape = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const format = (value: number): string => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`

export const overviewGroups = [
  { id: 'duration', title: 'Scenario and startup duration', metric: (entry: Comparison) => entry.collector === 'timing' },
  {
    id: 'instructions',
    title: 'CPU instructions',
    metric: (entry: Comparison) => entry.collector === 'instructions' && entry.metric === 'instructions',
  },
  {
    id: 'cpu-time',
    title: 'Process-tree CPU time',
    metric: (entry: Comparison) => entry.collector === 'resources' && entry.metric === 'task-clock',
  },
  {
    id: 'style-time',
    title: 'Renderer style-recalculation time',
    metric: (entry: Comparison) => entry.collector === 'renderer' && entry.metric === 'styleDuration',
  },
] as const

export const overviewSvg = (entries: Comparison[], title: string): string => {
  const values = entries.flatMap((entry) => [
    ...(entry.statistics.percentInterval ?? []),
    ...(entry.statistics.percentChange === null ? [] : [entry.statistics.percentChange]),
  ])
  const low = Math.min(-1, ...values)
  const high = Math.max(1, ...values)
  const scale = (value: number) => 480 + ((value - low) / (high - low)) * 560
  const height = 105 + entries.length * 35
  const rows = entries
    .map((entry, index) => {
      const s = entry.statistics,
        y = 100 + index * 35
      const interval = s.percentInterval
      const uncertain = s.before.count < 5 || !interval || (interval[0] <= 0 && interval[1] >= 0)
      const color = uncertain ? '#697386' : s.percentChange! < 0 ? '#237a45' : '#b33d32'
      const details = `${entry.benchmark}: ${s.before.count} complete pairs; ${s.percentChange === null ? 'zero baseline, percentage unavailable' : format(s.percentChange)}; ${interval ? `95% paired CI ${interval.map(format).join(' to ')}` : 'percentage confidence interval unavailable'}`
      return `<g data-startup="${entry.startup}" data-collector="${entry.collector}" data-id="${escape(entry.benchmark)}" data-search="${escape(entry.metric)}"><title>${escape(details)}</title><a href="#${escape(entry.benchmark)}"><text x="12" y="${y + 4}">${escape(entry.benchmark.length > 61 ? entry.benchmark.slice(0, 58) + '…' : entry.benchmark)}</text></a>${interval ? `<line x1="${scale(interval[0])}" x2="${scale(interval[1])}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="3"/>` : ''}${s.percentChange === null ? '' : `<circle cx="${scale(s.percentChange)}" cy="${y}" r="4" fill="${color}"/>`}<text x="1060" y="${y + 4}" fill="${color}">${s.percentChange === null ? 'N/A' : format(s.percentChange)} (${s.before.count} pairs)</text></g>`
    })
    .join('')
  return `<svg data-overview="true" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1220 ${height}" width="1220" height="${height}" role="img" aria-label="${escape(title)}"><style>[hidden]{display:none}a{fill:#315abd}</style><rect width="100%" height="100%" fill="white"/><g font-family="system-ui,sans-serif" font-size="12" fill="#1b2538"><text x="12" y="25" font-size="18">${escape(title)}</text><text x="12" y="48">After versus before; paired-bootstrap 95% intervals; exploratory comparisons. Negative changes mean less time or work.</text><text x="480" y="72">${format(low)}</text><text x="${scale(0)}" y="72" text-anchor="middle">0%</text><text x="1040" y="72" text-anchor="end">${format(high)}</text><line x1="${scale(0)}" x2="${scale(0)}" y1="80" y2="${height}" stroke="#a7afba" stroke-dasharray="4 3"/>${rows}</g></svg>`
}
