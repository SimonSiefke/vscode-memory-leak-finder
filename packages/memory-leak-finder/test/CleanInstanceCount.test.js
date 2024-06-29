import * as CleanInstanceCount from '../src/parts/CleanInstanceCount/CleanInstanceCount.js'
import { test, expect } from '@jest/globals'

test('cleanInstanceCount', () => {
  const instance = {}
  const constructorLocation = {
    scriptId: '16',
    lineNumber: 1552,
    columnNumber: 2776,
  }
  const scriptMap = {
    16: { url: 'index.js', sourceMapUrl: 'index.js.map' },
  }
  expect(CleanInstanceCount.cleanInstanceCount(instance, constructorLocation, scriptMap)).toEqual({
    columnNumber: 2776,
    lineNumber: 1552,
    scriptId: '16',
    sourceMaps: ['index.js.map'],
    stack: ['index.js:1552:2776'],
  })
})
