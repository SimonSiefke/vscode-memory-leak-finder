import { getCssSelectorStats, stopRecording, traceWindow, type Session } from '../Shared/Shared.ts'
import { UnavailableError, type Metric, type SelectorStatsRow } from '../Types/Types.ts'

// The invalidation tracking category enables Chromium's per-selector instrumentation.
export const cssTraceCategories =
  '-*,devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-blink.debug,disabled-by-default-devtools.timeline.invalidationTracking,blink.console'

export const analyzeSelectorTrace = (events: any[]): { metrics: Metric[]; selectors: SelectorStatsRow[] } => {
  const window = traceWindow(events, true)
  const stats = window.filter((event: any) => event.name === 'SelectorStats')
  if (!stats.length) throw new UnavailableError('Startup trace has no CSS selector statistics; instrumentation may be unsupported')
  // Chromium emits empty SelectorStats spans when no selectors were attempted.
  // They are valid, but cannot alone prove that the instrumentation is supported.
  const timings = stats.flatMap((event: any) => {
    const payload = event.args?.selector_stats
    if (payload === undefined) return []
    if (!Array.isArray(payload.selector_timings)) throw new UnavailableError('Unsupported CSS selector statistics format')
    return payload.selector_timings
  })
  if (!timings.length) throw new UnavailableError('Startup trace has no CSS selector timing rows')
  if (
    timings.some(
      (row: any) =>
        !row ||
        typeof row.selector !== 'string' ||
        ['elapsed (us)', 'match_attempts', 'match_count'].some((key) => !Number.isFinite(row[key]) || row[key] < 0),
    )
  )
    throw new UnavailableError('Unsupported CSS selector timing format')
  // Stylesheet IDs change between processes/builds. Aggregate identical selector text
  // across sheets before comparing, and retain every row until chart ranking.
  const normalized = stats.map((event: any) => ({
    ...event,
    args: {
      selector_stats: {
        selector_timings: (event.args?.selector_stats?.selector_timings ?? []).map((timing: any) => ({ ...timing, style_sheet_id: '' })),
      },
    },
  }))
  const summary = getCssSelectorStats(normalized, Infinity)
  const hasInvalidations = timings.every((row: any) => Number.isFinite(row.invalidation_count) && row.invalidation_count >= 0)
  const metrics: Metric[] = Object.entries(summary.metrics)
    .filter(([name]) => name !== 'invalidationCount' || hasInvalidations)
    .map(([name, value]) => ({
      name,
      value: value as number,
      unit: name === 'totalElapsedMs' ? 'ms' : 'count',
      coverage: 'workbench renderer startup to readiness; CSS selector instrumentation enabled; all selectors',
    }))
  if (timings.every((row: any) => Number.isFinite(row.fast_reject_count) && row.fast_reject_count >= 0))
    metrics.push({
      name: 'fastRejectCount',
      unit: 'count',
      value: timings.reduce((sum: number, row: any) => sum + row.fast_reject_count, 0),
      coverage: metrics[0]!.coverage,
    })
  return { metrics, selectors: summary.topSelectors }
}

export const collectSelectorStats = async (main: Session, path: string) => analyzeSelectorTrace(await stopRecording(main, path))
