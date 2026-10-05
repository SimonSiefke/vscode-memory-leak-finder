import type { BrowserPerformanceMetricsSample } from '../BrowserPerformanceMetrics/BrowserPerformanceMetrics.ts'

export interface JavascriptExecutionTimeRow {
  readonly after: number | null
  readonly available: boolean
  readonly before: number | null
  readonly cdpName: string
  readonly delta: number | null
  readonly name: string
  readonly unit: string
}

interface MetricSpec {
  readonly cdpName: string
  readonly name: string
  readonly unit: string
}

const SecondToMillisecond = 1000
const MillisecondPrecision = 1000

const metricSpecs: readonly MetricSpec[] = [
  {
    cdpName: 'ScriptDuration',
    name: 'scriptDurationMs',
    unit: 'ms',
  },
  {
    cdpName: 'TaskDuration',
    name: 'taskDurationMs',
    unit: 'ms',
  },
]

const roundMetricValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MillisecondPrecision) / MillisecondPrecision
}

const toMetricMap = (sample: BrowserPerformanceMetricsSample): Map<string, number> => {
  const map = new Map<string, number>()
  for (const metric of sample.metrics || []) {
    map.set(metric.name, metric.value)
  }
  return map
}

const getMetricValue = (metricMap: Map<string, number>, spec: MetricSpec): number | undefined => {
  const value = metricMap.get(spec.cdpName)
  if (value === undefined) {
    return undefined
  }
  return roundMetricValue(value * SecondToMillisecond)
}

export const normalizeJavascriptExecutionTime = (
  before: BrowserPerformanceMetricsSample,
  after: BrowserPerformanceMetricsSample,
): readonly JavascriptExecutionTimeRow[] => {
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
      cdpName: spec.cdpName,
      delta: available ? roundMetricValue(afterValue - beforeValue) : null,
      name: spec.name,
      unit: spec.unit,
    }
  })
}

export const formatJavascriptExecutionTimeSummary = (rows: readonly JavascriptExecutionTimeRow[]): string => {
  const availableRows = rows.filter((row) => row.available)
  if (availableRows.length === 0) {
    return 'No JavaScript execution time metrics were available'
  }
  const lines = ['JavaScript execution time:', 'metric | before | after | delta | unit']
  for (const row of availableRows) {
    lines.push(`${row.name} | ${row.before} | ${row.after} | ${row.delta} | ${row.unit}`)
  }
  return lines.join('\n')
}
