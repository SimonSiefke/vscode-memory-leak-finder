import { expect, jest, test } from '@jest/globals'

const mockGetEventListenerOriginalSourcesCached = jest.fn(async (eventListeners: readonly any[], _classNames: unknown) => {
  return eventListeners
    .map((eventListener) => ({
      ...eventListener,
      originalName: `originalName${eventListener.originalIndex}`,
      originalStack: [`src/original${eventListener.originalIndex}.ts:10:20`],
      sourcesHash: `sourcesHash${eventListener.originalIndex}`,
    }))
    .reverse()
})

jest.unstable_mockModule('../src/parts/GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts', () => ({
  getEventListenerOriginalSourcesCached: mockGetEventListenerOriginalSourcesCached,
}))

test('compareEventListenersWithFullStackTraces resolves every stack frame', async () => {
  const CompareEventListenersWithFullStackTraces =
    await import('../src/parts/CompareEventListenersWithFullStackTraces/CompareEventListenersWithFullStackTraces.ts')
  const eventListener = {
    sourceMaps: ['workbench.js.map'],
    stack: ['listener (file:///workbench.js:1:2)', 'create (file:///workbench.js:3:4)'],
    type: 'click',
  }
  const after = {
    result: [eventListener, eventListener],
    scriptMap: {
      1: {
        sourceMapUrl: 'workbench.js.map',
        url: 'file:///workbench.js',
      },
    },
  }

  await expect(CompareEventListenersWithFullStackTraces.compareEventListenersWithFullStackTraces([], after)).resolves.toEqual([
    {
      count: 2,
      originalName: 'originalName2',
      originalStack: ['src/original2.ts:10:20', 'src/original3.ts:10:20'],
      sourcesHash: 'sourcesHash2',
      stack: ['listener (file:///workbench.js:1:2)', 'create (file:///workbench.js:3:4)'],
      type: 'click',
    },
  ])
  expect(mockGetEventListenerOriginalSourcesCached).toHaveBeenCalledWith(
    [
      {
        originalIndex: 2,
        sourceMaps: ['workbench.js.map'],
        stack: ['listener (file:///workbench.js:0:2)'],
      },
      {
        originalIndex: 3,
        sourceMaps: ['workbench.js.map'],
        stack: ['create (file:///workbench.js:2:4)'],
      },
    ],
    false,
  )
})
