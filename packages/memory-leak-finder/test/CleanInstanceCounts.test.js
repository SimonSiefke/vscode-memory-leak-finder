import * as CleanInstanceCounts from '../src/parts/CleanInstanceCounts/CleanInstanceCounts.js'

test('cleanInstanceCounts', () => {
  const instances = [{}]
  const constructorLocations = [
    {
      scriptId: '16',
      lineNumber: 1552,
      columnNumber: 2776,
    },
  ]
  const scriptMap = {
    16: { url: 'index.js', sourceMapUrl: 'index.js.map' },
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
