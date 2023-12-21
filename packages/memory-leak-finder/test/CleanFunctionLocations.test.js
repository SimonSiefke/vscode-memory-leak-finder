import * as CleanFunctionLocations from '../src/parts/CleanFunctionLocations/CleanFunctionLocations.js'

test('cleanFunctionLocations', () => {
  const names = ['a', 'b']
  const counts = [2, 1]
  const functionLocations = [
    {
      scriptId: '12',
      lineNumber: 1896,
      columnNumber: 355,
    },
    {
      scriptId: '12',
      lineNumber: 36,
      columnNumber: 1229,
    },
  ]
  expect(CleanFunctionLocations.cleanFunctionLocations(names, counts, functionLocations)).toEqual([
    {
      columnNumber: 355,
      lineNumber: 1896,
      scriptId: '12',
      count: 2,
      name: 'a',
    },
    {
      columnNumber: 1229,
      lineNumber: 36,
      scriptId: '12',
      count: 1,
      name: 'b',
    },
  ])
})
