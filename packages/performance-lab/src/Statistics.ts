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
    p90: percentile(values, 0.9),
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
  const logEffects = baseline
    .slice(0, count)
    .map((value, index) => (value > 0 && candidate[index] > 0 ? Math.log(candidate[index]) - Math.log(value) : 0))
  const changes: number[] = []
  for (let iteration = 0; iteration < iterations; iteration++) {
    const sampledEffects: number[] = []
    for (let index = 0; index < count; index++) {
      const sampledIndex = Math.floor(random() * count)
      sampledEffects.push(logEffects[sampledIndex])
    }
    changes.push(Math.exp(median(sampledEffects)) - 1)
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

interface PositionedValue {
  readonly blockIndex: number
  readonly value: number
}

const groupByBlock = (values: readonly PositionedValue[]): Map<number, readonly number[]> => {
  const grouped = new Map<number, number[]>()
  for (const item of values) {
    const block = grouped.get(item.blockIndex) || []
    block.push(item.value)
    grouped.set(item.blockIndex, block)
  }
  return grouped
}

export const getBlockLogEffects = (baseline: readonly PositionedValue[], candidate: readonly PositionedValue[]): readonly number[] => {
  const baselineByBlock = groupByBlock(baseline)
  const candidateByBlock = groupByBlock(candidate)
  const blockIndices = [...new Set([...baselineByBlock.keys(), ...candidateByBlock.keys()])].toSorted((a, b) => a - b)
  return blockIndices.map((blockIndex) => {
    const baselineValues = baselineByBlock.get(blockIndex) || []
    const candidateValues = candidateByBlock.get(blockIndex) || []
    if (baselineValues.length !== 2 || candidateValues.length !== 2) {
      throw new Error(`ABBA block ${blockIndex} must contain exactly two baseline and two candidate samples`)
    }
    if ([...baselineValues, ...candidateValues].some((value) => value <= 0 || !Number.isFinite(value))) {
      throw new Error(`ABBA block ${blockIndex} contains a non-positive metric`)
    }
    const baselineMean = (Math.log(baselineValues[0]) + Math.log(baselineValues[1])) / 2
    const candidateMean = (Math.log(candidateValues[0]) + Math.log(candidateValues[1])) / 2
    return candidateMean - baselineMean
  })
}

const bootstrapLogEffects = (effects: readonly number[], iterations: number, random: () => number): ConfidenceInterval => {
  if (effects.length === 0) {
    return {
      lower: 0,
      upper: 0,
    }
  }
  const changes: number[] = []
  for (let iteration = 0; iteration < iterations; iteration++) {
    const sampled: number[] = []
    for (let index = 0; index < effects.length; index++) {
      sampled.push(effects[Math.floor(random() * effects.length)])
    }
    changes.push(Math.exp(median(sampled)) - 1)
  }
  return {
    lower: percentile(changes, 0.025),
    upper: percentile(changes, 0.975),
  }
}

export const compareBlockedMetric = (
  baseline: readonly PositionedValue[],
  candidate: readonly PositionedValue[],
  iterations = 4000,
  seed = 0x51f15e,
): MetricComparison => {
  const baselineValues = baseline.map(({ value }) => value)
  const candidateValues = candidate.map(({ value }) => value)
  const effects = getBlockLogEffects(baseline, candidate)
  return {
    baseline: getMetricStatistics(baselineValues),
    candidate: getMetricStatistics(candidateValues),
    confidenceInterval: bootstrapLogEffects(effects, iterations, createRandom(seed)),
    relativeChange: Math.exp(median(effects)) - 1,
  }
}

export const hierarchicalBootstrapRelativeChange = (
  replicaEffects: readonly (readonly number[])[],
  iterations = 8000,
  seed = 0x1cedc0de,
): ConfidenceInterval => {
  const nonEmptyReplicas = replicaEffects.filter((effects) => effects.length > 0)
  if (nonEmptyReplicas.length === 0) {
    return {
      lower: 0,
      upper: 0,
    }
  }
  const random = createRandom(seed)
  const changes: number[] = []
  for (let iteration = 0; iteration < iterations; iteration++) {
    const sampledEffects: number[] = []
    for (let replicaIndex = 0; replicaIndex < nonEmptyReplicas.length; replicaIndex++) {
      const replica = nonEmptyReplicas[Math.floor(random() * nonEmptyReplicas.length)]
      for (let blockIndex = 0; blockIndex < replica.length; blockIndex++) {
        sampledEffects.push(replica[Math.floor(random() * replica.length)])
      }
    }
    changes.push(Math.exp(median(sampledEffects)) - 1)
  }
  return {
    lower: percentile(changes, 0.025),
    upper: percentile(changes, 0.975),
  }
}
