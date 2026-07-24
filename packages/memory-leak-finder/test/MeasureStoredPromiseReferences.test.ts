import { expect, test } from '@jest/globals'
import { compare } from '../src/parts/MeasureStoredPromiseReferences/MeasureStoredPromiseReferences.ts'

test('only reports promise-reference groups that grow once per run', () => {
  const before = [
    { count: 20, owner: 'Array', property: '[index]' },
    { count: 5, owner: 'Object', property: 'ready' },
  ]
  const after = [
    { count: 37, owner: 'Array', property: '[index]' },
    { count: 6, owner: 'Object', property: 'ready' },
  ]

  expect(compare(before, after, { runs: 17 })).toEqual([
    {
      count: 37,
      delta: 17,
      owner: 'Array',
      property: '[index]',
    },
  ])
})
