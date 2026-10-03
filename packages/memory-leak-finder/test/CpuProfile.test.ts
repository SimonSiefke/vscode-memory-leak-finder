import { expect, test } from '@jest/globals'
import { formatCpuProfileSummary, getCpuProfileSummary } from '../src/parts/CpuProfile/CpuProfile.ts'

test('getCpuProfileSummary aggregates self and total time from samples', () => {
  const result = getCpuProfileSummary({
    nodes: [
      {
        callFrame: {
          columnNumber: 0,
          functionName: '(root)',
          lineNumber: 0,
          url: '',
        },
        children: [2, 3],
        id: 1,
      },
      {
        callFrame: {
          columnNumber: 4,
          functionName: 'renderWorkbench',
          lineNumber: 10,
          url: 'file:///workbench.js',
        },
        children: [4],
        id: 2,
      },
      {
        callFrame: {
          columnNumber: 2,
          functionName: 'layout',
          lineNumber: 20,
          url: 'file:///layout.js',
        },
        id: 3,
      },
      {
        callFrame: {
          columnNumber: 8,
          functionName: '',
          lineNumber: 30,
          url: 'file:///anonymous.js',
        },
        id: 4,
      },
    ],
    samples: [2, 4, 3, 4],
    timeDeltas: [1000, 2500, 500, 1000],
  })

  expect(result.metrics).toMatchObject({
    nodeCount: 4,
    sampleCount: 4,
    totalTimeMs: 5,
  })
  expect(result.topSelfTime.slice(0, 3)).toEqual([
    {
      columnNumber: 8,
      functionName: '(anonymous)',
      hitCount: 2,
      lineNumber: 30,
      selfTimeMs: 3.5,
      totalTimeMs: 3.5,
      url: 'file:///anonymous.js',
    },
    {
      columnNumber: 4,
      functionName: 'renderWorkbench',
      hitCount: 1,
      lineNumber: 10,
      selfTimeMs: 1,
      totalTimeMs: 4.5,
      url: 'file:///workbench.js',
    },
    {
      columnNumber: 2,
      functionName: 'layout',
      hitCount: 1,
      lineNumber: 20,
      selfTimeMs: 0.5,
      totalTimeMs: 0.5,
      url: 'file:///layout.js',
    },
  ])
  expect(result.topTotalTime[0]).toMatchObject({
    functionName: '(root)',
    totalTimeMs: 5,
  })
  expect(result.topTotalTime[1]).toMatchObject({
    functionName: 'renderWorkbench',
    totalTimeMs: 4.5,
  })
})

test('getCpuProfileSummary distributes profile duration when timeDeltas are missing or short', () => {
  const result = getCpuProfileSummary({
    endTime: 9000,
    nodes: [
      {
        callFrame: {
          functionName: 'hydrate',
        },
        id: 1,
      },
    ],
    samples: [1, 1, 1],
    startTime: 0,
    timeDeltas: [1000],
  })

  expect(result.metrics.totalTimeMs).toBe(9)
  expect(result.topSelfTime).toEqual([
    {
      columnNumber: 0,
      functionName: 'hydrate',
      hitCount: 3,
      lineNumber: 0,
      selfTimeMs: 9,
      totalTimeMs: 9,
      url: '',
    },
  ])
})

test('formatCpuProfileSummary returns compact text', () => {
  const summary = formatCpuProfileSummary({
    metrics: {
      nodeCount: 1,
      sampleCount: 2,
      totalTimeMs: 3,
    },
    topSelfTime: [
      {
        columnNumber: 5,
        functionName: 'activate',
        hitCount: 2,
        lineNumber: 12,
        selfTimeMs: 3,
        totalTimeMs: 3,
        url: 'file:///extension.js',
      },
    ],
    topTotalTime: [],
  })

  expect(summary).toContain('CPU profile:')
  expect(summary).toContain('totalTimeMs | 3')
  expect(summary).toContain('activate | 3 | 3 | 2 | file:///extension.js:12:5')
})

test('separates idle, GC, JavaScript and unattributed samples without claiming CPU utilization', () => {
  const result = getCpuProfileSummary({
    startTime: 0,
    endTime: 10000,
    nodes: [
      { id: 1, callFrame: { functionName: '(idle)' } },
      { id: 2, callFrame: { functionName: '(garbage collector)' } },
      { id: 3, callFrame: { functionName: 'work', url: 'file:///work.js' } },
    ],
    samples: [1, 2, 3, 999],
    timeDeltas: [1000, 2000, 3000, 500],
  })
  expect(result.metrics).toMatchObject({
    totalTimeMs: 6.5,
    elapsedTimeMs: 10,
    idleTimeMs: 1,
    gcTimeMs: 2,
    javascriptTimeMs: 3,
    otherTimeMs: 0.5,
    estimatedTiming: false,
  })
})
test('rounds only after accumulation and marks fallback timing', () => {
  const result = getCpuProfileSummary({
    startTime: 0,
    endTime: 1000,
    samples: [1, 1, 1],
    nodes: [{ id: 1, callFrame: { url: 'file:///a.js' } }],
  })
  expect(result.metrics.totalTimeMs).toBe(1)
  expect(result.metrics.estimatedTiming).toBe(true)
  expect(result.topSelfTime[0].selfTimeMs).toBe(1)
})
test('malformed timing cannot produce negative or nonfinite totals', () => {
  const result = getCpuProfileSummary({ startTime: 2, endTime: 1, samples: [1], timeDeltas: [-1] })
  expect(result.metrics).toMatchObject({ totalTimeMs: 0, elapsedTimeMs: null, estimatedTiming: true })
})
