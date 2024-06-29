import * as GetSourceMapUrlMap from '../src/parts/GetSourceMapUrlMap/GetSourceMapUrlMap.js'
import { test, expect } from '@jest/globals'

test('getSourceMapUrlMap', () => {
  const eventListeners = [
    {
      stack: ['index.js:1:1'],
      sourceMaps: ['index.js.map'],
    },
  ]
  expect(GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)).toEqual({
    'index.js.map': [1, 1],
  })
})

test('getSourceMapUrlMap - deduplicate inputs', () => {
  const eventListeners = [
    {
      stack: ['index.js:1:1'],
      sourceMaps: ['index.js.map'],
    },
    {
      stack: ['index.js:1:1'],
      sourceMaps: ['index.js.map'],
    },
  ]
  expect(GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)).toEqual({
    'index.js.map': [1, 1],
  })
})

test('getSourceMapUrlMap - sort inputs', () => {
  const eventListeners = [
    {
      stack: ['index.js:1:1'],
      sourceMaps: ['index.js.map'],
    },
    {
      stack: ['index.js:12:1'],
      sourceMaps: ['index.js.map'],
    },
  ]
  expect(GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)).toEqual({
    'index.js.map': [1, 1, 12, 1],
  })
})
