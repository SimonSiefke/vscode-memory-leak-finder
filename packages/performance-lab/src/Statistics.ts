import type { ConfidenceInterval, MetricComparison, MetricStatistics } from './Types.ts'

const sorted = (values: readonly number[]): readonly number[] => {
  return [...values].sort((a, b) => a - b)
}

export const median = (values: readonly number[]): number => {
  if (values.length === 0) {
    return 0
  }
  const ordered = sorted(values)
  const middle = Math.floor(ordered.length / 2)
  if (ordered.length % 2 === 1) {
    return ordered[middle]
  }
  return (ordered[middle - 1] + ordered[middle]) / 2
}

export const percentile = (values: readonly number[], percentileValue: number): number => {
  if (values.length === 0) {
    return 0
  }
  const ordered = sorted(values)
  const index = Math.min(ordered.length - 1, Math.max(0, Math.ceil(percentileValue * ordered.length) - 1))
  return ordered[index]
}

export const getMetricStatistics = (values: readonly number[]): MetricStatistics => {
  const medianValue = median(values)
  const mad = median(values.map((value) => Math.abs(value - medianValue)))
  return {
    count: values.length,
    mad,
    median: medianValue,
    p95: percentile(values, 0.95),
    relativeMad: medianValue === 0 ? 0 : mad / medianValue,
  }
}

const createRandom = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

export const pairedBootstrapRelativeChange = (
  baseline: readonly number[],
  candidate: readonly number[],
  iterations = 2000,
  seed = 0x51f15e,
): ConfidenceInterval => {
  const count = Math.min(baseline.length, candidate.length)
  if (count === 0) {
    return {
      lower: 0,
      upper: 0,
    }
  }
  const random = createRandom(seed)
  const changes: number[] = []
  for (let iteration = 0; iteration < iterations; iteration++) {
    const sampledBaseline: number[] = []
    const sampledCandidate: number[] = []
    for (let index = 0; index < count; index++) {
      const sampledIndex = Math.floor(random() * count)
      sampledBaseline.push(baseline[sampledIndex])
      sampledCandidate.push(candidate[sampledIndex])
    }
    const baselineMedian = median(sampledBaseline)
    const candidateMedian = median(sampledCandidate)
    changes.push(baselineMedian === 0 ? 0 : candidateMedian / baselineMedian - 1)
  }
  return {
    lower: percentile(changes, 0.025),
    upper: percentile(changes, 0.975),
  }
}

export const compareMetric = (baseline: readonly number[], candidate: readonly number[]): MetricComparison => {
  const baselineStatistics = getMetricStatistics(baseline)
  const candidateStatistics = getMetricStatistics(candidate)
  return {
    baseline: baselineStatistics,
    candidate: candidateStatistics,
    confidenceInterval: pairedBootstrapRelativeChange(baseline, candidate),
    relativeChange: baselineStatistics.median === 0 ? 0 : candidateStatistics.median / baselineStatistics.median - 1,
  }
}
