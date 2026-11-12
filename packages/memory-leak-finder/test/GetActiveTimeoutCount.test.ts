import { expect, test } from '@jest/globals'
import { runInNewContext } from 'node:vm'
import type { Session } from '../src/parts/Session/Session.ts'
import { getActiveTimeoutCount } from '../src/parts/GetActiveTimeoutCount/GetActiveTimeoutCount.ts'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import * as measure from '../src/parts/MeasureActiveTimeoutCount/MeasureActiveTimeoutCount.ts'

const createSession = (context: object) =>
  ({
    async invoke(_method: string, options: any) {
      return { result: { result: { type: 'number', value: runInNewContext(options.expression, context) } } }
    },
  }) as unknown as Session

test.each([0, 3])('reads the active timeout count %s', async (count) => {
  const session = createSession({ ___memoryLeakFinderGetActiveTimerCounts: () => ({ timeouts: count }) })
  expect(await getActiveTimeoutCount(session)).toBe(count)
  expect(getMeasure({ Measures: { measure } }, 'active-timeout-count')).toBe(measure)
})

test('fails explicitly when startup instrumentation is absent', async () => {
  await expect(getActiveTimeoutCount(createSession({}))).rejects.toThrow('requires workbench timer instrumentation')
})

test('rejects invalid counts', async () => {
  const session = createSession({ ___memoryLeakFinderGetActiveTimerCounts: () => ({ timeouts: -1 }) })
  await expect(getActiveTimeoutCount(session)).rejects.toThrow('Invalid active timeout count')
})
