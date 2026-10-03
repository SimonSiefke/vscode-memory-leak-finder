import { expect, test } from '@jest/globals'
import * as MergeEventListenersWithOriginalStacks from '../src/parts/MergeEventListenersWithOriginalStacks/MergeEventListenersWithOriginalStacks.ts'

test('mergeEventListenersWithOriginalStacks resolves every stack frame', () => {
  const eventListeners = [
    {
      count: 2,
      sourceMaps: ['workbench.js.map'],
      stack: ['listener (workbench.js:1:2)', 'create (workbench.js:3:4)'],
      type: 'click',
    },
  ]
  const cleanInstances = [
    {
      originalIndex: 2,
      originalName: 'listener',
      originalStack: ['src/listener.ts:10:20'],
      sourcesHash: 'first-sources-hash',
    },
    {
      originalIndex: 3,
      originalName: 'create',
      originalStack: ['src/create.ts:30:40'],
      sourcesHash: 'second-sources-hash',
    },
  ]

  expect(MergeEventListenersWithOriginalStacks.mergeEventListenersWithOriginalStacks(eventListeners, cleanInstances)).toEqual([
    {
      count: 2,
      originalName: 'listener',
      originalStack: ['src/listener.ts:10:20', 'src/create.ts:30:40'],
      sourcesHash: 'first-sources-hash',
      stack: ['listener (workbench.js:1:2)', 'create (workbench.js:3:4)'],
      type: 'click',
    },
  ])
})
