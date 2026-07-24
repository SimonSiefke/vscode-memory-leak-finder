import { expect, test } from '@jest/globals'
import { compare } from '../src/parts/MeasureSetTimeoutWithStackTrace/MeasureSetTimeoutWithStackTrace.ts'

test('only reports timeout stacks that grow once per run', () => {
  const recurring = { delay: 1000, stack: 'Error\n    at recurring' }
  const oneTime = { delay: 5000, stack: 'Error\n    at oneTime' }

  expect(compare([], [...Array(17).fill(recurring), oneTime], { runs: 17 })).toEqual([
    {
      count: 17,
      delay: 1000,
      stack: ['Error', '    at recurring'],
    },
  ])
})
