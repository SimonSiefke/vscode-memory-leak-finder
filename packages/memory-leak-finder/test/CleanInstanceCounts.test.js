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
  const scriptMap = {}
  expect(CleanInstanceCounts.cleanInstanceCounts(instances, constructorLocations, scriptMap)).toEqual([
    {
      columnNumber: 2776,
      lineNumber: 1552,
      scriptId: '16',
      sourceMapUrl: '',
      url: '',
    },
  ])
})
