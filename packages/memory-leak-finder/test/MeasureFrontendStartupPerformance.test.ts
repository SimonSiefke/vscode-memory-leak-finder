import { expect, test } from '@jest/globals'
import * as FrontendStartupPerformance from '../src/parts/FrontendStartupPerformance/FrontendStartupPerformance.ts'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
import * as MeasureFrontendStartupPerformance from '../src/parts/MeasureFrontendStartupPerformance/MeasureFrontendStartupPerformance.ts'

test('frontend startup performance measure lifecycle initializes and reads samples', async () => {
  let samples: unknown[] = [{ duration: 99 }]
  const calls: unknown[] = []
  const session = {
    dispose() {},
    invoke(method: string, params: any) {
      calls.push([method, params])
      if (params.expression.includes(' = []')) {
        samples = []
        return Promise.resolve({ result: { result: { type: 'object', value: samples } } })
      }
      return Promise.resolve({ result: { result: { type: 'object', value: samples } } })
    },
  } as any

  const args = MeasureFrontendStartupPerformance.create(session) as [any]
  const before = await MeasureFrontendStartupPerformance.start(...args)
  samples.push({ duration: 10, loadEventEnd: 20, workbenchStartup: 15 })
  const after = await MeasureFrontendStartupPerformance.stop(...args)

  expect(before).toEqual([])
  expect(after).toEqual([{ duration: 10, loadEventEnd: 20, workbenchStartup: 15 }])
  expect(calls).toHaveLength(2)
})

test('frontend startup performance compare aggregates samples', () => {
  const result = MeasureFrontendStartupPerformance.compare(
    [],
    [
      {
        duration: 30,
        loadEventStart: 10,
        workbenchStartup: 20,
        'first-paint': 5,
      },
      {
        duration: 10,
        loadEventStart: 0,
        workbenchStartup: 10,
        'first-paint': 15,
      },
    ],
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureFrontendStartupPerformance.isLeak()).toBe(false)
  expect(result.samples).toHaveLength(2)
  expect(result.metrics.find((metric: any) => metric.name === 'duration')).toEqual({
    count: 2,
    max: 30,
    mean: 20,
    median: 20,
    min: 10,
    name: 'duration',
    unit: 'ms',
  })
  expect(result.metrics.find((metric: any) => metric.name === 'workbenchStartup')).toEqual({
    count: 2,
    max: 20,
    mean: 15,
    median: 15,
    min: 10,
    name: 'workbenchStartup',
    unit: 'ms',
  })
  expect(result.metrics.find((metric: any) => metric.name === 'loadEventStart')).toEqual({
    count: 1,
    max: 10,
    mean: 10,
    median: 10,
    min: 10,
    name: 'loadEventStart',
    unit: 'ms',
  })
})

test('frontend startup performance normalization tolerates missing paint entries', () => {
  const result = FrontendStartupPerformance.normalizeFrontendStartupPerformance([
    {
      domInteractive: 10.1234,
    },
  ])

  expect(result).toEqual([
    {
      count: 1,
      max: 10.123,
      mean: 10.123,
      median: 10.123,
      min: 10.123,
      name: 'domInteractive',
      unit: 'ms',
    },
  ])
})

test('frontend-startup-performance resolves through measure lookup', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'frontend-startup-performance')

  expect(measure.id).toBe('frontendStartupPerformance')
})
