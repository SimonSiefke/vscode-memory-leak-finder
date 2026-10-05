import { expect, test } from '@jest/globals'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import { loadMemoryLeakFinder } from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
test('registers performance measures with kebab-case and camelCase names', () => {
  const module = loadMemoryLeakFinder()
  expect(getMeasure(module, 'forced-layout-count').id).toBe('forcedLayoutCount')
  expect(getMeasure(module, 'forcedLayoutCount').id).toBe('forcedLayoutCount')
  expect(getMeasure(module, 'startup-phase-durations').id).toBe('startupPhaseDurations')
  expect(getMeasure(module, 'startupPhaseDurations').id).toBe('startupPhaseDurations')
  expect(getMeasure(module, 'module-resolution').id).toBe('moduleResolution')
  expect(getMeasure(module, 'moduleResolution').id).toBe('moduleResolution')
  expect(getMeasure(module, 'synchronous-file-system').id).toBe('synchronousFileSystem')
  expect(getMeasure(module, 'synchronousFileSystem').id).toBe('synchronousFileSystem')
  expect(getMeasure(module, 'event-loop-delay').id).toBe('eventLoopDelay')
  expect(getMeasure(module, 'eventLoopDelay').id).toBe('eventLoopDelay')
  expect(getMeasure(module, 'long-renderer-tasks').id).toBe('longRendererTasks')
  expect(getMeasure(module, 'longRendererTasks').id).toBe('longRendererTasks')
  expect(getMeasure(module, 'synchronous-dom-read-count').id).toBe('synchronousDomReadCount')
  expect(getMeasure(module, 'synchronousDomReadCount').id).toBe('synchronousDomReadCount')
})
