import type { Dynamic } from '../Types/Types.ts'

export interface FrontendStartupPerformanceMetric {
  readonly count: number
  readonly max: number
  readonly mean: number
  readonly median: number
  readonly min: number
  readonly name: string
  readonly unit: string
}

const metricNames = [
  'workbenchStartup',
  'workbenchCreateAndRestore',
  'responseEnd',
  'domInteractive',
  'domContentLoadedEventStart',
  'domContentLoadedEventEnd',
  'loadEventStart',
  'loadEventEnd',
  'duration',
  'first-paint',
  'first-contentful-paint',
]

const MillisecondPrecision = 1000

const round = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MillisecondPrecision) / MillisecondPrecision
}

const isValidMetricValue = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

const getMedian = (values: readonly number[]): number => {
  const middle = Math.floor(values.length / 2)
  if (values.length % 2 === 1) {
    return values[middle]
  }
  return (values[middle - 1] + values[middle]) / 2
}

const getMetric = (name: string, values: readonly number[]): FrontendStartupPerformanceMetric => {
  const sortedValues = [...values].sort((a, b) => a - b)
  const total = sortedValues.reduce((sum, value) => sum + value, 0)
  return {
    count: sortedValues.length,
    max: round(sortedValues[sortedValues.length - 1]),
    mean: round(total / sortedValues.length),
    median: round(getMedian(sortedValues)),
    min: round(sortedValues[0]),
    name,
    unit: 'ms',
  }
}

export const normalizeFrontendStartupPerformance = (samples: readonly Dynamic[]): readonly FrontendStartupPerformanceMetric[] => {
  const metrics: FrontendStartupPerformanceMetric[] = []
  for (const name of metricNames) {
    const values = samples.map((sample) => sample[name]).filter(isValidMetricValue)
    if (values.length > 0) {
      metrics.push(getMetric(name, values))
    }
  }
  return metrics
}

export const formatFrontendStartupPerformanceSummary = (metrics: readonly FrontendStartupPerformanceMetric[]): string => {
  if (metrics.length === 0) {
    return 'No frontend startup performance metrics were available'
  }
  const lines = ['Frontend startup performance:', 'metric | count | median | mean | min | max | unit']
  for (const metric of metrics) {
    lines.push(`${metric.name} | ${metric.count} | ${metric.median} | ${metric.mean} | ${metric.min} | ${metric.max} | ${metric.unit}`)
  }
  return lines.join('\n')
}
