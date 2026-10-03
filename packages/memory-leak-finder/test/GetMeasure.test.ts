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

test('getMeasure resolves tracked allocations with stack traces public measure id', () => {
  expect(
    GetMeasure.getMeasure(
      {
        Measures,
      },
      'tracked-allocations-with-stack-traces',
    ),
  ).toBe(Measures.MeasureTrackedAllocationsWithStackTraces)
})

test('getMeasure resolves symbols with stack traces public measure id', () => {
  expect(
    GetMeasure.getMeasure(
      {
        Measures,
      },
      'symbols-with-stack-traces',
    ),
  ).toBe(Measures.MeasureSymbolsWithStackTraces)
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

test('getMeasure resolves compiled code size public measure id', () => {
  expect(
    GetMeasure.getMeasure(
      {
        Measures,
      },
      'compiled-code-size',
    ),
  ).toBe(Measures.MeasureCompiledCodeSize)
})

test('getMeasure resolves concatenated error string count public measure id', () => {
  expect(
    GetMeasure.getMeasure(
      {
        Measures,
      },
      'concatenated-error-string-count',
    ),
  ).toBe(Measures.MeasureConcatenatedErrorStringCount)
})

test('getMeasure resolves concatenated strings public measure id', () => {
  expect(
    GetMeasure.getMeasure(
      {
        Measures,
      },
      'concatenated-strings',
    ),
  ).toBe(Measures.MeasureConcatenatedStrings)
})

test('getMeasure resolves duplicated strings public measure id', () => {
  expect(
    GetMeasure.getMeasure(
      {
        Measures,
      },
      'duplicated-strings',
    ),
  ).toBe(Measures.MeasureDuplicatedStrings)
})
