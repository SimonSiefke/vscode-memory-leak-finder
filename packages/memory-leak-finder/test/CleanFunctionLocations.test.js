import * as CleanFunctionLocations from '../src/parts/CleanFunctionLocations/CleanFunctionLocations.js'

test.skip('cleanFunctionLocations', () => {
  const functionLocations = [
    {
      scriptId: '12',
      lineNumber: 1896,
      columnNumber: 355,
    },
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
  expect(CleanFunctionLocations.cleanFunctionLocations(functionLocations)).toEqual([
    {
      columnNumber: 355,
      count: 2,
      lineNumber: 1896,
      scriptId: '12',
    },
    {
      columnNumber: 1229,
      count: 1,
      lineNumber: 36,
      scriptId: '12',
    },
  ])
})
