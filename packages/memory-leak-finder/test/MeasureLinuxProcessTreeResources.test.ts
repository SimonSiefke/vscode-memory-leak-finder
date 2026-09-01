import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'

test.each([
  ['linux-process-tree-resources', 'linuxProcessTreeResources'],
  ['linux-process-tree-resources-from-start', 'linuxProcessTreeResourcesFromStart'],
])('resolves %s through measure lookup', (requested, expected) => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  expect(GetMeasure.getMeasure(MemoryLeakFinder, requested).id).toBe(expected)
})
