import * as CombineEventListenersWithSourceMapResults from '../src/parts/CombineEventListenersWithSourceMapResults/CombineEventListenersWithSourceMapResults.js'

test('combineEventListenersWithSourceMapResults', () => {
  const eventListeners = [
    {
      stack: ['index.js:1:1'],
      sourceMaps: ['index.js.map'],
    },
  ]
  const cleanPositionMap = {
    'index.js.map': [
      {
        line: 2,
        column: 2,
        source: 'index.ts',
        originalName: 'test',
      },
    ],
  }
  expect(CombineEventListenersWithSourceMapResults.combineEventListenersWithSourceMapResults(eventListeners, cleanPositionMap)).toEqual([
    {
      stack: ['index.js:1:1'],
      originalStack: [`index.ts:2:2`],
    },
  ])
})

test('combineEventListenersWithSourceMapResults - multiple inputs', () => {
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
  const cleanPositionMap = {
    'index.js.map': [
      {
        line: 2,
        column: 2,
        source: 'index.ts',
        originalName: 'test',
      },
    ],
  }
  expect(CombineEventListenersWithSourceMapResults.combineEventListenersWithSourceMapResults(eventListeners, cleanPositionMap)).toEqual([
    {
      stack: ['index.js:1:1'],
      originalStack: [`index.ts:2:2`],
    },
    {
      stack: ['index.js:1:1'],
      originalStack: [`index.ts:2:2`],
    },
  ])
})
