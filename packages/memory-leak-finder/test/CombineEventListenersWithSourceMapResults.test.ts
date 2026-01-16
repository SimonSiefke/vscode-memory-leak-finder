import { test, expect } from '@jest/globals'
import * as CombineEventListenersWithSourceMapResults from '../src/parts/CombineEventListenersWithSourceMapResults/CombineEventListenersWithSourceMapResults.ts'
import * as GetSourceMapUrlMap from '../src/parts/GetSourceMapUrlMap/GetSourceMapUrlMap.ts'

test('combineEventListenersWithSourceMapResults', () => {
  const eventListeners = [
    {
      sourceMaps: ['index.js.map'],
      stack: ['index.js:1:1'],
    },
  ]
  const map = GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)
  const cleanPositionMap = {
    'index.js.map': [
      {
        column: 2,
        line: 2,
        name: 'test',
        source: 'index.ts',
      },
    ],
  }
  expect(
    CombineEventListenersWithSourceMapResults.combineEventListenersWithSourceMapResults(eventListeners, map, cleanPositionMap),
  ).toEqual([
    {
      originalName: 'test',
      originalStack: [`index.ts:2:2`],
      sourcesHash: null,
      stack: ['index.js:1:1'],
    },
  ])
})

test('combineEventListenersWithSourceMapResults - multiple inputs', () => {
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
  const map = GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)
  const cleanPositionMap = {
    'index.js.map': [
      {
        column: 2,
        line: 2,
        name: 'test',
        source: 'index.ts',
      },
    ],
  }
  expect(
    CombineEventListenersWithSourceMapResults.combineEventListenersWithSourceMapResults(eventListeners, map, cleanPositionMap),
  ).toEqual([
    {
      originalName: 'test',
      originalStack: [`index.ts:2:2`],
      sourcesHash: null,
      stack: ['index.js:1:1'],
    },
    {
      originalName: 'test',
      originalStack: [`index.ts:2:2`],
      sourcesHash: null,
      stack: ['index.js:1:1'],
    },
  ])
})
