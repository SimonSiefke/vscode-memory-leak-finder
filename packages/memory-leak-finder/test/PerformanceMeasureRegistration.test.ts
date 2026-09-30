import { expect, test } from '@jest/globals'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import { loadMemoryLeakFinder } from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
test('registers the performance measure with kebab-case and camelCase names', () => {
  const module = loadMemoryLeakFinder()
  expect(getMeasure(module, 'module-resolution-lookups').id).toBe('moduleResolutionLookups')
  expect(getMeasure(module, 'moduleResolutionLookups').id).toBe('moduleResolutionLookups')
})
