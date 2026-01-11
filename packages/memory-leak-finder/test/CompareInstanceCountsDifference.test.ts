import { test, expect } from '@jest/globals'
import * as CompareInstanceCountsDifference from '../src/parts/CompareInstanceCountsDifference/CompareInstanceCountsDifference.ts'

test('compareInstanceCountsDifference', async () => {
  const before = [
    {
      count: 9392,
      name: 'LoaderEvent',
    },
    {
      count: 5561,
      name: 'Node',
    },
    {
      count: 4698,
      name: 'AsyncFunction',
    },
    {
      count: 2560,
      name: 'Module',
    },
    {
      count: 2453,
      name: 'UniqueContainer',
    },
    {
      count: 2389,
      name: 'LinkedList',
    },
    {
      count: 2055,
      name: 'Emitter',
    },
  ]
  const after = [
    {
      count: 9392,
      name: 'LoaderEvent',
    },
    {
      count: 5561,
      name: 'Node',
    },
    {
      count: 4698,
      name: 'AsyncFunction',
    },
    {
      count: 2560,
      name: 'Module',
    },
    {
      count: 2460,
      name: 'UniqueContainer',
    },
    {
      count: 2389,
      name: 'LinkedList',
    },
    {
      count: 2118,
      name: 'Emitter',
    },
  ]
  expect(await CompareInstanceCountsDifference.compareInstanceCountsDifference(before, after)).toEqual([
    {
      count: 2460,
      delta: 7,
      name: 'UniqueContainer',
    },
    {
      count: 2118,
      delta: 63,
      name: 'Emitter',
    },
  ])
})
