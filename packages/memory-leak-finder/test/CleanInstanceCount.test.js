import * as CleanInstanceCount from '../src/parts/CleanInstanceCount/CleanInstanceCount.js'

test('cleanInstanceCount', () => {
  const instance = {}
  const constructorLocation = {}
  const scriptMap = {}
  expect(CleanInstanceCount.cleanInstanceCount(instance, constructorLocation, scriptMap)).toEqual({
    sourceMapUrl: '',
    url: '',
  })
})
