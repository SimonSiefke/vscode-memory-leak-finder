import { runInNewContext } from 'node:vm'
import { expect, test } from '@jest/globals'
import { install } from '../src/parts/StartupPhaseDurationsTracker/StartupPhaseDurationsTracker.ts'
test('reads retained startup marks and only new measures without clearing them', () => {
  const marks = [
    { name: 'code/didStartRenderer', startTime: 5 },
    { name: 'code/didStartWorkbench', startTime: 15 },
  ]
  const measures = [
    { name: 'old', startTime: 1, duration: 2 },
    { name: 'contribution', startTime: 20, duration: 3 },
  ]
  const tracker = runInNewContext(`(${install.toString()})()`, {
    performance: { now: () => 10, getEntriesByType: (type: string) => (type === 'mark' ? marks : measures) },
  })
  const result = tracker.snapshot()
  expect(result.rows).toHaveLength(2)
  expect(result.rows.find((row: any) => row.name === 'rendererToWorkbench').durationMs).toBe(10)
  expect(result.unavailablePhases).toContain('mainToRenderer')
  tracker.dispose()
  expect(marks).toHaveLength(2)
})
test('missing performance API is unavailable', () => {
  expect(runInNewContext(`(${install.toString()})()`, {}).snapshot().available).toBe(false)
})
