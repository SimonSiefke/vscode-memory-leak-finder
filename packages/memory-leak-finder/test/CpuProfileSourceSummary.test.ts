import { beforeEach, expect, jest, test } from '@jest/globals'
import type { resolveTrackedLocationSourceMaps } from '../src/parts/ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'

const mockResolveTrackedLocationSourceMaps = jest.fn<typeof resolveTrackedLocationSourceMaps>()

jest.unstable_mockModule('../src/parts/ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts', () => ({
  resolveTrackedLocationSourceMaps: mockResolveTrackedLocationSourceMaps,
}))

beforeEach(() => {
  mockResolveTrackedLocationSourceMaps.mockReset()
  mockResolveTrackedLocationSourceMaps.mockResolvedValue({
    'file:///bundle.js:3:2': {
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalName: null,
      originalSource: 'src/a.ts',
    },
    'file:///bundle.js:5:4': {
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalName: null,
      originalSource: 'src/b.ts',
    },
  })
})

test('getCpuProfileSourceSummary source maps JavaScript leaf samples and excludes runtime-only samples', async () => {
  const CpuProfileSourceSummary = await import('../src/parts/CpuProfileSourceSummary/CpuProfileSourceSummary.ts')
  const result = await CpuProfileSourceSummary.getCpuProfileSourceSummary(
    {
      nodes: [
        {
          callFrame: {
            columnNumber: 1,
            functionName: 'a',
            lineNumber: 2,
            url: 'file:///bundle.js',
          },
          id: 1,
        },
        {
          callFrame: {
            columnNumber: 3,
            functionName: 'b',
            lineNumber: 4,
            url: 'file:///bundle.js',
          },
          id: 2,
        },
        {
          callFrame: {
            columnNumber: 0,
            functionName: '(garbage collector)',
            lineNumber: 0,
            url: '',
          },
          id: 3,
        },
      ],
      samples: [1, 2, 3],
      timeDeltas: [1000, 2000, 3000],
    },
    {},
  )

  expect(result).toEqual({
    metrics: {
      javascriptSelfTimeMs: 3,
      profileTotalTimeMs: 6,
      sampleCount: 3,
    },
    sourceSelfTime: {
      'src/a.ts': 1,
      'src/b.ts': 2,
    },
  })
  expect(mockResolveTrackedLocationSourceMaps).toHaveBeenCalledWith(['file:///bundle.js:3:2', 'file:///bundle.js:5:4'], {})
})

test('getCpuProfileSourceSummary distributes profile duration when time deltas are missing', async () => {
  const CpuProfileSourceSummary = await import('../src/parts/CpuProfileSourceSummary/CpuProfileSourceSummary.ts')
  mockResolveTrackedLocationSourceMaps.mockResolvedValue({})
  const result = await CpuProfileSourceSummary.getCpuProfileSourceSummary(
    {
      endTime: 4000,
      nodes: [
        {
          callFrame: {
            columnNumber: 0,
            functionName: 'work',
            lineNumber: 0,
            url: 'file:///work.js',
          },
          id: 1,
        },
      ],
      samples: [1, 1],
      startTime: 0,
    },
    {},
  )

  expect(result.metrics).toEqual({
    javascriptSelfTimeMs: 4,
    profileTotalTimeMs: 4,
    sampleCount: 2,
  })
  expect(result.sourceSelfTime).toEqual({
    'file:///work.js': 4,
  })
})
