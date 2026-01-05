import { test, expect } from '@jest/globals'
import * as ComparePromisesWithStackTrace from '../src/parts/ComparePromisesWithStackTrace/ComparePromisesWithStackTrace.ts'

test('comparePromisesWithStackTrace - basic delta calculation', async () => {
  const before = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1\nat test.js:2:2',
    },
  ]
  const after = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1\nat test.js:2:2',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1\nat test.js:2:2',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1\nat test.js:2:2',
    },
  ]
  const result = await ComparePromisesWithStackTrace.comparePromisesWithStackTrace(before, after)
  expect(result).toEqual([
    {
      count: 3,
      delta: 2,
      properties: [{ name: 'status', value: 'pending' }],
      stackTrace: ['at test.js:1:1', 'at test.js:2:2'],
    },
  ])
})

test('comparePromisesWithStackTrace - different promises', async () => {
  const before = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
  ]
  const after = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'resolved' }],
      },
      stackTrace: 'at test.js:2:2',
    },
  ]
  const result = await ComparePromisesWithStackTrace.comparePromisesWithStackTrace(before, after)
  expect(result).toEqual([
    {
      count: 1,
      delta: 1,
      properties: [{ name: 'status', value: 'resolved' }],
      stackTrace: ['at test.js:2:2'],
    },
  ])
})

test('comparePromisesWithStackTrace - no new promises', async () => {
  const before = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
  ]
  const after = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
  ]
  const result = await ComparePromisesWithStackTrace.comparePromisesWithStackTrace(before, after)
  expect(result).toEqual([])
})

test('comparePromisesWithStackTrace - fewer promises', async () => {
  const before = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
  ]
  const after = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
  ]
  const result = await ComparePromisesWithStackTrace.comparePromisesWithStackTrace(before, after)
  expect(result).toEqual([])
})

test('comparePromisesWithStackTrace - multiple promise types sorted by delta', async () => {
  const before = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'resolved' }],
      },
      stackTrace: 'at test.js:2:2',
    },
  ]
  const after = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'resolved' }],
      },
      stackTrace: 'at test.js:2:2',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'resolved' }],
      },
      stackTrace: 'at test.js:2:2',
    },
  ]
  const result = await ComparePromisesWithStackTrace.comparePromisesWithStackTrace(before, after)
  expect(result).toEqual([
    {
      count: 3,
      delta: 2,
      properties: [{ name: 'status', value: 'pending' }],
      stackTrace: ['at test.js:1:1'],
    },
    {
      count: 2,
      delta: 1,
      properties: [{ name: 'status', value: 'resolved' }],
      stackTrace: ['at test.js:2:2'],
    },
  ])
})

test('comparePromisesWithStackTrace - stackTrace as array', async () => {
  const before: any[] = []
  const after = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: ['at test.js:1:1', 'at test.js:2:2'],
    },
  ]
  const result = await ComparePromisesWithStackTrace.comparePromisesWithStackTrace(before, after)
  expect(result).toEqual([
    {
      count: 1,
      delta: 1,
      properties: [{ name: 'status', value: 'pending' }],
      stackTrace: ['at test.js:1:1', 'at test.js:2:2'],
    },
  ])
})

test('comparePromisesWithStackTrace - with result and scriptMap', async () => {
  const before = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
  ]
  const after = {
    result: [
      {
        preview: {
          properties: [{ name: 'status', value: 'pending' }],
        },
        stackTrace: 'at test.js:1:1',
      },
      {
        preview: {
          properties: [{ name: 'status', value: 'pending' }],
        },
        stackTrace: 'at test.js:1:1',
      },
    ],
    scriptMap: {},
  }
  const result = await ComparePromisesWithStackTrace.comparePromisesWithStackTrace(before, after)
  expect(result).toEqual([
    {
      count: 2,
      delta: 1,
      originalStack: [],
      properties: [{ name: 'status', value: 'pending' }],
      stackTrace: ['at test.js:1:1'],
      sourcesHash: null,
    },
  ])
})

test('comparePromisesWithStackTrace - filter by context.runs', async () => {
  const before = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
  ]
  const after = [
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'pending' }],
      },
      stackTrace: 'at test.js:1:1',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'resolved' }],
      },
      stackTrace: 'at test.js:2:2',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'resolved' }],
      },
      stackTrace: 'at test.js:2:2',
    },
    {
      preview: {
        properties: [{ name: 'status', value: 'resolved' }],
      },
      stackTrace: 'at test.js:2:2',
    },
  ]
  const context = { runs: 3 }
  const result = await ComparePromisesWithStackTrace.comparePromisesWithStackTrace(before, after, context)
  expect(result).toEqual([
    {
      count: 3,
      delta: 3,
      properties: [{ name: 'status', value: 'resolved' }],
      stackTrace: ['at test.js:2:2'],
    },
  ])
})
