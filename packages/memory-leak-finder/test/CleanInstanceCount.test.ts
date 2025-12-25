import { test, expect } from '@jest/globals'
import * as CleanInstanceCount from '../src/parts/CleanInstanceCount/CleanInstanceCount.ts'

test('cleanInstanceCount', () => {
  const instance = {}
  const constructorLocation = {
    columnNumber: 2776,
    lineNumber: 1552,
    scriptId: '16',
  }
  const scriptMap = {
    16: { sourceMapUrl: 'index.js.map', url: 'index.js' },
  }
  expect(CleanInstanceCount.cleanInstanceCount(instance, constructorLocation, scriptMap)).toEqual({
    columnNumber: 2776,
    lineNumber: 1552,
    scriptId: '16',
    sourceMaps: ['index.js.map'],
    stack: ['index.js:1552:2776'],
  })
})
