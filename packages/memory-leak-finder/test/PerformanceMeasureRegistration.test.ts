import { expect, test } from '@jest/globals'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import { loadMemoryLeakFinder } from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
test('registers performance measures with kebab-case and camelCase names', () => {
  const module = loadMemoryLeakFinder()
  expect(getMeasure(module, 'startup-phase-durations').id).toBe('startupPhaseDurations')
  expect(getMeasure(module, 'startupPhaseDurations').id).toBe('startupPhaseDurations')
  expect(getMeasure(module, 'synchronous-dom-read-count').id).toBe('synchronousDomReadCount')
  expect(getMeasure(module, 'synchronousDomReadCount').id).toBe('synchronousDomReadCount')
})
