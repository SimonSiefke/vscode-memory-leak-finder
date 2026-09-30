import { expect, test } from '@jest/globals'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import { loadMemoryLeakFinder } from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
test('registers the performance measure with kebab-case and camelCase names', () => {
  const module = loadMemoryLeakFinder()
  expect(getMeasure(module, 'synchronous-dom-read-count-with-stack-traces').id).toBe('synchronousDomReadCountWithStackTraces')
  expect(getMeasure(module, 'synchronousDomReadCountWithStackTraces').id).toBe('synchronousDomReadCountWithStackTraces')
})
