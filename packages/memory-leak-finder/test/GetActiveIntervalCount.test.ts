import { expect, test } from '@jest/globals'
import { runInNewContext } from 'node:vm'
import type { Session } from '../src/parts/Session/Session.ts'
import { getActiveIntervalCount } from '../src/parts/GetActiveIntervalCount/GetActiveIntervalCount.ts'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import * as measure from '../src/parts/MeasureActiveIntervalCount/MeasureActiveIntervalCount.ts'

const createSession = (context: object) =>
  ({
    async invoke(_method: string, options: any) {
      return { result: { result: { type: 'number', value: runInNewContext(options.expression, context) } } }
    },
  }) as unknown as Session

test.each([0, 3])('reads the active interval count %s', async (count) => {
  const session = createSession({ ___memoryLeakFinderGetActiveTimerCounts: () => ({ intervals: count }) })
  expect(await getActiveIntervalCount(session)).toBe(count)
  expect(getMeasure({ Measures: { measure } }, 'active-interval-count')).toBe(measure)
})

test('fails explicitly when startup instrumentation is absent', async () => {
  await expect(getActiveIntervalCount(createSession({}))).rejects.toThrow('requires workbench timer instrumentation')
})

test('rejects invalid counts', async () => {
  const session = createSession({ ___memoryLeakFinderGetActiveTimerCounts: () => ({ intervals: -1 }) })
  await expect(getActiveIntervalCount(session)).rejects.toThrow('Invalid active interval count')
})
