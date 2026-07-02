import { test, expect } from '@jest/globals'
import * as GetSourceMapUrlMap from '../src/parts/GetSourceMapUrlMap/GetSourceMapUrlMap.ts'

test('getSourceMapUrlMap', () => {
  const eventListeners = [
    {
      sourceMaps: ['index.js.map'],
      stack: ['index.js:1:1'],
    },
  ]
  expect(GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)).toEqual({
    'index.js.map': [1, 1],
  })
})

test('getSourceMapUrlMap - deduplicate inputs', () => {
  const eventListeners = [
    {
      sourceMaps: ['index.js.map'],
      stack: ['index.js:1:1'],
    },
    {
      sourceMaps: ['index.js.map'],
      stack: ['index.js:1:1'],
    },
  ]
  expect(GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)).toEqual({
    'index.js.map': [1, 1],
  })
})

test('getSourceMapUrlMap - sort inputs', () => {
  const eventListeners = [
    {
      sourceMaps: ['index.js.map'],
      stack: ['index.js:1:1'],
    },
    {
      sourceMaps: ['index.js.map'],
      stack: ['index.js:12:1'],
    },
  ]
  expect(GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)).toEqual({
    'index.js.map': [1, 1, 12, 1],
  })
})

test('getSourceMapUrlMap - resolves relative source map against http stack url', () => {
  const eventListeners = [
    {
      sourceMaps: ['chunk.js.map'],
      stack: ['listener (http://127.0.0.1:3000/_next/static/chunks/chunk.js:0:10)'],
    },
  ]
  expect(GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)).toEqual({
    'http://127.0.0.1:3000/_next/static/chunks/chunk.js.map': [0, 10],
  })
})
