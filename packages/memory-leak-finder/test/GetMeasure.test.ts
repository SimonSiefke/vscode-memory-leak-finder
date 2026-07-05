import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'

test('getMeasure resolves tracked allocations from start public measure id', () => {
  const measure = {
    id: 'trackedAllocationsFromStart',
  }
  const MemoryLeakFinder = {
    Measures: {
      MeasureTrackedAllocationsFromStart: measure,
    },
  }

  expect(GetMeasure.getMeasure(MemoryLeakFinder, 'tracked-allocations-from-start')).toBe(measure)
})
