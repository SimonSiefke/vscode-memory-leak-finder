import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
import * as MeasureJavascriptExecutionTime from '../src/parts/MeasureJavascriptExecutionTime/MeasureJavascriptExecutionTime.ts'

test('javascript execution time measure lifecycle enables, samples, and disables performance metrics', async () => {
  const calls: unknown[] = []
  const session = {
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      switch (method) {
        case 'Performance.enable':
        case 'Performance.disable':
          return Promise.resolve({ result: {} })
        case 'Performance.getMetrics':
          return Promise.resolve({
            result: {
              metrics: [
                { name: 'ScriptDuration', value: calls.length / 1000 },
                { name: 'TaskDuration', value: calls.length / 500 },
              ],
            },
          })
        default:
          throw new Error(`unexpected method ${method}`)
      }
    },
  } as any

  const args = MeasureJavascriptExecutionTime.create(session) as [any]
  const before = await MeasureJavascriptExecutionTime.start(...args)
  const after = await MeasureJavascriptExecutionTime.stop(...args)
  await MeasureJavascriptExecutionTime.releaseResources(...args)

  expect(before).toEqual({
    metrics: [
      { name: 'ScriptDuration', value: 0.002 },
      { name: 'TaskDuration', value: 0.004 },
    ],
  })
  expect(after).toEqual({
    metrics: [
      { name: 'ScriptDuration', value: 0.003 },
      { name: 'TaskDuration', value: 0.006 },
    ],
  })
  expect(calls).toEqual([
    ['Performance.enable', {}],
    ['Performance.getMetrics', {}],
    ['Performance.getMetrics', {}],
    ['Performance.disable', {}],
  ])
})

test('javascript execution time measure compares as informational only', () => {
  const result = MeasureJavascriptExecutionTime.compare(
    {
      metrics: [
        { name: 'ScriptDuration', value: 0.03 },
        { name: 'TaskDuration', value: 0.04 },
      ],
    },
    {
      metrics: [
        { name: 'ScriptDuration', value: 0.13 },
        { name: 'TaskDuration', value: 0.24 },
      ],
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureJavascriptExecutionTime.isLeak()).toBe(false)
  expect(result.metrics).toEqual([
    { after: 130, available: true, before: 30, cdpName: 'ScriptDuration', delta: 100, name: 'scriptDurationMs', unit: 'ms' },
    { after: 240, available: true, before: 40, cdpName: 'TaskDuration', delta: 200, name: 'taskDurationMs', unit: 'ms' },
  ])
})

test('javascript-execution-time resolves through measure lookup', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'javascript-execution-time')

  expect(measure.id).toBe('javascriptExecutionTime')
})
