import * as GetSourceMapUrlMap from '../src/parts/GetSourceMapUrlMap/GetSourceMapUrlMap.js'

test('getSourceMapUrlMap', () => {
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
    'index.js.map': [
      { line: 1, column: 1 },
      { line: 1, column: 1 },
    ],
  })
})
