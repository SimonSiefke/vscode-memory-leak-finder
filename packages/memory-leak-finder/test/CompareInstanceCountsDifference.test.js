import * as CompareInstanceCountsDifference from '../src/parts/CompareInstanceCountsDifference/CompareInstanceCountsDifference.js'
import {test, expect} from '@jest/globals'

test('compareInstanceCountsDifference', async () => {
  const before = [
    {
      name: 'LoaderEvent',
      count: 9392,
    },
    {
      name: 'Node',
      count: 5561,
    },
    {
      name: 'AsyncFunction',
      count: 4698,
    },
    {
      name: 'Module',
      count: 2560,
    },
    {
      name: 'UniqueContainer',
      count: 2453,
    },
    {
      name: 'LinkedList',
      count: 2389,
    },
    {
      name: 'Emitter',
      count: 2055,
    },
  ]
  const after = [
    {
      name: 'LoaderEvent',
      count: 9392,
    },
    {
      name: 'Node',
      count: 5561,
    },
    {
      name: 'AsyncFunction',
      count: 4698,
    },
    {
      name: 'Module',
      count: 2560,
    },
    {
      name: 'UniqueContainer',
      count: 2460,
    },
    {
      name: 'LinkedList',
      count: 2389,
    },
    {
      name: 'Emitter',
      count: 2118,
    },
  ]
  expect(await CompareInstanceCountsDifference.compareInstanceCountsDifference(before, after)).toEqual([
    {
      name: 'UniqueContainer',
      count: 2460,
      delta: 7,
    },
    {
      name: 'Emitter',
      count: 2118,
      delta: 63,
    },
  ])
})
