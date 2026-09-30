import { expect, test } from '@jest/globals'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import { loadMemoryLeakFinder } from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
test('registers the performance measure with kebab-case and camelCase names', () => {
  const module = loadMemoryLeakFinder()
  expect(getMeasure(module, 'module-resolution').id).toBe('moduleResolution')
  expect(getMeasure(module, 'moduleResolution').id).toBe('moduleResolution')
  expect(getMeasure(module, 'synchronous-dom-read-count').id).toBe('synchronousDomReadCount')
  expect(getMeasure(module, 'synchronousDomReadCount').id).toBe('synchronousDomReadCount')
})
