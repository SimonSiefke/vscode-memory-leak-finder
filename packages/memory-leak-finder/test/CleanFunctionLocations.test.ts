import { test, expect } from '@jest/globals'
import * as CleanFunctionLocations from '../src/parts/CleanFunctionLocations/CleanFunctionLocations.ts'

test('cleanFunctionLocations', () => {
  const names = ['a', 'b']
  const counts = [2, 1]
  const functionLocations = [
    {
      columnNumber: 355,
      lineNumber: 1896,
      scriptId: '12',
    },
    {
      columnNumber: 1229,
      lineNumber: 36,
      scriptId: '12',
    },
  ]
  expect(CleanFunctionLocations.cleanFunctionLocations(names, counts, functionLocations)).toEqual([
    {
      columnNumber: 355,
      count: 2,
      lineNumber: 1896,
      name: 'a',
      scriptId: '12',
    },
    {
      columnNumber: 1229,
      count: 1,
      lineNumber: 36,
      name: 'b',
      scriptId: '12',
    },
  ])
})
