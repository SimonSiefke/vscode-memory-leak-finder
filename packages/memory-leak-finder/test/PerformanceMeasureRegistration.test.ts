import { expect, test } from '@jest/globals'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import { loadMemoryLeakFinder } from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
test('registers performance measures with kebab-case and camelCase names', () => {
  const module = loadMemoryLeakFinder()
  expect(getMeasure(module, 'forced-layout-count').id).toBe('forcedLayoutCount')
  expect(getMeasure(module, 'forcedLayoutCount').id).toBe('forcedLayoutCount')
  expect(getMeasure(module, 'module-loading').id).toBe('moduleLoading')
  expect(getMeasure(module, 'moduleLoading').id).toBe('moduleLoading')
  expect(getMeasure(module, 'long-renderer-tasks').id).toBe('longRendererTasks')
  expect(getMeasure(module, 'longRendererTasks').id).toBe('longRendererTasks')
  expect(getMeasure(module, 'synchronous-dom-read-count').id).toBe('synchronousDomReadCount')
  expect(getMeasure(module, 'synchronousDomReadCount').id).toBe('synchronousDomReadCount')
})
