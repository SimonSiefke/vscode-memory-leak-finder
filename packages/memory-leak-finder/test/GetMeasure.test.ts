import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'

test('getMeasure resolves event listeners with full stack traces public measure id', () => {
  expect(
    GetMeasure.getMeasure(
      {
        Measures,
      },
      'event-listeners-with-full-stack-traces',
    ),
  ).toBe(Measures.MeasureEventListenersWithFullStackTraces)
})

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

test('getMeasure resolves ipc messages from start public measure id', () => {
  const measure = {
    id: 'ipcMessagesFromStart',
  }
  const MemoryLeakFinder = {
    Measures: {
      MeasureIpcMessagesFromStart: measure,
    },
  }

  expect(GetMeasure.getMeasure(MemoryLeakFinder, 'ipc-messages-from-start')).toBe(measure)
})

test('getMeasure resolves tracked allocation timeline public measure id', () => {
  const measure = {
    id: 'trackedAllocationTimeline',
  }
  const MemoryLeakFinder = {
    Measures: {
      MeasureTrackedAllocationTimeline: measure,
    },
  }

  expect(GetMeasure.getMeasure(MemoryLeakFinder, 'tracked-allocation-timeline')).toBe(measure)
})

test('getMeasure resolves tracked allocation leaks public measure id', () => {
  expect(
    GetMeasure.getMeasure(
      {
        Measures,
      },
      'tracked-allocation-leaks',
    ),
  ).toBe(Measures.MeasureTrackedAllocationLeaks)
})

test('getMeasure resolves tracked allocation performance public measure id', () => {
  expect(
    GetMeasure.getMeasure(
      {
        Measures,
      },
      'tracked-allocation-performance',
    ),
  ).toBe(Measures.MeasureTrackedAllocationPerformance)
})

test('getMeasure resolves tracked timeouts public measure id', () => {
  const measure = {
    id: 'trackedTimeouts',
  }
  const MemoryLeakFinder = {
    Measures: {
      MeasureTrackedTimeouts: measure,
    },
  }

  expect(GetMeasure.getMeasure(MemoryLeakFinder, 'tracked-timeouts')).toBe(measure)
})
