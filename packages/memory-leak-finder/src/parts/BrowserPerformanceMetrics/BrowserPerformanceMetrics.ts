export interface BrowserPerformanceMetric {
  readonly name: string
  readonly value: number
}

export interface BrowserPerformanceMetricsSample {
  readonly metrics: readonly BrowserPerformanceMetric[]
}

export interface BrowserPerformanceCounterRow {
  readonly after: number | null
  readonly available: boolean
  readonly before: number | null
  readonly cdpNames: readonly string[]
  readonly delta: number | null
  readonly name: string
  readonly unit: string
}

interface MetricSpec {
  readonly cdpNames: readonly string[]
  readonly multiplier: number
  readonly name: string
  readonly unit: string
}

const SecondToMillisecond = 1000
const MillisecondPrecision = 1000

const metricSpecs: readonly MetricSpec[] = [
  {
    cdpNames: ['PaintCount'],
    multiplier: 1,
    name: 'paintCount',
    unit: 'count',
  },
  {
    cdpNames: ['LayoutCount'],
    multiplier: 1,
    name: 'layoutCount',
    unit: 'count',
  },
  {
    cdpNames: ['RecalcStyleCount'],
    multiplier: 1,
    name: 'recalcStyleCount',
    unit: 'count',
  },
  {
    cdpNames: ['MajorGCDuration', 'MinorGCDuration'],
    multiplier: SecondToMillisecond,
    name: 'gcDurationMs',
    unit: 'ms',
  },
  {
    cdpNames: ['LayoutDuration'],
    multiplier: SecondToMillisecond,
    name: 'layoutDurationMs',
    unit: 'ms',
  },
  {
    cdpNames: ['RecalcStyleDuration'],
    multiplier: SecondToMillisecond,
    name: 'recalcStyleDurationMs',
    unit: 'ms',
  },
  {
    cdpNames: ['ScriptDuration'],
    multiplier: SecondToMillisecond,
    name: 'scriptDurationMs',
    unit: 'ms',
  },
  {
    cdpNames: ['TaskDuration'],
    multiplier: SecondToMillisecond,
    name: 'taskDurationMs',
    unit: 'ms',
  },
]

const toMetricMap = (sample: BrowserPerformanceMetricsSample): Map<string, number> => {
  const map = new Map<string, number>()
  for (const metric of sample.metrics || []) {
    map.set(metric.name, metric.value)
  }
  return map
}

const getMetricValue = (metricMap: Map<string, number>, spec: MetricSpec): number | undefined => {
  let total = 0
  for (const cdpName of spec.cdpNames) {
    const value = metricMap.get(cdpName)
    if (value === undefined) {
      return undefined
    }
    total += value
  }
  return roundMetricValue(total * spec.multiplier)
}

const roundMetricValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MillisecondPrecision) / MillisecondPrecision
}

export const normalizeBrowserPerformanceMetrics = (
  before: BrowserPerformanceMetricsSample,
  after: BrowserPerformanceMetricsSample,
): readonly BrowserPerformanceCounterRow[] => {
  const beforeMap = toMetricMap(before)
  const afterMap = toMetricMap(after)
  return metricSpecs.map((spec) => {
    const beforeValue = getMetricValue(beforeMap, spec)
    const afterValue = getMetricValue(afterMap, spec)
    const available = beforeValue !== undefined && afterValue !== undefined
    return {
      after: available ? afterValue : null,
      available,
      before: available ? beforeValue : null,
      cdpNames: spec.cdpNames,
      delta: available ? roundMetricValue(afterValue - beforeValue) : null,
      name: spec.name,
      unit: spec.unit,
    }
  })
}

export const formatBrowserPerformanceMetricsSummary = (rows: readonly BrowserPerformanceCounterRow[]): string => {
  const availableRows = rows.filter((row) => row.available)
  if (availableRows.length === 0) {
    return 'No browser performance counters were available'
  }
  const lines = ['Browser performance counters:', 'metric | before | after | delta | unit']
  for (const row of availableRows) {
    lines.push(`${row.name} | ${row.before} | ${row.after} | ${row.delta} | ${row.unit}`)
  }
  return lines.join('\n')
}
