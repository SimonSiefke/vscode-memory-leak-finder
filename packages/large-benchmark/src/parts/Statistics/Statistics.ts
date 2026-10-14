export const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  if (!sorted.length) throw new Error('Cannot summarize an empty sample')
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

export const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length

export const summarize = (values: readonly number[]) => {
  if (!values.length || values.some((value) => !Number.isFinite(value))) throw new Error('Expected finite, nonempty samples')
  const sorted = [...values].sort((a, b) => a - b)
  const average = mean(values)
  return {
    count: values.length,
    mean: average,
    median: median(values),
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1]!,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    standardDeviation:
      values.length > 1 ? Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1)) : 0,
  }
}

export const comparePairs = (before: number[], after: number[], primary: 'mean' | 'median') => {
  if (before.length !== after.length) throw new Error('Comparison requires complete pairs')
  const statistic = primary === 'mean' ? mean : median
  const baseline = statistic(before)
  const candidate = statistic(after)
  let state = 0x12345678
  const random = (): number => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
  const differences = Array.from({ length: 10000 }, () => {
    const indices = before.map(() => Math.floor(random() * before.length))
    return statistic(indices.map((index) => after[index]!)) - statistic(indices.map((index) => before[index]!))
  }).sort((a, b) => a - b)
  const interval: [number, number] = [differences[249]!, differences[9749]!]
  return {
    before: summarize(before),
    after: summarize(after),
    primary,
    absoluteChange: candidate - baseline,
    percentChange: baseline === 0 ? null : ((candidate - baseline) / Math.abs(baseline)) * 100,
    interval,
    inconclusive: before.length < 5 || (interval[0] <= 0 && interval[1] >= 0),
    beforeSamples: before,
    afterSamples: after,
  }
}
