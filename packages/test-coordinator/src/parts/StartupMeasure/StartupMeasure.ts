interface AggregateMetric {
  readonly count: number
  readonly max: number
  readonly mean: number
  readonly median: number
  readonly min: number
  readonly name: string
  readonly unit: string
}

interface MetricRow {
  readonly name: string
  readonly unit: string
  readonly value: number | null
}

export interface StartupMeasureInfo {
  readonly label: string
  readonly resultId: string
}

const measures: Record<string, StartupMeasureInfo> = {
  cpuPerformanceCountersFromStart: {
    label: 'CPU performance counters from start',
    resultId: 'cpuPerformanceCountersFromStart',
  },
  'cpu-performance-counters-from-start': {
    label: 'CPU performance counters from start',
    resultId: 'cpuPerformanceCountersFromStart',
  },
  linuxProcessTreeResourcesFromStart: {
    label: 'Linux process-tree resources from start',
    resultId: 'linuxProcessTreeResourcesFromStart',
  },
  'linux-process-tree-resources-from-start': {
    label: 'Linux process-tree resources from start',
    resultId: 'linuxProcessTreeResourcesFromStart',
  },
}

const round = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

const getMedian = (values: readonly number[]): number => {
  const middle = Math.floor(values.length / 2)
  if (values.length % 2 === 1) {
    return values[middle]
  }
  return (values[middle - 1] + values[middle]) / 2
}

const getAggregateMetric = (rows: readonly MetricRow[], name: string, unit: string): AggregateMetric | undefined => {
  const values = rows
    .filter((row) => row.name === name && row.unit === unit && typeof row.value === 'number' && Number.isFinite(row.value))
    .map((row) => row.value as number)
    .sort((a, b) => a - b)
  if (values.length === 0) {
    return undefined
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  return {
    count: values.length,
    max: round(values[values.length - 1]),
    mean: round(total / values.length),
    median: round(getMedian(values)),
    min: round(values[0]),
    name,
    unit,
  }
}

export const getStartupMeasureInfo = (measure: string): StartupMeasureInfo | undefined => {
  return measures[measure]
}

export const getStartupMeasureAggregate = (samples: readonly any[], info: StartupMeasureInfo) => {
  const rows = samples.flatMap((sample): readonly MetricRow[] => {
    if (Array.isArray(sample.metrics)) {
      return sample.metrics
    }
    return [
      { name: 'instructions', unit: 'count', value: sample.instructions },
      { name: 'cycles', unit: 'count', value: sample.cycles },
      { name: 'instructionsPerCycle', unit: 'ratio', value: sample.instructionsPerCycle },
    ]
  })
  const metricKeys = new Map<string, MetricRow>()
  for (const row of rows) {
    if (typeof row.name === 'string' && typeof row.unit === 'string') {
      metricKeys.set(`${row.name}\0${row.unit}`, row)
    }
  }
  const metrics = [...metricKeys.values()]
    .map((row) => getAggregateMetric(rows, row.name, row.unit))
    .filter((metric): metric is AggregateMetric => metric !== undefined)
  const lines = [`${info.label}:`, 'metric | count | median | mean | min | max | unit']
  for (const metric of metrics) {
    lines.push(`${metric.name} | ${metric.count} | ${metric.median} | ${metric.mean} | ${metric.min} | ${metric.max} | ${metric.unit}`)
  }
  return {
    [info.resultId]: {
      isLeak: false,
      metrics,
      samples,
    },
    isLeak: false,
    samples,
    summary: metrics.length === 0 ? `No ${info.label.toLowerCase()} were available` : lines.join('\n'),
  }
}
