import { expect, jest, test } from '@jest/globals'

const mockGetEventListenerOriginalSourcesCached = jest.fn() as any

jest.unstable_mockModule(
  '../src/parts/GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts',
  () => ({
    getEventListenerOriginalSourcesCached: mockGetEventListenerOriginalSourcesCached,
  }),
)

const CompareEventListenersWithStackTraces = await import(
  '../src/parts/CompareEventListenersWithStackTraces/CompareEventListenersWithStackTraces.ts'
)

test('compareEventListenersWithStackTraces - resolves original locations for full stack when script map is available', async () => {
  mockGetEventListenerOriginalSourcesCached.mockImplementation(async (queries: any[]) => {
    return queries.map((query) => ({
      originalIndex: query.originalIndex,
      originalStack: [`src/${query.originalIndex}.ts:1:1`],
      sourcesHash: query.originalIndex === 2 ? 'hash' : null,
    }))
  })

  const before: any[] = []
  const after = {
    result: [
      {
        description: 'function listener(){}',
        objectId: '1',
        sourceMaps: ['http://127.0.0.1:3000/a.js.map'],
        stack: [
          'listener (http://127.0.0.1:3000/a.js:0:10)',
          'register (http://127.0.0.1:3000/b.js:2:20)',
          'http://127.0.0.1:3000/b.js:3:30',
        ],
        type: 'click',
      },
    ],
    scriptMap: {
      1: {
        sourceMapUrl: 'http://127.0.0.1:3000/a.js.map',
        url: 'http://127.0.0.1:3000/a.js',
      },
      2: {
        sourceMapUrl: 'http://127.0.0.1:3000/b.js.map',
        url: 'http://127.0.0.1:3000/b.js',
      },
    },
  }

  const result = await CompareEventListenersWithStackTraces.compareEventListenersWithStackTraces(before, after)

  expect(mockGetEventListenerOriginalSourcesCached).toHaveBeenCalledWith(
    [
      {
        originalIndex: 2,
        sourceMaps: ['http://127.0.0.1:3000/a.js.map'],
        stack: ['listener (http://127.0.0.1:3000/a.js:0:10)'],
      },
      {
        originalIndex: 3,
        sourceMaps: ['http://127.0.0.1:3000/b.js.map'],
        stack: ['register (http://127.0.0.1:3000/b.js:1:20)'],
      },
      {
        originalIndex: 4,
        sourceMaps: ['http://127.0.0.1:3000/b.js.map'],
        stack: ['(http://127.0.0.1:3000/b.js:2:30)'],
      },
    ],
    false,
  )
  expect(result).toEqual([
    {
      count: 1,
      description: 'function listener(){}',
      objectId: '1',
      originalStack: ['src/2.ts:1:1', 'src/3.ts:1:1', 'src/4.ts:1:1'],
      sourcesHash: 'hash',
      stack: [
        'listener (http://127.0.0.1:3000/a.js:0:10)',
        'register (http://127.0.0.1:3000/b.js:2:20)',
        'http://127.0.0.1:3000/b.js:3:30',
      ],
      type: 'click',
    },
  ])
})
