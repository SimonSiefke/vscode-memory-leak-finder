import type { Dynamic } from '../Types/Types.ts'

export interface CssSelectorStatsMetrics {
  readonly invalidationCount: number
  readonly matchAttempts: number
  readonly matchCount: number
  readonly styleRecalculationCount: number
  readonly totalElapsedMs: number
}

export interface CssSelectorStatsRow {
  readonly elapsedMs: number
  readonly invalidationCount: number
  readonly matchAttempts: number
  readonly matchCount: number
  readonly selector: string
  readonly styleSheetId: string
}

export interface CssSelectorStatsSummary {
  readonly metrics: CssSelectorStatsMetrics
  readonly topSelectors: readonly CssSelectorStatsRow[]
}

const MicrosecondToMillisecond = 1000
const MillisecondPrecision = 1000
const MaxTopSelectors = 20

const roundMetricValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MillisecondPrecision) / MillisecondPrecision
}

const toNumber = (value: Dynamic): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const toString = (value: Dynamic): string => {
  return typeof value === 'string' ? value : ''
}

const getSelectorTimings = (event: Dynamic): readonly Dynamic[] => {
  const selectorTimings = event?.args?.selector_stats?.selector_timings
  return Array.isArray(selectorTimings) ? selectorTimings : []
}

const getSelectorKey = (selector: string, styleSheetId: string): string => {
  return `${styleSheetId}\0${selector}`
}

export const getCssSelectorStats = (events: readonly Dynamic[]): CssSelectorStatsSummary => {
  const selectorMap = new Map<string, CssSelectorStatsRow>()
  let invalidationCount = 0
  let matchAttempts = 0
  let matchCount = 0
  let totalElapsedMs = 0
  let styleRecalculationCount = 0

  for (const event of events) {
    if (event?.name !== 'SelectorStats') {
      continue
    }
    styleRecalculationCount++
    for (const timing of getSelectorTimings(event)) {
      const selector = toString(timing.selector)
      const styleSheetId = toString(timing.style_sheet_id)
      const elapsedMs = roundMetricValue(toNumber(timing['elapsed (us)']) / MicrosecondToMillisecond)
      const timingInvalidationCount = toNumber(timing.invalidation_count)
      const timingMatchAttempts = toNumber(timing.match_attempts)
      const timingMatchCount = toNumber(timing.match_count)

      invalidationCount += timingInvalidationCount
      matchAttempts += timingMatchAttempts
      matchCount += timingMatchCount
      totalElapsedMs = roundMetricValue(totalElapsedMs + elapsedMs)

      const key = getSelectorKey(selector, styleSheetId)
      const existing = selectorMap.get(key)
      selectorMap.set(key, {
        elapsedMs: roundMetricValue((existing?.elapsedMs || 0) + elapsedMs),
        invalidationCount: (existing?.invalidationCount || 0) + timingInvalidationCount,
        matchAttempts: (existing?.matchAttempts || 0) + timingMatchAttempts,
        matchCount: (existing?.matchCount || 0) + timingMatchCount,
        selector,
        styleSheetId,
      })
    }
  }

  const topSelectors = [...selectorMap.values()]
    .toSorted((a, b) => b.elapsedMs - a.elapsedMs || b.matchAttempts - a.matchAttempts || a.selector.localeCompare(b.selector))
    .slice(0, MaxTopSelectors)

  return {
    metrics: {
      invalidationCount,
      matchAttempts,
      matchCount,
      styleRecalculationCount,
      totalElapsedMs,
    },
    topSelectors,
  }
}

export const formatCssSelectorStatsSummary = ({ metrics, topSelectors }: CssSelectorStatsSummary): string => {
  const lines = [
    'CSS selector stats:',
    `styleRecalculationCount | ${metrics.styleRecalculationCount}`,
    `totalElapsedMs | ${metrics.totalElapsedMs}`,
    `matchAttempts | ${metrics.matchAttempts}`,
    `matchCount | ${metrics.matchCount}`,
    `invalidationCount | ${metrics.invalidationCount}`,
  ]
  if (topSelectors.length > 0) {
    lines.push('selector | elapsedMs | matchAttempts | matchCount | invalidationCount')
    for (const row of topSelectors.slice(0, 10)) {
      lines.push(`${row.selector} | ${row.elapsedMs} | ${row.matchAttempts} | ${row.matchCount} | ${row.invalidationCount}`)
    }
  }
  return lines.join('\n')
}
