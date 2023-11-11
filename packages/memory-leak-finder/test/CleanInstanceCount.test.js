import * as CleanInstanceCount from '../src/parts/CleanInstanceCount/CleanInstanceCount.js'

test('cleanInstanceCount', () => {
  const instance = {}
  const constructorLocation = {
    scriptId: '16',
    lineNumber: 1552,
    columnNumber: 2776,
  }
  const scriptMap = {}
  expect(CleanInstanceCount.cleanInstanceCount(instance, constructorLocation, scriptMap)).toEqual({
    columnNumber: 2776,
    lineNumber: 1552,
    scriptId: '16',
    sourceMaps: [''],
    stack: [''],
  })
})
