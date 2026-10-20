import { mean, median } from '../Statistics/Statistics.ts'
import type { Result, Sample } from '../Types/Types.ts'

const escape = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
const format = (value: number): string => value.toLocaleString('en-US', { maximumFractionDigits: 3 })

export const selectorStatistics = (result: Result) => {
  const valid = (sample: Sample): boolean => ['success', 'partial'].includes(sample.status) && Array.isArray(sample.selectorStats)
  const pairs = Array.from({ length: result.requestedSamples }, (_, pair) => {
    const before = result.samples.find((sample) => sample.pair === pair && sample.revision === 'before' && valid(sample))
    const after = result.samples.find((sample) => sample.pair === pair && sample.revision === 'after' && valid(sample))
    return before && after ? ([before, after] as const) : null
  }).filter((pair) => pair !== null)
  const maps = pairs.map((pair) => pair.map((sample) => new Map(sample.selectorStats!.map((row) => [row.selector, row]))))
  const selectors = new Set(maps.flatMap((pair) => pair.flatMap((map) => [...map.keys()])))
  const summarize = (selector: string, revision: number) => ({
    // Absence in a complete trace contributes zero; missing traces never do.
    elapsedMs: median(maps.map((pair) => pair[revision]!.get(selector)?.elapsedMs ?? 0)),
    matchAttempts: mean(maps.map((pair) => pair[revision]!.get(selector)?.matchAttempts ?? 0)),
    matchCount: mean(maps.map((pair) => pair[revision]!.get(selector)?.matchCount ?? 0)),
  })
  return {
    pairs: pairs.length,
    rows: [...selectors].map((selector) => ({ selector, before: summarize(selector, 0), after: summarize(selector, 1) })),
  }
}

export const selectorComparisons = (result: Result) => {
  const statistics = selectorStatistics(result)
  const rows = statistics.rows
    .map((row) => ({ selector: row.selector, before: row.before.elapsedMs, after: row.after.elapsedMs }))
    .sort((a, b) => Math.max(b.before, b.after) - Math.max(a.before, a.after) || a.selector.localeCompare(b.selector))
    .slice(0, 3000)
  return { pairs: statistics.pairs, totalSelectors: statistics.rows.length, rows }
}

export const selectorDetailsSvg = (result: Result, limit = 3000): string => {
  const comparison = selectorComparisons(result)
  const { pairs, totalSelectors } = comparison
  const rows = comparison.rows.slice(0, limit)
  const height = 150 + rows.length * 48
  const max = Math.max(0, ...rows.flatMap((row) => [row.before, row.after])) || 1
  const bars = rows
    .map((row, index) => {
      const y = 130 + index * 48
      return `<g><title>${escape(row.selector)}\nBefore: ${format(row.before)} ms\nAfter: ${format(row.after)} ms</title><text x="15" y="${y + 17}">${escape(row.selector.length > 90 ? row.selector.slice(0, 87) + '…' : row.selector)}</text>${(['before', 'after'] as const).map((revision, i) => `<rect x="670" y="${y + i * 19}" width="${(row[revision] / max) * 580}" height="15" fill="${i ? '#a253ca' : '#5479e8'}"/><text x="${680 + (row[revision] / max) * 580}" y="${y + i * 19 + 12}">${format(row[revision])}</text>`).join('')}</g>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="${height}" viewBox="0 0 1400 ${height}" role="img" aria-label="CSS selector before and after comparison"><rect width="100%" height="100%" fill="white"/><g font-family="system-ui,sans-serif" font-size="12" fill="#1b2538"><text x="15" y="28" font-size="20">${limit === 1000 ? 'Slowest CSS selectors' : 'CSS selector details'} · elapsed matching time (ms)</text><text x="15" y="52">Top ${rows.length} of ${totalSelectors} selectors; slowest median on either revision first; ${pairs} complete pairs</text><text x="15" y="74">Median per selector; identical selector text combined across stylesheets; hover for full selector and values.</text><text x="15" y="98" fill="#5479e8">Before: ${escape(result.commits.before)}</text><text x="700" y="98" fill="#a253ca">After: ${escape(result.commits.after)}</text>${bars}</g></svg>`
}
