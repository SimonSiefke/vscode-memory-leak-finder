import { expect, test } from '@jest/globals'
import {
  compareBlockedMetric,
  compareMetric,
  getBlockLogEffects,
  getMetricStatistics,
  hierarchicalBootstrapRelativeChange,
  median,
  pairedBootstrapRelativeChange,
} from '../src/Statistics.ts'

test('statistics report median, p95, and median absolute deviation', () => {
  expect(median([5, 1, 3, 2])).toBe(2.5)
  expect(getMetricStatistics([10, 11, 12, 13, 100])).toEqual({
    count: 5,
    mad: 1,
    median: 12,
    p90: 100,
    p95: 100,
    relativeMad: 1 / 12,
  })
})

test('paired bootstrap identifies an obvious improvement', () => {
  const interval = pairedBootstrapRelativeChange([100, 101, 99, 100, 102], [50, 51, 49, 50, 50])
  expect(interval.upper).toBeLessThan(-0.45)
  expect(compareMetric([100, 100], [50, 50]).relativeChange).toBe(-0.5)
})

test('ABBA block effects cancel linear drift', () => {
  const baseline = [
    { blockIndex: 0, value: 100 },
    { blockIndex: 0, value: 130 },
  ]
  const candidate = [
    { blockIndex: 0, value: 110 },
    { blockIndex: 0, value: 120 },
  ]
  const [effect] = getBlockLogEffects(baseline, candidate)
  expect(Math.exp(effect) - 1).toBeCloseTo(Math.sqrt((110 * 120) / (100 * 130)) - 1)
  expect(compareBlockedMetric(baseline, candidate).relativeChange).toBeCloseTo(Math.exp(effect) - 1)
})

test('hierarchical bootstrap detects a replicated improvement', () => {
  const interval = hierarchicalBootstrapRelativeChange([
    [Math.log(0.8), Math.log(0.82), Math.log(0.79)],
    [Math.log(0.81), Math.log(0.8), Math.log(0.78)],
    [Math.log(0.83), Math.log(0.79), Math.log(0.8)],
  ])
  expect(interval.upper).toBeLessThan(-0.1)
})
