import { expect, test } from '@jest/globals'
import { compareMetric, getMetricStatistics, median, pairedBootstrapRelativeChange } from '../src/Statistics.ts'

test('statistics report median, p95, and median absolute deviation', () => {
  expect(median([5, 1, 3, 2])).toBe(2.5)
  expect(getMetricStatistics([10, 11, 12, 13, 100])).toEqual({
    count: 5,
    mad: 1,
    median: 12,
    p95: 100,
    relativeMad: 1 / 12,
  })
})

test('paired bootstrap identifies an obvious improvement', () => {
  const interval = pairedBootstrapRelativeChange([100, 101, 99, 100, 102], [50, 51, 49, 50, 50])
  expect(interval.upper).toBeLessThan(-0.45)
  expect(compareMetric([100, 100], [50, 50]).relativeChange).toBe(-0.5)
})
