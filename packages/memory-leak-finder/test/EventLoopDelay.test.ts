import { expect, test } from '@jest/globals'
import { runInNewContext } from 'node:vm'
import { install } from '../src/parts/EventLoopDelayTracker/EventLoopDelayTracker.ts'
test('converts histogram nanoseconds and preserves no-sample state', () => {
  let disabled = false,
    enabled = false
  const histogram = {
    count: 0,
    mean: 20e6,
    max: 40e6,
    percentile: () => 30e6,
    enable() {
      enabled = true
    },
    disable() {
      disabled = true
    },
  }
  const hooks = {
    monitorEventLoopDelay: () => histogram,
    performance: { eventLoopUtilization: () => ({ active: 4, idle: 6, utilization: 0.4 }) },
  }
  const tracker = runInNewContext(`(${install.toString()})()`, { process: { getBuiltinModule: () => hooks } })
  expect(enabled).toBe(true)
  expect(tracker.snapshot().metrics.p95DelayMs).toBeNull()
  histogram.count = 3
  expect(tracker.snapshot().metrics).toMatchObject({ p95DelayMs: 30, maxDelayMs: 40, utilizationRatio: 0.4 })
  tracker.dispose()
  expect(disabled).toBe(true)
})
test('missing Node API is unavailable', () => {
  const tracker = runInNewContext(`(${install.toString()})()`, {})
  expect(tracker.snapshot().available).toBe(false)
})
