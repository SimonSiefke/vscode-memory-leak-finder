import { expect, test } from '@jest/globals'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import { loadMemoryLeakFinder } from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
test('registers the performance measure with kebab-case and camelCase names', () => {
  const module = loadMemoryLeakFinder()
  expect(getMeasure(module, 'event-loop-delay').id).toBe('eventLoopDelay')
  expect(getMeasure(module, 'eventLoopDelay').id).toBe('eventLoopDelay')
  expect(getMeasure(module, 'synchronous-dom-read-count').id).toBe('synchronousDomReadCount')
  expect(getMeasure(module, 'synchronousDomReadCount').id).toBe('synchronousDomReadCount')
})
