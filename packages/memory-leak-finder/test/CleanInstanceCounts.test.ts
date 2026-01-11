import { test, expect } from '@jest/globals'
import * as CleanInstanceCounts from '../src/parts/CleanInstanceCounts/CleanInstanceCounts.ts'

test('cleanInstanceCounts', () => {
  const instances = [{}]
  const constructorLocations = [
    {
      columnNumber: 2776,
      lineNumber: 1552,
      scriptId: '16',
    },
  ]
  const scriptMap = {
    16: { sourceMapUrl: 'index.js.map', url: 'index.js' },
  }
  expect(CleanInstanceCounts.cleanInstanceCounts(instances, constructorLocations, scriptMap)).toEqual([
    {
      columnNumber: 2776,
      lineNumber: 1552,
      scriptId: '16',
      sourceMaps: ['index.js.map'],
      stack: ['index.js:1552:2776'],
    },
  ])
})
